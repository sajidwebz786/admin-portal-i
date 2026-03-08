import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAllowedMenuItems, getCurrentUserRole } from '../utils/permissions';

const Sidebar = () => {
  const location = useLocation();
  const userRole = getCurrentUserRole();
  const allowedMenuItems = getAllowedMenuItems();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrator',
      manager: 'Manager',
      staff: 'Staff',
      delivery: 'Delivery'
    };
    return labels[role] || role;
  };

  return (
    <aside className="main-sidebar sidebar-dark-primary elevation-4">
      <div className="brand-link">
        <div className="brand-text-center">
          <i className="fas fa-leaf brand-icon"></i>
          <span className="brand-text font-weight-bold"><img src="/logo.png" alt="Logo" style={{width:"120px"}} /></span>
          <small className="brand-subtitle">{getRoleLabel(userRole)}</small>
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
            {/* Main Navigation */}
            {allowedMenuItems.some(item => item.path === '/') && (
              <li className="nav-header text-uppercase px-3 mb-2" style={{color: '#adb5bd', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px'}}>
                Main Navigation
              </li>
            )}
            
            {allowedMenuItems.filter(item => ['/', '/categories', '/products', '/packs', '/pack-types'].includes(item.path)).map((item) => (
              <li className="nav-item" key={item.path}>
                <Link to={item.path} className={`nav-link ${isActive(item.path)}`}>
                  <i className={`nav-icon fas ${item.icon}`}></i>
                  <p>{item.label}</p>
                </Link>
              </li>
            ))}

            {/* Business Operations */}
            {allowedMenuItems.some(item => ['/customers', '/customer-addresses', '/orders', '/payments', '/deliveries', '/reports'].includes(item.path)) && (
              <li className="nav-header text-uppercase px-3 mb-2 mt-3" style={{color: '#adb5bd', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px'}}>
                Business Operations
              </li>
            )}

            {allowedMenuItems.filter(item => ['/customers', '/customer-addresses', '/orders', '/payments', '/deliveries', '/reports'].includes(item.path)).map((item) => (
              <li className="nav-item" key={item.path}>
                <Link to={item.path} className={`nav-link ${isActive(item.path)}`}>
                  <i className={`nav-icon fas ${item.icon}`}></i>
                  <p>{item.label}</p>
                </Link>
              </li>
            ))}

            {/* Settings & Configuration */}
            {allowedMenuItems.some(item => ['/reward-settings', '/deactivated-products', '/users'].includes(item.path)) && (
              <li className="nav-header text-uppercase px-3 mb-2" style={{color: '#adb5bd', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px'}}>
                Settings & Configuration
              </li>
            )}

            {allowedMenuItems.filter(item => ['/reward-settings', '/deactivated-products', '/users'].includes(item.path)).map((item) => (
              <li className="nav-item" key={item.path}>
                <Link to={item.path} className={`nav-link ${isActive(item.path)}`}>
                  <i className={`nav-icon fas ${item.icon}`}></i>
                  <p>{item.label}</p>
                </Link>
              </li>
            ))}

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
