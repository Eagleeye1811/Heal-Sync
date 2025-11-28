// backend/worldState.js
// Comprehensive World State for HealSync
// Multi-agent healthcare coordination system

const worldState = {
  // ============================================
  // HOSPITALS - Multiple facilities across zones
  // ============================================
  hospitals: {
    H1: {
      id: "H1",
      name: "City Central Hospital",
      type: "Multi-specialty Tertiary Care",
      zone: "Zone-1",
      address: "Andheri West, Mumbai",
      coordinates: { lat: 19.1136, lng: 72.8697 },
      
      // Bed capacity by type
      beds: {
        general: { total: 100, used: 65, reserved: 10 },
        icu: { total: 20, used: 12, reserved: 3 },
        isolation: { total: 30, used: 8, reserved: 5 },
        pediatric: { total: 40, used: 25, reserved: 5 },
        maternity: { total: 20, used: 15, reserved: 2 }
      },
      
      // Equipment tracking
      equipment: {
        ventilators: { total: 15, inUse: 8, maintenance: 1, available: 6 },
        oxygenCylinders: { total: 100, inUse: 45, empty: 10, available: 45 },
        xrayMachines: { total: 3, inUse: 2, maintenance: 0, available: 1 },
        ctScanners: { total: 2, inUse: 1, maintenance: 0, available: 1 },
        ambulances: { total: 8, available: 5, onRoute: 3, maintenance: 0 }
      },
      
      // Staff information
      staff: {
        doctors: { total: 45, onDuty: 30, available: 25, onLeave: 5 },
        nurses: { total: 120, onDuty: 80, available: 70, onLeave: 10 },
        specialists: {
          infectiousDisease: 5,
          pulmonology: 3,
          pediatrics: 8,
          emergency: 12,
          generalMedicine: 17
        }
      },
      
      // Patient flow metrics
      patientMetrics: {
        inflowPerHour: 12,
        avgStayDuration: 48, // hours
        dischargesPerDay: 20,
        emergencyCases: 8,
        outpatients: 45,
        admissionsToday: 38
      },
      
      // Department status
      departments: {
        emergency: { status: "normal", waitTime: 15, queue: 8 },
        icu: { status: "busy", waitTime: 0, beds: 8 },
        outpatient: { status: "crowded", waitTime: 60, queue: 45 },
        laboratory: { status: "normal", waitTime: 30 }
      },
      
      // Disease-specific preparation
      diseasePrep: {
        dengue: { prepared: false, wardReady: false, medicineStock: "low", staffAlerted: false },
        malaria: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
        covid: { prepared: true, wardReady: true, medicineStock: "high", staffAlerted: true },
        typhoid: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
        influenza: { prepared: true, wardReady: true, medicineStock: "adequate", staffAlerted: true }
      },
      
      // Historical data for trends
      history: {
        bedsUsed: [60, 62, 65, 63, 61, 65, 65], // last 7 days
        patientInflow: [10, 11, 12, 10, 9, 12, 12], // last 7 days
        emergencyCases: [6, 7, 8, 7, 6, 8, 8] // last 7 days
      }
    },
    
    H2: {
      id: "H2",
      name: "Sunrise Hospital",
      type: "General Hospital",
      zone: "Zone-2",
      address: "Bandra East, Mumbai",
      coordinates: { lat: 19.0596, lng: 72.8656 },
      
      beds: {
        general: { total: 80, used: 40, reserved: 8 },
        icu: { total: 10, used: 6, reserved: 2 },
        isolation: { total: 20, used: 5, reserved: 3 },
        pediatric: { total: 30, used: 18, reserved: 4 },
        maternity: { total: 15, used: 10, reserved: 2 }
      },
      
      equipment: {
        ventilators: { total: 10, inUse: 4, maintenance: 0, available: 6 },
        oxygenCylinders: { total: 80, inUse: 30, empty: 8, available: 42 },
        xrayMachines: { total: 2, inUse: 1, maintenance: 0, available: 1 },
        ctScanners: { total: 1, inUse: 0, maintenance: 0, available: 1 },
        ambulances: { total: 6, available: 4, onRoute: 2, maintenance: 0 }
      },
      
      staff: {
        doctors: { total: 35, onDuty: 25, available: 20, onLeave: 3 },
        nurses: { total: 90, onDuty: 60, available: 55, onLeave: 8 },
        specialists: {
          infectiousDisease: 3,
          pulmonology: 2,
          pediatrics: 6,
          emergency: 8,
          generalMedicine: 16
        }
      },
      
      patientMetrics: {
        inflowPerHour: 8,
        avgStayDuration: 36,
        dischargesPerDay: 15,
        emergencyCases: 6,
        outpatients: 35,
        admissionsToday: 28
      },
      
      departments: {
        emergency: { status: "normal", waitTime: 20, queue: 6 },
        icu: { status: "normal", waitTime: 0, beds: 4 },
        outpatient: { status: "normal", waitTime: 45, queue: 35 },
        laboratory: { status: "normal", waitTime: 25 }
      },
      
      diseasePrep: {
        dengue: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
        malaria: { prepared: false, wardReady: false, medicineStock: "low", staffAlerted: false },
        covid: { prepared: true, wardReady: true, medicineStock: "adequate", staffAlerted: true },
        typhoid: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
        influenza: { prepared: false, wardReady: false, medicineStock: "low", staffAlerted: false }
      },
      
      history: {
        bedsUsed: [38, 39, 40, 39, 37, 40, 40],
        patientInflow: [7, 8, 8, 7, 7, 8, 8],
        emergencyCases: [5, 6, 6, 5, 5, 6, 6]
      }
    },
    
    H3: {
      id: "H3",
      name: "Children's Hospital",
      type: "Pediatric Specialty Hospital",
      zone: "Zone-1",
      address: "Juhu, Mumbai",
      coordinates: { lat: 19.1075, lng: 72.8263 },
      
      beds: {
        general: { total: 60, used: 35, reserved: 8 },
        icu: { total: 15, used: 8, reserved: 3 },
        isolation: { total: 25, used: 6, reserved: 4 },
        pediatric: { total: 80, used: 50, reserved: 10 },
        maternity: { total: 0, used: 0, reserved: 0 }
      },
      
      equipment: {
        ventilators: { total: 12, inUse: 6, maintenance: 0, available: 6 },
        oxygenCylinders: { total: 70, inUse: 28, empty: 6, available: 36 },
        xrayMachines: { total: 2, inUse: 1, maintenance: 0, available: 1 },
        ctScanners: { total: 1, inUse: 0, maintenance: 1, available: 0 },
        ambulances: { total: 5, available: 3, onRoute: 2, maintenance: 0 }
      },
      
      staff: {
        doctors: { total: 30, onDuty: 22, available: 18, onLeave: 2 },
        nurses: { total: 80, onDuty: 55, available: 50, onLeave: 5 },
        specialists: {
          infectiousDisease: 4,
          pulmonology: 3,
          pediatrics: 18,
          emergency: 5,
          generalMedicine: 0
        }
      },
      
      patientMetrics: {
        inflowPerHour: 10,
        avgStayDuration: 30,
        dischargesPerDay: 18,
        emergencyCases: 7,
        outpatients: 40,
        admissionsToday: 32
      },
      
      departments: {
        emergency: { status: "busy", waitTime: 25, queue: 10 },
        icu: { status: "normal", waitTime: 0, beds: 7 },
        outpatient: { status: "crowded", waitTime: 50, queue: 40 },
        laboratory: { status: "normal", waitTime: 20 }
      },
      
      diseasePrep: {
        dengue: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
        malaria: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
        covid: { prepared: true, wardReady: true, medicineStock: "high", staffAlerted: true },
        typhoid: { prepared: false, wardReady: false, medicineStock: "low", staffAlerted: false },
        influenza: { prepared: true, wardReady: true, medicineStock: "high", staffAlerted: true }
      },
      
      history: {
        bedsUsed: [33, 34, 35, 34, 33, 35, 35],
        patientInflow: [9, 10, 10, 9, 9, 10, 10],
        emergencyCases: [6, 7, 7, 6, 6, 7, 7]
      }
    },
    
    H4: {
      id: "H4",
      name: "Community Clinic",
      type: "Primary Healthcare Center",
      zone: "Zone-3",
      address: "Goregaon, Mumbai",
      coordinates: { lat: 19.1700, lng: 72.8500 },
      
      beds: {
        general: { total: 40, used: 18, reserved: 4 },
        icu: { total: 5, used: 2, reserved: 1 },
        isolation: { total: 15, used: 3, reserved: 2 },
        pediatric: { total: 20, used: 10, reserved: 3 },
        maternity: { total: 10, used: 5, reserved: 1 }
      },
      
      equipment: {
        ventilators: { total: 5, inUse: 2, maintenance: 0, available: 3 },
        oxygenCylinders: { total: 40, inUse: 12, empty: 4, available: 24 },
        xrayMachines: { total: 1, inUse: 0, maintenance: 0, available: 1 },
        ctScanners: { total: 0, inUse: 0, maintenance: 0, available: 0 },
        ambulances: { total: 3, available: 2, onRoute: 1, maintenance: 0 }
      },
      
      staff: {
        doctors: { total: 15, onDuty: 12, available: 10, onLeave: 1 },
        nurses: { total: 40, onDuty: 28, available: 25, onLeave: 3 },
        specialists: {
          infectiousDisease: 1,
          pulmonology: 1,
          pediatrics: 3,
          emergency: 4,
          generalMedicine: 6
        }
      },
      
      patientMetrics: {
        inflowPerHour: 5,
        avgStayDuration: 24,
        dischargesPerDay: 10,
        emergencyCases: 4,
        outpatients: 25,
        admissionsToday: 15
      },
      
      departments: {
        emergency: { status: "normal", waitTime: 10, queue: 4 },
        icu: { status: "normal", waitTime: 0, beds: 3 },
        outpatient: { status: "normal", waitTime: 30, queue: 25 },
        laboratory: { status: "normal", waitTime: 20 }
      },
      
      diseasePrep: {
        dengue: { prepared: false, wardReady: false, medicineStock: "low", staffAlerted: false },
        malaria: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
        covid: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
        typhoid: { prepared: false, wardReady: false, medicineStock: "low", staffAlerted: false },
        influenza: { prepared: false, wardReady: false, medicineStock: "low", staffAlerted: false }
      },
      
      history: {
        bedsUsed: [16, 17, 18, 17, 16, 18, 18],
        patientInflow: [4, 5, 5, 4, 4, 5, 5],
        emergencyCases: [3, 4, 4, 3, 3, 4, 4]
      }
    }
  },

  // ============================================
  // LABS - Diagnostic facilities
  // ============================================
  labs: {
    L1: {
      id: "L1",
      name: "Metro Diagnostics",
      type: "Full-service Diagnostic Lab",
      zone: "Zone-2",
      address: "Bandra West, Mumbai",
      coordinates: { lat: 19.0596, lng: 72.8295 },
      
      // Multi-disease tracking
      testData: {
        dengue: {
          today: 30,
          history: [10, 14, 18, 22, 26, 30], // last 6 days
          capacity: 100,
          positiveRate: 0.15, // 15% positive
          avgTurnaround: 4 // hours
        },
        malaria: {
          today: 15,
          history: [8, 9, 12, 13, 15, 15],
          capacity: 80,
          positiveRate: 0.10,
          avgTurnaround: 3
        },
        covid: {
          today: 45,
          history: [60, 55, 50, 48, 47, 45],
          capacity: 200,
          positiveRate: 0.08,
          avgTurnaround: 6
        },
        typhoid: {
          today: 8,
          history: [5, 6, 7, 7, 8, 8],
          capacity: 50,
          positiveRate: 0.12,
          avgTurnaround: 5
        },
        influenza: {
          today: 120,
          history: [80, 90, 100, 110, 115, 120],
          capacity: 150,
          positiveRate: 0.20,
          avgTurnaround: 2
        }
      },
      
      // Lab capacity
      queueLength: 25,
      avgWaitTime: 45, // minutes
      staffOnDuty: 8,
      operatingHours: "24/7",
      testsCompletedToday: 218,
      testsPending: 25
    },
    
    L2: {
      id: "L2",
      name: "East Side Labs",
      type: "Community Diagnostic Center",
      zone: "Zone-1",
      address: "Andheri East, Mumbai",
      coordinates: { lat: 19.1197, lng: 72.8682 },
      
      testData: {
        dengue: {
          today: 18,
          history: [6, 8, 10, 12, 15, 18],
          capacity: 60,
          positiveRate: 0.12,
          avgTurnaround: 5
        },
        malaria: {
          today: 10,
          history: [5, 6, 7, 8, 9, 10],
          capacity: 50,
          positiveRate: 0.08,
          avgTurnaround: 4
        },
        covid: {
          today: 30,
          history: [42, 38, 35, 33, 31, 30],
          capacity: 120,
          positiveRate: 0.06,
          avgTurnaround: 6
        },
        typhoid: {
          today: 5,
          history: [3, 3, 4, 4, 5, 5],
          capacity: 30,
          positiveRate: 0.10,
          avgTurnaround: 5
        },
        influenza: {
          today: 85,
          history: [55, 60, 70, 75, 80, 85],
          capacity: 100,
          positiveRate: 0.18,
          avgTurnaround: 3
        }
      },
      
      queueLength: 18,
      avgWaitTime: 35,
      staffOnDuty: 6,
      operatingHours: "8 AM - 8 PM",
      testsCompletedToday: 148,
      testsPending: 18
    }
  },

  // ============================================
  // PHARMACIES - Medicine distribution points
  // ============================================
  pharmacies: {
    P1: {
      id: "P1",
      name: "HealthPlus Pharmacy",
      type: "24-hour Retail Pharmacy",
      zone: "Zone-2",
      address: "Bandra West, Mumbai",
      coordinates: { lat: 19.0596, lng: 72.8295 },
      
      // Comprehensive medicine inventory
      medicines: {
        // Antivirals
        dengueMed: {
          stock: 50,
          reorderPoint: 20,
          dailyUsage: 5,
          price: 150,
          criticality: "high",
          expiryDate: "2025-12-31",
          supplier: "S1"
        },
        oseltamivir: {
          stock: 80,
          reorderPoint: 30,
          dailyUsage: 8,
          price: 200,
          criticality: "high",
          expiryDate: "2025-11-30",
          supplier: "S1"
        },
        acyclovir: {
          stock: 120,
          reorderPoint: 40,
          dailyUsage: 10,
          price: 180,
          criticality: "medium",
          expiryDate: "2026-01-31",
          supplier: "S1"
        },
        
        // Antibiotics
        azithromycin: {
          stock: 200,
          reorderPoint: 80,
          dailyUsage: 25,
          price: 120,
          criticality: "high",
          expiryDate: "2025-12-15",
          supplier: "S1"
        },
        ciprofloxacin: {
          stock: 180,
          reorderPoint: 70,
          dailyUsage: 20,
          price: 100,
          criticality: "high",
          expiryDate: "2026-02-28",
          supplier: "S1"
        },
        amoxicillin: {
          stock: 300,
          reorderPoint: 100,
          dailyUsage: 40,
          price: 80,
          criticality: "medium",
          expiryDate: "2025-11-30",
          supplier: "S1"
        },
        
        // Anti-malarials
        chloroquine: {
          stock: 60,
          reorderPoint: 20,
          dailyUsage: 6,
          price: 140,
          criticality: "high",
          expiryDate: "2026-03-31",
          supplier: "S1"
        },
        artemether: {
          stock: 45,
          reorderPoint: 15,
          dailyUsage: 4,
          price: 220,
          criticality: "high",
          expiryDate: "2025-12-31",
          supplier: "S1"
        },
        
        // Pain/Fever
        paracetamol: {
          stock: 500,
          reorderPoint: 150,
          dailyUsage: 50,
          price: 20,
          criticality: "low",
          expiryDate: "2026-06-30",
          supplier: "S1"
        },
        ibuprofen: {
          stock: 400,
          reorderPoint: 120,
          dailyUsage: 35,
          price: 25,
          criticality: "low",
          expiryDate: "2026-05-31",
          supplier: "S1"
        },
        
        // Hydration
        ors: {
          stock: 150,
          reorderPoint: 50,
          dailyUsage: 20,
          price: 15,
          criticality: "medium",
          expiryDate: "2027-12-31",
          supplier: "S1"
        },
        ivFluids: {
          stock: 100,
          reorderPoint: 30,
          dailyUsage: 15,
          price: 50,
          criticality: "high",
          expiryDate: "2026-12-31",
          supplier: "S1"
        },
        
        // Vaccines
        covidVaccine: {
          stock: 200,
          reorderPoint: 50,
          dailyUsage: 50,
          price: 500,
          criticality: "high",
          expiryDate: "2025-12-31",
          supplier: "S2"
        },
        fluVaccine: {
          stock: 150,
          reorderPoint: 40,
          dailyUsage: 30,
          price: 400,
          criticality: "medium",
          expiryDate: "2025-12-31",
          supplier: "S2"
        },
        
        // Anti-typhoid
        ceftriaxone: {
          stock: 70,
          reorderPoint: 25,
          dailyUsage: 8,
          price: 180,
          criticality: "high",
          expiryDate: "2026-01-31",
          supplier: "S1"
        }
      },
      
      // Pharmacy metrics
      metrics: {
        prescriptionsFilled: 120,
        avgWaitTime: 10, // minutes
        customersServed: 250,
        revenueToday: 45000
      },
      
      // Pending orders
      pendingOrders: [],
      
      operatingHours: "24/7"
    },
    
    P2: {
      id: "P2",
      name: "MediCare Pharmacy",
      type: "Retail Pharmacy",
      zone: "Zone-1",
      address: "Andheri West, Mumbai",
      coordinates: { lat: 19.1136, lng: 72.8697 },
      
      medicines: {
        dengueMed: { stock: 80, reorderPoint: 25, dailyUsage: 7, price: 150, criticality: "high", expiryDate: "2025-12-31", supplier: "S1" },
        oseltamivir: { stock: 100, reorderPoint: 35, dailyUsage: 10, price: 200, criticality: "high", expiryDate: "2025-11-30", supplier: "S1" },
        acyclovir: { stock: 150, reorderPoint: 50, dailyUsage: 12, price: 180, criticality: "medium", expiryDate: "2026-01-31", supplier: "S1" },
        azithromycin: { stock: 250, reorderPoint: 90, dailyUsage: 30, price: 120, criticality: "high", expiryDate: "2025-12-15", supplier: "S1" },
        ciprofloxacin: { stock: 220, reorderPoint: 80, dailyUsage: 25, price: 100, criticality: "high", expiryDate: "2026-02-28", supplier: "S1" },
        amoxicillin: { stock: 350, reorderPoint: 120, dailyUsage: 45, price: 80, criticality: "medium", expiryDate: "2025-11-30", supplier: "S1" },
        chloroquine: { stock: 70, reorderPoint: 25, dailyUsage: 7, price: 140, criticality: "high", expiryDate: "2026-03-31", supplier: "S1" },
        artemether: { stock: 55, reorderPoint: 20, dailyUsage: 5, price: 220, criticality: "high", expiryDate: "2025-12-31", supplier: "S1" },
        paracetamol: { stock: 600, reorderPoint: 180, dailyUsage: 60, price: 20, criticality: "low", expiryDate: "2026-06-30", supplier: "S1" },
        ibuprofen: { stock: 480, reorderPoint: 140, dailyUsage: 42, price: 25, criticality: "low", expiryDate: "2026-05-31", supplier: "S1" },
        ors: { stock: 180, reorderPoint: 60, dailyUsage: 24, price: 15, criticality: "medium", expiryDate: "2027-12-31", supplier: "S1" },
        ivFluids: { stock: 120, reorderPoint: 35, dailyUsage: 18, price: 50, criticality: "high", expiryDate: "2026-12-31", supplier: "S1" },
        covidVaccine: { stock: 250, reorderPoint: 60, dailyUsage: 60, price: 500, criticality: "high", expiryDate: "2025-12-31", supplier: "S2" },
        fluVaccine: { stock: 180, reorderPoint: 50, dailyUsage: 35, price: 400, criticality: "medium", expiryDate: "2025-12-31", supplier: "S2" },
        ceftriaxone: { stock: 85, reorderPoint: 30, dailyUsage: 10, price: 180, criticality: "high", expiryDate: "2026-01-31", supplier: "S1" }
      },
      
      metrics: {
        prescriptionsFilled: 140,
        avgWaitTime: 12,
        customersServed: 280,
        revenueToday: 52000
      },
      
      pendingOrders: [],
      operatingHours: "8 AM - 10 PM"
    },
    
    P3: {
      id: "P3",
      name: "Express Pharmacy",
      type: "Quick Service Pharmacy",
      zone: "Zone-3",
      address: "Goregaon East, Mumbai",
      coordinates: { lat: 19.1700, lng: 72.8500 },
      
      medicines: {
        dengueMed: { stock: 40, reorderPoint: 15, dailyUsage: 4, price: 150, criticality: "high", expiryDate: "2025-12-31", supplier: "S2" },
        oseltamivir: { stock: 50, reorderPoint: 20, dailyUsage: 5, price: 200, criticality: "high", expiryDate: "2025-11-30", supplier: "S2" },
        acyclovir: { stock: 80, reorderPoint: 30, dailyUsage: 7, price: 180, criticality: "medium", expiryDate: "2026-01-31", supplier: "S2" },
        azithromycin: { stock: 150, reorderPoint: 60, dailyUsage: 18, price: 120, criticality: "high", expiryDate: "2025-12-15", supplier: "S2" },
        ciprofloxacin: { stock: 120, reorderPoint: 50, dailyUsage: 15, price: 100, criticality: "high", expiryDate: "2026-02-28", supplier: "S2" },
        amoxicillin: { stock: 200, reorderPoint: 80, dailyUsage: 28, price: 80, criticality: "medium", expiryDate: "2025-11-30", supplier: "S2" },
        chloroquine: { stock: 45, reorderPoint: 18, dailyUsage: 4, price: 140, criticality: "high", expiryDate: "2026-03-31", supplier: "S2" },
        artemether: { stock: 35, reorderPoint: 12, dailyUsage: 3, price: 220, criticality: "high", expiryDate: "2025-12-31", supplier: "S2" },
        paracetamol: { stock: 400, reorderPoint: 120, dailyUsage: 40, price: 20, criticality: "low", expiryDate: "2026-06-30", supplier: "S2" },
        ibuprofen: { stock: 320, reorderPoint: 100, dailyUsage: 28, price: 25, criticality: "low", expiryDate: "2026-05-31", supplier: "S2" },
        ors: { stock: 100, reorderPoint: 40, dailyUsage: 16, price: 15, criticality: "medium", expiryDate: "2027-12-31", supplier: "S2" },
        ivFluids: { stock: 70, reorderPoint: 25, dailyUsage: 12, price: 50, criticality: "high", expiryDate: "2026-12-31", supplier: "S2" },
        covidVaccine: { stock: 120, reorderPoint: 30, dailyUsage: 30, price: 500, criticality: "high", expiryDate: "2025-12-31", supplier: "S2" },
        fluVaccine: { stock: 100, reorderPoint: 30, dailyUsage: 20, price: 400, criticality: "medium", expiryDate: "2025-12-31", supplier: "S2" },
        ceftriaxone: { stock: 50, reorderPoint: 18, dailyUsage: 6, price: 180, criticality: "high", expiryDate: "2026-01-31", supplier: "S2" }
      },
      
      metrics: {
        prescriptionsFilled: 85,
        avgWaitTime: 8,
        customersServed: 180,
        revenueToday: 32000
      },
      
      pendingOrders: [],
      operatingHours: "9 AM - 9 PM"
    }
  },

  // ============================================
  // SUPPLIERS - Warehouse and distribution
  // ============================================
  suppliers: {
    S1: {
      id: "S1",
      name: "MediSupply Co.",
      type: "Pharmaceutical Distributor",
      zone: "Central",
      address: "Andheri MIDC, Mumbai",
      coordinates: { lat: 19.1197, lng: 72.8682 },
      
      // Comprehensive warehouse inventory
      inventory: {
        dengueMed: { stock: 500, incoming: 200, deliveryETA: "2 days", cost: 100 },
        oseltamivir: { stock: 800, incoming: 0, deliveryETA: null, cost: 150 },
        acyclovir: { stock: 1000, incoming: 300, deliveryETA: "3 days", cost: 130 },
        azithromycin: { stock: 2000, incoming: 500, deliveryETA: "1 day", cost: 80 },
        ciprofloxacin: { stock: 1800, incoming: 0, deliveryETA: null, cost: 70 },
        amoxicillin: { stock: 3000, incoming: 1000, deliveryETA: "2 days", cost: 50 },
        chloroquine: { stock: 600, incoming: 200, deliveryETA: "4 days", cost: 100 },
        artemether: { stock: 450, incoming: 100, deliveryETA: "3 days", cost: 180 },
        paracetamol: { stock: 10000, incoming: 2000, deliveryETA: "1 day", cost: 10 },
        ibuprofen: { stock: 8000, incoming: 0, deliveryETA: null, cost: 15 },
        ors: { stock: 5000, incoming: 1000, deliveryETA: "2 days", cost: 8 },
        ivFluids: { stock: 2000, incoming: 500, deliveryETA: "1 day", cost: 30 },
        ceftriaxone: { stock: 800, incoming: 200, deliveryETA: "2 days", cost: 120 },
        
        // Equipment
        ventilators: { stock: 50, incoming: 10, deliveryETA: "7 days", cost: 150000 },
        oxygenCylinders: { stock: 500, incoming: 100, deliveryETA: "1 day", cost: 500 },
        ivStands: { stock: 200, incoming: 50, deliveryETA: "3 days", cost: 1000 },
        ppe: { stock: 10000, incoming: 5000, deliveryETA: "2 days", cost: 50 }
      },
      
      // Delivery fleet
      fleet: {
        vehicles: 15,
        available: 10,
        inTransit: 5,
        avgDeliveryTime: 2 // hours within city
      },
      
      // Active orders from pharmacies/hospitals
      activeOrders: [],
      
      // Operational constraints
      constraints: {
        maxDailyOrders: 50,
        currentOrders: 12,
        workingHours: "6 AM - 10 PM"
      }
    },
    
    S2: {
      id: "S2",
      name: "QuickMed Distributors",
      type: "Fast Delivery Pharma Supply",
      zone: "North",
      address: "Malad Industrial Area, Mumbai",
      coordinates: { lat: 19.1863, lng: 72.8490 },
      
      inventory: {
        dengueMed: { stock: 300, incoming: 150, deliveryETA: "1 day", cost: 105 },
        oseltamivir: { stock: 500, incoming: 100, deliveryETA: "2 days", cost: 155 },
        acyclovir: { stock: 700, incoming: 200, deliveryETA: "2 days", cost: 135 },
        azithromycin: { stock: 1500, incoming: 300, deliveryETA: "1 day", cost: 85 },
        ciprofloxacin: { stock: 1200, incoming: 200, deliveryETA: "1 day", cost: 75 },
        amoxicillin: { stock: 2500, incoming: 500, deliveryETA: "1 day", cost: 55 },
        chloroquine: { stock: 400, incoming: 100, deliveryETA: "3 days", cost: 105 },
        artemether: { stock: 300, incoming: 50, deliveryETA: "2 days", cost: 185 },
        paracetamol: { stock: 8000, incoming: 1000, deliveryETA: "1 day", cost: 12 },
        ibuprofen: { stock: 6000, incoming: 500, deliveryETA: "1 day", cost: 18 },
        ors: { stock: 4000, incoming: 500, deliveryETA: "1 day", cost: 10 },
        ivFluids: { stock: 1500, incoming: 300, deliveryETA: "1 day", cost: 35 },
        ceftriaxone: { stock: 600, incoming: 100, deliveryETA: "1 day", cost: 125 },
        
        // Vaccines (specialty of S2)
        covidVaccine: { stock: 2000, incoming: 500, deliveryETA: "1 day", cost: 400 },
        fluVaccine: { stock: 1500, incoming: 300, deliveryETA: "2 days", cost: 350 },
        
        // Basic equipment
        oxygenCylinders: { stock: 300, incoming: 50, deliveryETA: "1 day", cost: 520 },
        ppe: { stock: 8000, incoming: 2000, deliveryETA: "1 day", cost: 55 }
      },
      
      fleet: {
        vehicles: 12,
        available: 8,
        inTransit: 4,
        avgDeliveryTime: 1.5 // Faster delivery
      },
      
      activeOrders: [],
      
      constraints: {
        maxDailyOrders: 40,
        currentOrders: 8,
        workingHours: "7 AM - 9 PM"
      }
    }
  },

  // ============================================
  // ENVIRONMENT - Weather and external factors
  // ============================================
  environment: {
    weather: {
      "Zone-1": {
        temperature: 35, // Celsius
        humidity: 75,
        forecast: "heatwave",
        aqiIndex: 180, // Air Quality - unhealthy
        uvIndex: 9,
        rainfall: 0,
        windSpeed: 12
      },
      "Zone-2": {
        temperature: 32,
        humidity: 85, // High humidity - mosquito breeding
        forecast: "heavy-rain",
        aqiIndex: 120,
        uvIndex: 6,
        rainfall: 45, // mm
        windSpeed: 18
      },
      "Zone-3": {
        temperature: 28,
        humidity: 60,
        forecast: "clear",
        aqiIndex: 80,
        uvIndex: 7,
        rainfall: 0,
        windSpeed: 10
      }
    },
    
    season: "monsoon", // Dengue risk higher
    
    cityEvents: [
      { type: "marathon", date: "2025-12-01", expectedParticipants: 10000, zone: "Zone-1" },
      { type: "festival", date: "2025-12-05", crowdSize: 50000, zone: "Zone-2" },
      { type: "school-opening", date: "2025-12-10", students: 100000, zone: "all" }
    ],
    
    waterQuality: {
      "Zone-1": "good",
      "Zone-2": "contaminated", // Typhoid risk
      "Zone-3": "good"
    }
  },

  // ============================================
  // CITY - Overall coordination and monitoring
  // ============================================
  city: {
    name: "Mumbai",
    population: 1200000,
    
    zones: {
      "Zone-1": {
        name: "West Mumbai (Andheri, Juhu)",
        population: 400000,
        area: "35 sq km",
        hospitals: ["H1", "H3"],
        labs: ["L2"],
        pharmacies: ["P2"],
        coordinates: { lat: 19.1136, lng: 72.8697 }
      },
      "Zone-2": {
        name: "Central Mumbai (Bandra, Khar)",
        population: 500000,
        area: "42 sq km",
        hospitals: ["H2"],
        labs: ["L1"],
        pharmacies: ["P1"],
        coordinates: { lat: 19.0596, lng: 72.8656 }
      },
      "Zone-3": {
        name: "North Mumbai (Goregaon, Malad)",
        population: 300000,
        area: "38 sq km",
        hospitals: ["H4"],
        labs: [],
        pharmacies: ["P3"],
        coordinates: { lat: 19.1700, lng: 72.8500 }
      }
    },
    
    // Active health alerts
    activeAlerts: [],
    
    // Zone-wise risk assessment
    riskZones: {
      "Zone-1": {
        dengue: "low",
        malaria: "low",
        covid: "low",
        typhoid: "low",
        influenza: "medium",
        heatwave: "high", // 35°C
        airQuality: "poor",
        waterborne: "low",
        overall: "medium"
      },
      "Zone-2": {
        dengue: "medium", // Will become high
        malaria: "medium",
        covid: "low",
        typhoid: "high", // Contaminated water
        influenza: "medium",
        heatwave: "medium",
        airQuality: "moderate",
        waterborne: "high",
        overall: "high"
      },
      "Zone-3": {
        dengue: "low",
        malaria: "low",
        covid: "low",
        typhoid: "low",
        influenza: "low",
        heatwave: "low",
        airQuality: "good",
        waterborne: "low",
        overall: "low"
      }
    },
    
    // Disease statistics (citywide)
    diseaseStats: {
      dengue: { activeCases: 245, deaths: 2, recovered: 180, newToday: 48 },
      malaria: { activeCases: 120, deaths: 1, recovered: 95, newToday: 25 },
      covid: { activeCases: 450, deaths: 5, recovered: 400, newToday: 75 },
      typhoid: { activeCases: 80, deaths: 0, recovered: 65, newToday: 13 },
      influenza: { activeCases: 1200, deaths: 0, recovered: 1050, newToday: 205 }
    },
    
    // Aggregate resource availability
    totalResources: {
      beds: { total: 290, used: 178, available: 112, utilization: 0.61 },
      icuBeds: { total: 50, used: 28, available: 22, utilization: 0.56 },
      ventilators: { total: 45, used: 20, available: 25, utilization: 0.44 },
      ambulances: { total: 25, available: 14, busy: 11, utilization: 0.44 },
      doctors: { total: 125, onDuty: 89, available: 73 },
      nurses: { total: 330, onDuty: 223, available: 200 }
    },
    
    // System metrics
    systemMetrics: {
      avgResponseTime: 18, // minutes from alert to action
      alertsToday: 3,
      coordinationsToday: 7,
      stockoutsPrevent: 4,
      lastUpdated: new Date().toISOString()
    }
  }
};

module.exports = worldState;
