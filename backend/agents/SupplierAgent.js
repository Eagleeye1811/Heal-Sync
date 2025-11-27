// backend/agents/SupplierAgent.js
const { subscribe, publish } = require('../eventBus');
const EVENTS = require('../constants/events');

class SupplierAgent {
  constructor(id, worldState, log) {
    this.id = id;
    this.worldState = worldState;
    this.log = log;

    subscribe('MEDICINE_SHORTAGE_RISK', this.onMedicineShortage.bind(this));
    subscribe('HOSPITAL_OVERLOAD_RISK', this.onHospitalOverload.bind(this));
    subscribe('EQUIPMENT_SHORTAGE', this.onEquipmentShortage.bind(this));
  }

  start() {
    // Log initialization
    const s = this.worldState.suppliers[this.id];
    const itemCount = Object.keys(s.inventory || {}).length;
    const vehicleCount = Object.keys(s.fleet || {}).length;
    this.log(
      `✅ Supplier Agent ${this.id} (${s.name}) initialized - ${itemCount} items in warehouse | ${vehicleCount} vehicles`,
      { agent: 'Supplier', type: 'INIT', entityId: this.id }
    );

    // Periodic inventory check every 15 seconds (faster for demo)
    setInterval(() => this.tick(), 15000);
  }

  tick() {
    const s = this.worldState.suppliers[this.id];
    if (!s) return;

    // Count low inventory items
    const lowStockItems = Object.entries(s.inventory).filter(([_, item]) => {
      const stock = item.stock || item;
      return typeof stock === 'number' && stock < 100;
    }).length;

    // Count active orders
    const activeOrders = s.activeOrders?.length || 0;
    
    // Count available vehicles
    const availableVehicles = s.fleet ? 
      Object.values(s.fleet).filter(v => v.status === 'available').length : 0;
    const totalVehicles = s.fleet ? Object.keys(s.fleet).length : 0;

    // ALWAYS log current status
    const status = activeOrders > 2 ? '🟡 BUSY' : '🟢 READY';
    this.log(
      `${s.name}: ${status} | ${activeOrders} active orders | ${lowStockItems} low stock alerts | ${availableVehicles}/${totalVehicles} vehicles ready`,
      { agent: 'Supplier', type: 'STATUS', entityId: this.id, activeOrders, lowStockItems }
    );

    // Check for low inventory levels
    this.checkInventoryLevels(s);
    
    // Process pending orders
    this.processActiveOrders(s);
  }

  checkInventoryLevels(supplier) {
    Object.keys(supplier.inventory).forEach(item => {
      const itemData = supplier.inventory[item];
      const stock = itemData.stock || itemData; // Handle both object and number formats
      
      if (typeof stock === 'number' && stock < 100) {
        this.log(
          `[Supplier ${this.id}] Low inventory warning: ${item} = ${stock} units`,
          { agent: 'Supplier', type: 'LOW_INVENTORY', item, stock }
        );
      }
    });
  }

  processActiveOrders(supplier) {
    if (supplier.activeOrders && supplier.activeOrders.length > 0) {
      // Sort orders by priority (urgency and criticality)
      const prioritizedOrders = this.prioritizeOrders(supplier.activeOrders);
      
      // Process top priority orders
      prioritizedOrders.slice(0, 3).forEach(order => {
        this.fulfillOrder(supplier, order);
      });
    }
  }

  prioritizeOrders(orders) {
    return orders.sort((a, b) => {
      // Calculate priority score
      const scoreA = this.calculateOrderPriority(a);
      const scoreB = this.calculateOrderPriority(b);
      return scoreB - scoreA; // Higher score first
    });
  }

  calculateOrderPriority(order) {
    let score = 0;
    
    // Urgency scoring
    if (order.urgency === 'high') score += 50;
    else if (order.urgency === 'medium') score += 30;
    else score += 10;
    
    // Criticality scoring
    if (order.criticality === 'high') score += 30;
    else if (order.criticality === 'medium') score += 15;
    
    // Zone risk (if available)
    if (order.zoneRisk === 'high') score += 20;
    
    // From hospital vs pharmacy (hospitals get priority)
    if (order.hospitalId) score += 15;
    
    return score;
  }

