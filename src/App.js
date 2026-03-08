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
import Reports from './pages/Reports';
import RewardSettings from './pages/RewardSettings';
import DeactivatedProducts from './pages/DeactivatedProducts';
import UserManagement from './pages/UserManagement';
import CustomerAddresses from './pages/CustomerAddresses';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AIAssistant from './components/AIAssistant';

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
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/reward-settings" element={<RewardSettings />} />
                  <Route path="/deactivated-products" element={<DeactivatedProducts />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/customer-addresses" element={<CustomerAddresses />} />
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
