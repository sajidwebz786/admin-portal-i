import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const Sidebar = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        setUser(JSON.parse(adminUser));
      } catch (error) {
        console.error('Error parsing adminUser:', error);
      }
    }
  }, []);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <aside className="main-sidebar sidebar-dark-primary elevation-4">
      <div className="brand-link">
        <div className="brand-text-center">
          <i className="fas fa-leaf brand-icon"></i>
          <span className="brand-text font-weight-bold"><img src="/logo.png" alt="Logo" style={{width:"120px"}} /></span>
          <small className="brand-subtitle">
            {isAdmin ? 'Admin Portal' : isStaff ? 'Staff Portal' : 'Admin Portal'}
          </small>
        </div>
      </div>

      <div className="sidebar">

        <nav className="mt-3">
          <ul
            className="nav nav-pills nav-sidebar flex-column"
            data-widget="treeview"
            role="menu"
            data-accordion="false"
          >
            {/* Role-based header */}
            <li className="nav-header text-uppercase px-3 mb-2" style={{color: '#adb5bd', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px'}}>
              {isStaff ? 'Staff Operations' : 'Main Navigation'}
            </li>
            <li className="nav-item">
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                <i className="nav-icon fas fa-tachometer-alt"></i>
                <p>Dashboard</p>
              </Link>
            </li>

            {/* Categories - Both Admin and Staff */}
            <li className="nav-item">
              <Link to="/categories" className={`nav-link ${isActive('/categories')}`}>
                <i className="nav-icon fas fa-th"></i>
                <p>Categories</p>
              </Link>
            </li>

            {/* Products - Both Admin and Staff */}
            <li className="nav-item">
              <Link to="/products" className={`nav-link ${isActive('/products')}`}>
                <i className="nav-icon fas fa-box"></i>
                <p>Products</p>
              </Link>
            </li>

            {/* Packs - Both Admin and Staff */}
            <li className="nav-item">
              <Link to="/packs" className={`nav-link ${isActive('/packs')}`}>
                <i className="nav-icon fas fa-cubes"></i>
                <p>Packs</p>
              </Link>
            </li>

            {/* Pack Types - Admin only */}
            {isAdmin && (
              <li className="nav-item">
                <Link to="/pack-types" className={`nav-link ${isActive('/pack-types')}`}>
                  <i className="nav-icon fas fa-tags"></i>
                  <p>Pack Types</p>
                </Link>
              </li>
            )}

            {/* Business Operations Header */}
            <li className="nav-header text-uppercase px-3 mb-2 mt-3" style={{color: '#adb5bd', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px'}}>
              Business Operations
            </li>

            {/* Cart - Both */}
            <li className="nav-item">
              <Link to="/checkout" className={`nav-link ${isActive('/checkout')}`}>
                <i className="nav-icon fas fa-shopping-cart"></i>
                <p>Cart</p>
              </Link>
            </li>

            {/* Customers - Both */}
            <li className="nav-item">
              <Link to="/customers" className={`nav-link ${isActive('/customers')}`}>
                <i className="nav-icon fas fa-users"></i>
                <p>Customers</p>
              </Link>
            </li>

            {/* Orders - Both */}
            <li className="nav-item">
              <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
                <i className="nav-icon fas fa-shopping-cart"></i>
                <p>Orders</p>
              </Link>
            </li>

            {/* Payments - Both */}
            <li className="nav-item">
              <Link to="/payments" className={`nav-link ${isActive('/payments')}`}>
                <i className="nav-icon fas fa-credit-card"></i>
                <p>Payments</p>
              </Link>
            </li>

            {/* Deliveries - Both */}
            <li className="nav-item">
              <Link to="/deliveries" className={`nav-link ${isActive('/deliveries')}`}>
                <i className="nav-icon fas fa-truck"></i>
                <p>Deliveries</p>
              </Link>
            </li>

            {/* Wallet & Credits - Admin only */}
            {isAdmin && (
              <>
                <li className="nav-header text-uppercase px-3 mb-2 mt-3" style={{color: '#adb5bd', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px'}}>
                  Wallet & Credits
                </li>
                <li className="nav-item">
                  <Link to="/credit-packages" className={`nav-link ${isActive('/credit-packages')}`}>
                    <i className="nav-icon fas fa-coins"></i>
                    <p>Credit Packages</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/reward-settings" className={`nav-link ${isActive('/reward-settings')}`}>
                    <i className="nav-icon fas fa-gift"></i>
                    <p>Reward Settings</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/wallet-management" className={`nav-link ${isActive('/wallet-management')}`}>
                    <i className="nav-icon fas fa-wallet"></i>
                    <p>Wallet Management</p>
                  </Link>
                </li>
              </>
            )}

            {/* Notifications - Both */}
            <li className="nav-item">
              <Link to="/notifications" className={`nav-link ${isActive('/notifications')}`}>
                <i className="nav-icon fas fa-bell"></i>
                <p>Notifications</p>
              </Link>
            </li>

            {/* Deactivated Products - Both Admin and Staff */}
            <li className="nav-item">
              <Link to="/deactivated-products" className={`nav-link ${isActive('/deactivated-products')}`}>
                <i className="nav-icon fas fa-ban"></i>
                <p>Deactivated Products</p>
              </Link>
            </li>

            {/* System Management - Admin only */}
            {isAdmin && (
              <>
                <li className="nav-header text-uppercase px-3 mb-2 mt-3" style={{color: '#adb5bd', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px'}}>
                  System Management
                </li>
                <li className="nav-item">
                  <Link to="/delete-requests" className={`nav-link ${isActive('/delete-requests')}`}>
                    <i className="nav-icon fas fa-exclamation-circle"></i>
                    <p>Delete Requests</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/staff-users" className={`nav-link ${isActive('/staff-users')}`}>
                    <i className="nav-icon fas fa-user-shield"></i>
                    <p>Staff Users</p>
                  </Link>
                </li>
              </>
            )}

            {/* Logout */}
            <li className="nav-header">SYSTEM</li>
            <li className="nav-item">
              <a
                href="#"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (window.confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/login';
                  }
                }}
              >
                <i className="nav-icon fas fa-sign-out-alt"></i>
                <p>Logout</p>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
