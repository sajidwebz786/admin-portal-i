import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { notificationService, api } from '../services/api';
import { authService } from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');

  // Get current user
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (filter === 'unread') {
        params.isRead = false;
      } else if (filter === 'read') {
        params.isRead = true;
      }

      const response = await notificationService.getAll(params);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Notifications error:', error);
      setError(`Failed to load notifications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setSuccess('All notifications marked as read');
      fetchNotifications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await notificationService.delete(id);
        setSuccess('Notification deleted');
        fetchNotifications();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'credit_purchase':
        return '💳';
      case 'order':
        return '📦';
      case 'payment':
        return '💰';
      case 'wallet':
        return '👛';
      case 'system':
        return '⚙️';
      case 'delete_request':
        return '🗑️';
      default:
        return '🔔';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="badge badge-danger">High</span>;
      case 'normal':
        return <span className="badge badge-info">Normal</span>;
      case 'low':
        return <span className="badge badge-secondary">Low</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Redirect if not authenticated
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 text-center">
              <div className="spinner" style={{ margin: '50px auto' }}></div>
              <p>Loading notifications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-2">
          <div className="col-sm-6">
            <h1>Notifications</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <a href="#">Home</a>
              </li>
              <li className="breadcrumb-item active">Notifications</li>
            </ol>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-danger alert-dismissible">
                <button
                  type="button"
                  className="close"
                  onClick={() => setError('')}
                >
                  ×
                </button>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-success alert-dismissible">
                <button
                  type="button"
                  className="close"
                  onClick={() => setSuccess('')}
                >
                  ×
                </button>
                {success}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row mb-3">
          <div className="col-md-3">
            <div className="small-box bg-info">
              <div className="inner">
                <h3>{unreadCount}</h3>
                <p>Unread Notifications</p>
              </div>
              <div className="icon">
                <i className="fas fa-bell"></i>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="small-box bg-success">
              <div className="inner">
                <h3>{notifications.filter(n => n.type === 'credit_purchase').length}</h3>
                <p>Credit Purchases</p>
              </div>
              <div className="icon">
                <i className="fas fa-credit-card"></i>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="small-box bg-warning">
              <div className="inner">
                <h3>{notifications.filter(n => n.type === 'order').length}</h3>
                <p>New Orders</p>
              </div>
              <div className="icon">
                <i className="fas fa-shopping-cart"></i>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="small-box bg-danger">
              <div className="inner">
                <h3>{notifications.filter(n => n.actionRequired).length}</h3>
                <p>Action Required</p>
              </div>
              <div className="icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Actions */}
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="btn-group">
              <button
                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-default'}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-default'}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button
                className={`btn ${filter === 'read' ? 'btn-primary' : 'btn-default'}`}
                onClick={() => setFilter('read')}
              >
                Read
              </button>
            </div>
          </div>
          <div className="col-md-6">
            <button
              className="btn btn-success float-right"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <i className="fas fa-check-double"></i> Mark All as Read
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">All Notifications</h3>
              </div>
              <div className="card-body p-0">
                {notifications.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No notifications found</p>
                  </div>
                ) : (
                  <div className="timeline">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="time-label">
                        <div
                          className={`direct-chat-msg ${!notification.isRead ? 'unread' : ''}`}
                          style={{ padding: '10px', background: notification.isRead ? '#fff' : '#f8f9fa' }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="d-flex">
                              <div
                                className="direct-chat-infos clearfix"
                                style={{ marginLeft: '10px' }}
                              >
                                <span className="direct-chat-name float-left" style={{ fontSize: '16px', fontWeight: notification.isRead ? 'normal' : 'bold' }}>
                                  {getNotificationIcon(notification.type)} {notification.title}
                                </span>
                                <span className="direct-chat-timestamp float-right" style={{ marginLeft: '10px', fontSize: '12px' }}>
                                  {formatDate(notification.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="d-flex align-items-center">
                              {getPriorityBadge(notification.priority)}
                              {notification.actionRequired && (
                                <span className="badge badge-danger ml-2">Action Required</span>
                              )}
                            </div>
                          </div>
                          <div className="direct-chat-text" style={{ margin: '5px 0 0 0', border: 'none', padding: '0' }}>
                            <p className="mb-1" style={{ margin: '5px 0' }}>{notification.message}</p>
                            {notification.User && (
                              <small className="text-muted">
                                User: {notification.User.name} ({notification.User.email})
                              </small>
                            )}
                          </div>
                          <div className="mt-2">
                            {!notification.isRead && (
                              <button
                                className="btn btn-xs btn-info mr-2"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <i className="fas fa-check"></i> Mark as Read
                              </button>
                            )}
                            <button
                              className="btn btn-xs btn-danger"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
