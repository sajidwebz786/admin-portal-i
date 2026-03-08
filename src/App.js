import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Import permissions
import { canAccessRoute, getCurrentUserRole, hasPermission } from './utils/permissions';

// Protected Route Component
const ProtectedRoute = ({ children, requiredPermission }) => {
  const location = useLocation();
  const adminToken = localStorage.getItem('adminToken');
  
  // Check if user is logged in
  if (!adminToken) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has permission for this route
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

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
                  <Route 
                    path="/categories" 
                    element={
                      <ProtectedRoute requiredPermission="canManageCategories">
                        <Categories />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/products" 
                    element={
                      <ProtectedRoute requiredPermission="canManageProducts">
                        <Products />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/packs" 
                    element={
                      <ProtectedRoute requiredPermission="canManagePacks">
                        <Packs />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/pack-types" 
                    element={
                      <ProtectedRoute requiredPermission="canManagePacks">
                        <PackTypes />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route 
                    path="/customers" 
                    element={
                      <ProtectedRoute requiredPermission="canManageCustomers">
                        <Customers />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/orders" 
                    element={
                      <ProtectedRoute requiredPermission="canManageOrders">
                        <Orders />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/payments" 
                    element={
                      <ProtectedRoute requiredPermission="canManagePayments">
                        <Payments />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/deliveries" 
                    element={
                      <ProtectedRoute requiredPermission="canManageDeliveries">
                        <Deliveries />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/reports" 
                    element={
                      <ProtectedRoute requiredPermission="canManageReports">
                        <Reports />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/reward-settings" 
                    element={
                      <ProtectedRoute requiredPermission="canManageRewardSettings">
                        <RewardSettings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/deactivated-products" 
                    element={
                      <ProtectedRoute requiredPermission="canManageDeactivatedProducts">
                        <DeactivatedProducts />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/users" 
                    element={
                      <ProtectedRoute requiredPermission="canManageUsers">
                        <UserManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/customer-addresses" 
                    element={
                      <ProtectedRoute requiredPermission="canManageAddresses">
                        <CustomerAddresses />
                      </ProtectedRoute>
                    } 
                  />
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
