import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deleteRequestService, notificationService } from '../services/api';

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load dark mode preference from localStorage
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    }

    // Load sidebar state from localStorage
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setIsSidebarCollapsed(sidebarCollapsed);
    if (sidebarCollapsed) {
      document.body.classList.add('sidebar-collapse');
    }

    // Load user data from localStorage
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const parsedUser = JSON.parse(adminUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing adminUser from localStorage:', error);
    }
    }
  }, []);

  // Fetch pending delete requests count and notifications for admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPendingRequests();
      fetchNotifications();
      
      // Set up interval to refresh data
      const interval = setInterval(() => {
        fetchPendingRequests();
        fetchNotifications();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    try {
      const response = await deleteRequestService.getPendingCount();
      setPendingRequestsCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getAll({ limit: 5 });
      setNotifications(response.data.notifications || response.data || []);
      const unreadResponse = await notificationService.getUnreadCount();
      setUnreadCount(unreadResponse.data.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleToggleSidebar = () => {
    const newCollapsedState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsedState);
    localStorage.setItem('sidebarCollapsed', newCollapsedState.toString());

    if (newCollapsedState) {
      document.body.classList.add('sidebar-collapse');
    } else {
      document.body.classList.remove('sidebar-collapse');
    }
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return 'fa-shopping-cart';
      case 'delete_request':
        return 'fa-exclamation-circle';
      case 'system':
        return 'fa-user-plus';
      case 'payment':
        return 'fa-credit-card';
      default:
        return 'fa-bell';
    }
  };

  const totalNotifications = pendingRequestsCount + unreadCount;

  return (
    <nav className="main-header navbar navbar-expand navbar-white navbar-light">
      <ul className="navbar-nav">
        <li className="nav-item">
          <button
            className="nav-link"
            data-widget="pushmenu"
            onClick={handleToggleSidebar}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <i className="fas fa-bars"></i>
          </button>
        </li>
        <li className="nav-item d-none d-sm-inline-block">
          <a href="#" className="nav-link">
            Home
          </a>
        </li>
      </ul>

      <ul className="navbar-nav ml-auto">
        {/* Delete Requests Badge - Only for Admin */}
        {user && user.role === 'admin' && pendingRequestsCount > 0 && (
          <li className="nav-item dropdown">
            <Link className="nav-link" to="/delete-requests">
              <i className="far fa-exclamation-circle"></i>
              <span className="badge badge-danger navbar-badge">{pendingRequestsCount}</span>
            </Link>
          </li>
        )}

        {/* Notifications Dropdown */}
        <li className="nav-item dropdown">
          <a className="nav-link" data-toggle="dropdown" href="#">
            <i className="far fa-bell"></i>
            {totalNotifications > 0 && (
              <span className="badge badge-warning navbar-badge">{totalNotifications}</span>
            )}
          </a>
          <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
            <span className="dropdown-item dropdown-header">
              {totalNotifications > 0 ? `${totalNotifications} Notifications` : 'No Notifications'}
            </span>
            <div className="dropdown-divider"></div>
            
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="dropdown-item">
                  <i className={`fas ${getNotificationIcon(notification.type)} mr-2`}></i>
                  <div>
                    <strong>{notification.title}</strong>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                      {notification.message}
                    </p>
                    <small className="text-muted">
                      {new Date(notification.createdAt).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <a href="#" className="dropdown-item">
                <i className="fas fa-bell mr-2"></i> No new notifications
              </a>
            )}
            
            <div className="dropdown-divider"></div>
            <Link to="/notifications" className="dropdown-item dropdown-footer">
              View All Notifications
            </Link>
          </div>
        </li>

        <li className="nav-item">
          <a
            className="nav-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleToggleDarkMode();
            }}
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </a>
        </li>

        <li className="nav-item">
          <span className="nav-link">
            <img
              src="/logo.png"
              className="user-image elevation-2"
              alt="User Avatar"
              style={{ width: '30px', height: 'auto', marginRight: '8px' }}
            />
            <span className="d-none d-md-inline" style={{ marginRight: '15px' }}>
              {user ? user.name || user.email || 'Admin' : 'Admin'}
              {user && user.role === 'admin' && (
                <span className="badge badge-success ml-1">Admin</span>
              )}
              {user && user.role === 'staff' && (
                <span className="badge badge-info ml-1">Staff</span>
              )}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm('Are you sure you want to logout?')) {
                  localStorage.removeItem('adminToken');
                  localStorage.removeItem('adminUser');
                  window.location.href = '/login';
                }
              }}
              style={{ border: 'none', background: 'transparent', color: '#6c757d' }}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </span>
        </li>
      </ul>
    </nav>
  );
};

export default Header;