  onMedicineShortage(event) {
    const s = this.worldState.suppliers[this.id];
    if (!s) return;

    const { 
      medicine, 
      zone, 
      pharmacyId,
      pharmacyName,
      stock, 
      orderQuantity, 
      urgency, 
      criticality,
      supplier 
    } = event;

    // Check if we're the designated supplier for this pharmacy
    if (supplier && supplier !== this.id) return;

    this.log(
      `📥 ${s.name}: ${urgency?.toUpperCase() || 'NORMAL'} PRIORITY order received from ${pharmacyName || 'Pharmacy'} - ${medicine} (${orderQuantity} units needed)`,
      { agent: 'Supplier', type: 'ORDER_RECEIVED', entityId: this.id, pharmacyId, medicine, zone, urgency }
    );

    const itemData = s.inventory[medicine];
    if (!itemData) {
      this.log(
        `❌ ${s.name}: Cannot fulfill order - ${medicine} not in our inventory catalog`,
        { agent: 'Supplier', type: 'NOT_AVAILABLE', entityId: this.id, pharmacyId, medicine, zone }
      );
      return;
    }

    const available = itemData.stock || itemData;
    if (available <= 0) {
      this.log(
        `❌ ${s.name}: Cannot supply ${medicine} to ${pharmacyName || 'Pharmacy'} - OUT OF STOCK`,
        { agent: 'Supplier', type: 'NO_SUPPLY', entityId: this.id, pharmacyId, medicine, zone }
      );
      
      publish('SUPPLY_UNAVAILABLE', {
        supplierId: this.id,
        supplierName: s.name,
        pharmacyId,
        medicine,
        zone
      });
      return;
    }

    // Determine quantity to send
    const requestedQty = orderQuantity || Math.max(stock * 2, 50);
    const quantity = Math.min(available, requestedQty);

    // Update inventory
    if (typeof itemData === 'object') {
      itemData.stock -= quantity;
    } else {
      s.inventory[medicine] -= quantity;
    }

    // Calculate ETA based on delivery fleet
    const eta = this.calculateDeliveryETA(s, zone);

    const remainingStock = itemData.stock || s.inventory[medicine];
    this.log(
      `✅ ${s.name}: Order CONFIRMED - Dispatching ${quantity} units of ${medicine} to ${zone} | ETA: ${eta}h | Warehouse remaining: ${remainingStock} units`,
      { 
        agent: 'Supplier', 
        type: 'SUPPLY_CONFIRMED', 
        entityId: this.id,
        pharmacyId, 
        medicine, 
        quantity, 
        zone,
        urgency,
        eta
      }
    );

    // Log coordination message
    this.log(
      `📡 ${s.name}: Confirming delivery to ${pharmacyName || 'pharmacy'} - ${quantity} units of ${medicine} dispatched to ${zone}`,
      { 
        agent: 'Supplier', 
        type: 'COORDINATION', 
        entityId: this.id,
        recipient: pharmacyName || pharmacyId,
        medicine,
        quantity,
        zone
      }
    );

    // Add to active orders
    const order = {
      orderId: `ORD-${Date.now()}`,
      pharmacyId,
      medicine,
      quantity,
      zone,
      urgency,
      criticality,
      status: 'dispatched',
      timestamp: new Date().toISOString(),
      eta: `${eta} hours`
    };
    s.activeOrders.push(order);

    // Publish confirmation
    publish('SUPPLY_CONFIRMED', {
      supplierId: this.id,
      pharmacyId,
      medicine,
      quantity,
      zone,
      eta: `${eta} hours`,
      orderId: order.orderId
    });

    // Allocate delivery vehicle
    if (s.fleet && s.fleet.available > 0) {
      s.fleet.available--;
      s.fleet.inTransit++;
      
      // Simulate delivery completion (in real system, this would be actual tracking)
      setTimeout(() => {
        this.completeDelivery(s, order);
      }, eta * 1000); // Simulate in seconds for demo (normally would be hours)
    }
  }

