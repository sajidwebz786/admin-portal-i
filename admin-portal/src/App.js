import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import components
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Packs from './pages/Packs';
import PackTypes from './pages/PackTypes';
import Checkout from './pages/Checkout';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Deliveries from './pages/Deliveries';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AIAssistant from './components/AIAssistant';

// Wallet & Credits imports
import CreditPackages from './pages/CreditPackages';
import Notifications from './pages/Notifications';
import RewardSettings from './pages/RewardSettings';
import WalletManagement from './pages/WalletManagement';

// New imports
import DeleteRequests from './pages/DeleteRequests';
import DeactivatedProducts from './pages/DeactivatedProducts';
import StaffUsers from './pages/StaffUsers';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <div className="wrapper">
              <Sidebar />
              <div className="content-wrapper">
                <Header />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/packs" element={<Packs />} />
                  <Route path="/pack-types" element={<PackTypes />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/deliveries" element={<Deliveries />} />
                  
                  {/* Wallet & Credits Routes */}
                  <Route path="/credit-packages" element={<CreditPackages />} />
                  <Route path="/reward-settings" element={<RewardSettings />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/wallet-management" element={<WalletManagement />} />
                  
                  {/* New Routes */}
                  <Route path="/delete-requests" element={<DeleteRequests />} />
                  <Route path="/deactivated-products" element={<DeactivatedProducts />} />
                  <Route path="/staff-users" element={<StaffUsers />} />
                </Routes>
              </div>
              <AIAssistant />
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
