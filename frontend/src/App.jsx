// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicDashboard from './pages/PublicDashboard';
import CityDashboard from './pages/CityDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import LabDashboard from './pages/LabDashboard';
import SupplierDashboard from './pages/SupplierDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - default landing page */}
        <Route path="/" element={<PublicDashboard />} />
        
        {/* City Command Center - for professionals/demo */}
        <Route path="/city" element={<CityDashboard />} />
        
        {/* Role-specific dashboards */}
        <Route path="/hospital/:hospitalId" element={<HospitalDashboard />} />
        <Route path="/lab/:labId" element={<LabDashboard />} />
        <Route path="/pharmacy/:pharmacyId" element={<PharmacyDashboard />} />
        <Route path="/supplier/:supplierId" element={<SupplierDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
