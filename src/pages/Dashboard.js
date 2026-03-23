import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { categoryService, productService, packService, orderService, userService, notificationService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    customers: 0,
    packs: 0,
    orders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      loadNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      // Load notifications from server API
      const response = await notificationService.getAll({ limit: 50 });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback to localStorage if API fails
      const storedNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      setNotifications(storedNotifications);
      setUnreadCount(storedNotifications.filter(n => !n.read).length);
    }
  };

  const markNotificationRead = async (index) => {
    const notification = notifications[index];
    if (notification && notification.id) {
      try {
        await notificationService.markAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    // Update local state
    const updated = [...notifications];
    updated[index].isRead = true;
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.isRead).length);
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
    setNotifications([]);
    setUnreadCount(0);
  };

  const addNotification = (type, title, message, details = {}) => {
    // This function is kept for backwards compatibility with local notifications
    // New notifications come from the server via loadNotifications
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      details,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    setUnreadCount(prev => prev + 1);
  };

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setShowModal(true);
    setDetailsLoading(true);
    try {
      // Try to fetch full order details from API
      const orderId = order._id || order.id;
      const response = await orderService.getById(orderId);
      // Merge API response with local order data to ensure all fields are available
      setOrderDetails({ ...order, ...response.data });
    } catch (error) {
      console.error('Error fetching order details:', error);
      // Fallback to the order data we already have
      setOrderDetails(order);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setOrderDetails(null);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the API services which handle authentication automatically
      const [categoriesRes, productsRes, usersRes, packsRes, ordersRes] = await Promise.all([
        categoryService.getAll().catch(() => ({ data: [] })),
        productService.getAll().catch(() => ({ data: [] })),
        userService.getAll().catch(() => ({ data: [] })),
        packService.getAll().catch(() => ({ data: [] })),
        orderService.getAll().catch(() => ({ data: [] })),
      ]);

      const allUsers = usersRes.data || [];
      const customersList = allUsers.filter(u => u.role === 'customer');

      setStats({
        categories: categoriesRes.data?.length || 0,
        products: productsRes.data?.length || 0,
        customers: customersList.length || 0,
        packs: packsRes.data?.length || 0,
        orders: ordersRes.data?.length || 0,
      });

      // Sort orders by date and get most recent 5
      const orders = ordersRes.data || [];
      const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentOrders(sortedOrders.slice(0, 5));

      // Sort customers by date and get most recent 5
      const sortedCustomers = customersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentCustomers(sortedCustomers.slice(0, 5));

      // Check for new orders that haven't been notified
      const storedNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      const lastOrderNotification = storedNotifications.find(n => n.type === 'new_order');
      const lastTime = lastOrderNotification ? new Date(lastOrderNotification.timestamp) : new Date(0);
      
      // If there are orders created after last notification, add notification
      const newOrders = sortedOrders.filter(o => new Date(o.createdAt) > lastTime);
      if (newOrders.length > 0 && storedNotifications.length > 0) {
        const latestOrder = newOrders[0];
        addNotification(
          'new_order',
          'New Order Received!',
          `Order #${latestOrder.orderNumber || latestOrder._id?.substring(0, 8)} has been placed`,
          { orderId: latestOrder._id, total: latestOrder.total }
        );
      }

    } catch (error) {
      console.error('Dashboard error:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not authenticated
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    return <Navigate to="/login" replace />;
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'staff_deleted':
        return 'fa-user-minus text-danger';
      case 'new_order':
        return 'fa-shopping-cart text-success';
      case 'new_customer':
        return 'fa-user-plus text-info';
      case 'product_deletion_request':
        return 'fa-trash-alt text-warning';
      default:
        return 'fa-bell text-warning';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDeliveryDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long',
      day: '2-digit', 
      month: 'long', 
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">Dashboard</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="content">
          <div className="container-fluid">
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Dashboard</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item">
                  <a href="#">Home</a>
                </li>
                <li className="breadcrumb-item active">Dashboard</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          {/* Error Alert */}
          {error && (
            <div className="row mb-4">
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

          {/* Stats Cards */}
          <div className="row">
            <div className="col-lg-3 col-6">
              <div className="small-box bg-info">
                <div className="inner">
                  <h3>{stats.categories}</h3>
                  <p>Categories</p>
                </div>
                <div className="icon">
                  <i className="fas fa-th"></i>
                </div>
                <Link to="/categories" className="small-box-footer">
                  More info <i className="fas fa-arrow-circle-right"></i>
                </Link>
              </div>
            </div>

            <div className="col-lg-3 col-6">
              <div className="small-box bg-success">
                <div className="inner">
                  <h3>{stats.products}</h3>
                  <p>Products</p>
                </div>
                <div className="icon">
                  <i className="fas fa-box"></i>
                </div>
                <Link to="/products" className="small-box-footer">
                  More info <i className="fas fa-arrow-circle-right"></i>
                </Link>
              </div>
            </div>

            <div className="col-lg-3 col-6">
              <div className="small-box bg-warning">
                <div className="inner">
                  <h3>{stats.packs}</h3>
                  <p>Packs</p>
                </div>
                <div className="icon">
                  <i className="fas fa-cubes"></i>
                </div>
                <Link to="/packs" className="small-box-footer">
                  More info <i className="fas fa-arrow-circle-right"></i>
                </Link>
              </div>
            </div>

            <div className="col-lg-3 col-6">
              <div className="small-box bg-danger">
                <div className="inner">
                  <h3>{stats.customers}</h3>
                  <p>Customers</p>
                </div>
                <div className="icon">
                  <i className="fas fa-users"></i>
                </div>
                <Link to="/customers" className="small-box-footer">
                  More info <i className="fas fa-arrow-circle-right"></i>
                </Link>
              </div>
            </div>

            <div className="col-lg-3 col-6">
              <div className="small-box bg-primary">
                <div className="inner">
                  <h3>{stats.orders}</h3>
                  <p>Orders</p>
                </div>
                <div className="icon">
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <Link to="/orders" className="small-box-footer">
                  More info <i className="fas fa-arrow-circle-right"></i>
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Deliveries - New Orders from Mobile App */}
          <div className="row mb-4">
            <div className="col-12 d-flex justify-content-center">
              <div className="card card-success" style={{ maxWidth: '1100px', width: '100%' }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="fas fa-truck mr-2"></i>
                    Pending Deliveries - Action Required
                  </h3>
                </div>
                <div className="card-body table-responsive p-0" style={{ maxWidth: '1050px', margin: '0 auto' }}>
                  {recentOrders.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="fas fa-check-circle text-success mr-2"></i>
                      No pending orders to deliver!
                    </div>
                  ) : (
                    <table className="table table-hover text-nowrap">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Delivery Address</th>
                          <th>Delivery Date</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th>Delivered Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order._id || order.id}>
                            <td>
                              <Link to={`/orders`} className="text-primary font-weight-bold">
                                #{order.orderNumber || order._id?.substring(0, 8)}
                              </Link>
                            </td>
                            <td>
                              <div>
                                <strong>{order.User?.name || order.customerName || order.userName || 'N/A'}</strong>
                                {order.User?.phone && (
                                  <div className="text-muted small">{order.User.phone}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              {order.Pack ? (
                                <div className="small">
                                  {order.Pack.name} ({order.Pack.PackType?.name})
                                </div>
                              ) : order.items?.map((item, idx) => (
                                <div key={idx} className="small">
                                  {item.quantity}x {item.productName || item.name || item.product}
                                </div>
                              )) || 
                                <span className="text-muted">No items details</span>
                              }
                            </td>
                            <td>
                              {order.shippingAddress ? (
                                <div className="small" style={{ maxWidth: '260px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                  {order.shippingAddress.address}, {order.shippingAddress.city}
                                  {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                                  {order.shippingAddress.zipCode && ` - ${order.shippingAddress.zipCode}`}
                                </div>
                              ) : order.deliveryAddress ? (
                                <div className="small" style={{ maxWidth: '260px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                  {typeof order.deliveryAddress === 'object' 
                                    ? `${order.deliveryAddress.address}, ${order.deliveryAddress.city}` 
                                    : order.deliveryAddress}
                                </div>
                              ) : (
                                <span className="text-muted">Address not available</span>
                              )}
                            </td>
                            <td>
                              <span className="text-success font-weight-bold">
                                {formatDeliveryDate(order.deliveryDate || order.scheduledDate)}
                              </span>
                              {order.deliveryTime && (
                                <div className="small text-muted">
                                  Time: {order.deliveryTime}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${
                                order.status === 'pending' ? 'bg-warning' :
                                order.status === 'processing' ? 'bg-info' :
                                order.status === 'delivered' ? 'bg-success' :
                                order.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {order.status || 'Pending'}
                              </span>
                            </td>
                            <td className="font-weight-bold">
                              ₹{order.total?.toFixed(2) || order.amount?.toFixed(2) || '0.00'}
                            </td>
                            <td>
                              {order.status === 'delivered' ? (
                                <span className="text-success">
                                  {order.deliveredAt ? formatDeliveryDate(order.deliveredAt) : 'Delivered'}
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-info"
                                onClick={() => handleViewOrder(order)}
                              >
                                <i className="fas fa-eye"></i> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="card-footer">
                  <Link to="/orders" className="btn btn-success btn-sm">
                    View All Orders <i className="fas fa-arrow-right ml-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Customers */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card card-info">
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="fas fa-user-plus mr-2"></i>
                    New Registrations
                  </h3>
                </div>
                <div className="card-body table-responsive p-0">
                  {recentCustomers.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      No recent registrations
                    </div>
                  ) : (
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Email</th>
                          <th>Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentCustomers.map((customer) => (
                          <tr key={customer._id || customer.id}>
                            <td>{customer.name}</td>
                            <td>{customer.email}</td>
                            <td>{formatDate(customer.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="card-footer">
                  <Link to="/customers" className="btn btn-info btn-sm">
                    View All Customers <i className="fas fa-arrow-right ml-1"></i>
                  </Link>
                </div>
              </div>
            </div>

            {/* Data Overview */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Data Overview</h3>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6 mb-2">
                      <div className="small-box" style={{background: '#17a2b8'}}>
                        <div className="inner">
                          <p>Categories</p>
                          <h4>{stats.categories}</h4>
                        </div>
                        <div className="icon">
                          <i className="fas fa-th"></i>
                        </div>
                        <Link to="/categories" className="small-box-footer">
                          View <i className="fas fa-arrow-circle-right"></i>
                        </Link>
                      </div>
                    </div>
                    <div className="col-6 mb-2">
                      <div className="small-box" style={{background: '#28a745'}}>
                        <div className="inner">
                          <p>Products</p>
                          <h4>{stats.products}</h4>
                        </div>
                        <div className="icon">
                          <i className="fas fa-box"></i>
                        </div>
                        <Link to="/products" className="small-box-footer">
                          View <i className="fas fa-arrow-circle-right"></i>
                        </Link>
                      </div>
                    </div>
                    <div className="col-6 mb-2">
                      <div className="small-box" style={{background: '#ffc107'}}>
                        <div className="inner">
                          <p>Packs</p>
                          <h4>{stats.packs}</h4>
                        </div>
                        <div className="icon">
                          <i className="fas fa-cubes"></i>
                        </div>
                        <Link to="/packs" className="small-box-footer">
                          View <i className="fas fa-arrow-circle-right"></i>
                        </Link>
                      </div>
                    </div>
                    <div className="col-6 mb-2">
                      <div className="small-box" style={{background: '#007bff'}}>
                        <div className="inner">
                          <p>Orders</p>
                          <h4>{stats.orders}</h4>
                        </div>
                        <div className="icon">
                          <i className="fas fa-shopping-cart"></i>
                        </div>
                        <Link to="/orders" className="small-box-footer">
                          View <i className="fas fa-arrow-circle-right"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Modal */}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Order Details #{orderDetails?.orderNumber || orderDetails?._id || selectedOrder?.orderNumber || selectedOrder?._id?.substring(0, 8)}
                  </h5>
                  <button 
                    type="button" 
                    className="close" 
                    onClick={closeModal}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  {detailsLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border" role="status">
                        <span className="sr-only">Loading...</span>
                      </div>
                    </div>
                  ) : orderDetails ? (
                    <div>
                      <div className="row">
                        <div className="col-md-6">
                          <h6 className="text-muted">Customer Information</h6>
                          <p className="mb-1">
                            <strong>Name:</strong> {orderDetails.User?.name || orderDetails.customerName || orderDetails.userName || orderDetails.name || 'N/A'}
                          </p>
                          <p className="mb-1">
                            <strong>Email:</strong> {orderDetails.User?.email || orderDetails.email || 'N/A'}
                          </p>
                          <p className="mb-1">
                            <strong>Phone:</strong> {orderDetails.User?.phone || orderDetails.phone || orderDetails.mobile || 'N/A'}
                          </p>
                          
                          <h6 className="text-muted mt-4">Shipping Address</h6>
                          <p className="mb-0">
                            {orderDetails.shippingAddress ? (
                              <span>
                                {orderDetails.shippingAddress.address}<br />
                                {orderDetails.shippingAddress.city}<br />
                                {orderDetails.shippingAddress.state && `${orderDetails.shippingAddress.state}, `}
                                {orderDetails.shippingAddress.zipCode}
                              </span>
                            ) : orderDetails.deliveryAddress ? (
                              typeof orderDetails.deliveryAddress === 'object' ? (
                                <span>
                                  {orderDetails.deliveryAddress.address}<br />
                                  {orderDetails.deliveryAddress.city}
                                </span>
                              ) : orderDetails.deliveryAddress
                            ) : 'N/A'}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <h6 className="text-muted">Order Information</h6>
                          <p className="mb-1">
                            <strong>Order ID:</strong> {orderDetails.orderNumber || orderDetails._id || orderDetails.id}
                          </p>
                          <p className="mb-1">
                            <strong>Status:</strong>{' '}
                            <span className={`badge ${
                              orderDetails.status === 'pending' ? 'bg-warning' :
                              orderDetails.status === 'processing' ? 'bg-info' :
                              orderDetails.status === 'delivered' ? 'bg-success' :
                              orderDetails.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {orderDetails.status || 'Pending'}
                            </span>
                          </p>
                          <p className="mb-1">
                            <strong>Order Date:</strong> {orderDetails.createdAt ? new Date(orderDetails.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                          </p>
                          <p className="mb-1">
                            <strong>Delivery Date:</strong> {orderDetails.deliveryDate ? new Date(orderDetails.deliveryDate).toLocaleDateString('en-IN') : 'Not specified'}
                          </p>
                          {orderDetails.deliveryTime && (
                            <p className="mb-1">
                              <strong>Time Slot:</strong> {orderDetails.deliveryTime}
                            </p>
                          )}
                          <p className="mb-1">
                            <strong>Payment Method:</strong> {orderDetails.paymentMethod || orderDetails.payment || 'N/A'}
                          </p>
                          <p className="mb-1">
                            <strong>Payment Status:</strong>{' '}
                            <span className={`badge ${orderDetails.paymentStatus === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                              {orderDetails.paymentStatus || 'Pending'}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="row mt-4">
                        <div className="col-12">
                          <h6 className="text-muted">Order Items</h6>
                          <table className="table table-sm table-bordered">
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderDetails.Pack ? (
                                <tr>
                                  <td>
                                    {orderDetails.Pack.name} ({orderDetails.Pack.PackType?.name})
                                  </td>
                                  <td>{orderDetails.quantity || 1}</td>
                                  <td>₹{orderDetails.Pack.price || orderDetails.price || 0}</td>
                                  <td>₹{orderDetails.total || orderDetails.totalAmount || orderDetails.Pack.price || 0}</td>
                                </tr>
                              ) : orderDetails.items && orderDetails.items.length > 0 ? (
                                orderDetails.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td>{item.productName || item.name || item.product}</td>
                                    <td>{item.quantity || 1}</td>
                                    <td>₹{item.price || 0}</td>
                                    <td>₹{(item.quantity || 1) * (item.price || 0)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="4" className="text-center text-muted">
                                    No item details available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="table-active">
                                <th colSpan="3" className="text-right">Grand Total:</th>
                                <th>₹{orderDetails.total || orderDetails.totalAmount || orderDetails.amount || 0}</th>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted">No order details available</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
