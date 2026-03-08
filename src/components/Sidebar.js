import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="main-sidebar sidebar-dark-primary elevation-4">
      <div className="brand-link">
        <div className="brand-text-center">
          <i className="fas fa-leaf brand-icon"></i>
          <span className="brand-text font-weight-bold"><img src="/logo.png" alt="Logo" style={{width:"120px"}} /></span>
          <small className="brand-subtitle">Admin Portal</small>
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
            <li className="nav-header text-uppercase px-3 mb-2" style={{color: '#adb5bd', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px'}}>
              Main Navigation
            </li>
            <li className="nav-item">
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                <i className="nav-icon fas fa-tachometer-alt"></i>
                <p>Dashboard</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/categories" className={`nav-link ${isActive('/categories')}`}>
                <i className="nav-icon fas fa-th"></i>
                <p>Categories</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/products" className={`nav-link ${isActive('/products')}`}>
                <i className="nav-icon fas fa-box"></i>
                <p>Products</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/packs" className={`nav-link ${isActive('/packs')}`}>
                <i className="nav-icon fas fa-cubes"></i>
                <p>Packs</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/pack-types" className={`nav-link ${isActive('/pack-types')}`}>
                <i className="nav-icon fas fa-tags"></i>
                <p>Pack Types</p>
              </Link>
            </li>

            <li className="nav-header text-uppercase px-3 mb-2 mt-3" style={{color: '#adb5bd', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px'}}>
              Business Operations
            </li>

            <li className="nav-item">
              <Link to="/customers" className={`nav-link ${isActive('/customers')}`}>
                <i className="nav-icon fas fa-users"></i>
                <p>Customers</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/customer-addresses" className={`nav-link ${isActive('/customer-addresses')}`}>
                <i className="nav-icon fas fa-address-book"></i>
                <p>Customer Addresses</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
                <i className="nav-icon fas fa-shopping-cart"></i>
                <p>Orders</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/payments" className={`nav-link ${isActive('/payments')}`}>
                <i className="nav-icon fas fa-credit-card"></i>
                <p>Payments</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/deliveries" className={`nav-link ${isActive('/deliveries')}`}>
                <i className="nav-icon fas fa-truck"></i>
                <p>Deliveries</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/reports" className={`nav-link ${isActive('/reports')}`}>
                <i className="nav-icon fas fa-chart-bar"></i>
                <p>Reports</p>
              </Link>
            </li>

            <li className="nav-header text-uppercase px-3 mb-2" style={{color: '#adb5bd', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px'}}>
              Settings & Configuration
            </li>
            <li className="nav-item">
              <Link to="/reward-settings" className={`nav-link ${isActive('/reward-settings')}`}>
                <i className="nav-icon fas fa-gift"></i>
                <p>Reward Settings</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/deactivated-products" className={`nav-link ${isActive('/deactivated-products')}`}>
                <i className="nav-icon fas fa-ban"></i>
                <p>Deactivated Products</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/users" className={`nav-link ${isActive('/users')}`}>
                <i className="nav-icon fas fa-user-cog"></i>
                <p>User Management</p>
              </Link>
            </li>

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