  calculateDeliveryETA(supplier, zone) {
    if (!supplier.fleet) return 2; // Default 2 hours
    
    const baseTime = supplier.fleet.avgDeliveryTime || 2;
    // Add delay if fleet is busy
    const utilizationFactor = supplier.fleet.inTransit / supplier.fleet.vehicles;
    return baseTime + (utilizationFactor * 0.5);
  }

  completeDelivery(supplier, order) {
    // Return vehicle to available pool
    if (supplier.fleet) {
      supplier.fleet.available++;
      supplier.fleet.inTransit--;
    }

    // Update order status
    const orderIndex = supplier.activeOrders.findIndex(o => o.orderId === order.orderId);
    if (orderIndex >= 0) {
      supplier.activeOrders[orderIndex].status = 'delivered';
      
      // Remove after 1 minute (keep for reference briefly)
      setTimeout(() => {
        supplier.activeOrders.splice(orderIndex, 1);
      }, 60000);
    }

    this.log(
      `[Supplier ${this.id}] Delivery completed: ${order.medicine} to Pharmacy ${order.pharmacyId}`,
      { agent: 'Supplier', type: 'DELIVERY_COMPLETE', orderId: order.orderId }
    );

    publish('DELIVERY_COMPLETE', {
      supplierId: this.id,
      orderId: order.orderId,
      pharmacyId: order.pharmacyId,
      medicine: order.medicine
    });
  }

  fulfillOrder(supplier, order) {
    // Process orders from activeOrders array
    if (order.status === 'dispatched' || order.status === 'delivered') return;
    
    // Similar logic to onMedicineShortage
    const itemData = supplier.inventory[order.medicine];
    if (!itemData) return;

    const available = itemData.stock || itemData;
    if (available <= 0) return;

    const quantity = Math.min(available, order.quantity);
    
    if (typeof itemData === 'object') {
      itemData.stock -= quantity;
    } else {
      supplier.inventory[order.medicine] -= quantity;
    }

    order.status = 'dispatched';
    order.actualQuantity = quantity;
  }

  onHospitalOverload(event) {
    const s = this.worldState.suppliers[this.id];
    if (!s) return;

    const { hospitalId, occupancy, zone, name } = event;

    // Check if we have critical equipment available
    const ventilators = s.inventory.ventilators;
    const hasVentilators = ventilators && (ventilators.stock || ventilators) > 0;

    if (hasVentilators) {
      this.log(
        `[Supplier ${this.id}] Hospital ${name || hospitalId} overload detected (${Math.round(occupancy * 100)}% occupancy). Ventilators available for priority supply.`,
        { agent: 'Supplier', type: 'OVERLOAD_RESPONSE', hospitalId, zone, hasVentilators }
      );
    } else {
      this.log(
        `[Supplier ${this.id}] Hospital ${name || hospitalId} overload noted but no ventilators available.`,
        { agent: 'Supplier', type: 'OVERLOAD_NOTICE', hospitalId, zone }
      );
    }
  }

  onEquipmentShortage(event) {
    const s = this.worldState.suppliers[this.id];
    if (!s) return;

    const { hospitalId, zone, equipment, available, total } = event;
    
    const equipmentData = s.inventory[equipment];
    if (!equipmentData) return;

    const stock = equipmentData.stock || equipmentData;
    if (stock > 0) {
      // Can supply equipment
      const quantityToSend = Math.min(stock, Math.ceil((total - available) * 0.5));
      
      this.log(
        `[Supplier ${this.id}] Critical ${equipment} shortage at Hospital ${hospitalId}. Preparing ${quantityToSend} units for priority delivery.`,
        { agent: 'Supplier', type: 'EQUIPMENT_SUPPLY', hospitalId, equipment, quantity: quantityToSend }
      );

      // In a real system, this would trigger equipment delivery
      if (typeof equipmentData === 'object') {
        equipmentData.stock -= quantityToSend;
      } else {
        s.inventory[equipment] -= quantityToSend;
      }
    }
  }
}

module.exports = SupplierAgent;
