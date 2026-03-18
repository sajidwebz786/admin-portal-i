import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { orderService } from '../services/api';
import { authService } from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll();
      setOrders(response.data);
    } catch (error) {
      setError('Failed to load orders');
      console.error('Orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      setError('Failed to update order status');
      console.error('Status update error:', error);
    }
  };

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setShowModal(true);
    setDetailsLoading(true);
    try {
      // Try to fetch full order details from API
      const response = await orderService.getById(order.id || order._id);
      setOrderDetails(response.data);
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
              <p>Loading orders...</p>
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
            <h1>Orders</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <a href="#">Home</a>
              </li>
              <li className="breadcrumb-item active">Orders</li>
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

        {/* Orders Table */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Order Details</h3>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Delivery Address</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Order Date</th>
                        <th>Time Slot</th>
                        <th>Delivery Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="text-center">
                            No orders found. Orders will appear here when customers place them.
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => (
                          <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{order.User ? order.User.name : 'N/A'}</td>
                            <td>{order.quantity || 1} items</td>
                            <td>{order.deliveryAddress || 'N/A'}</td>
                            <td>₹{order.totalAmount || 0}</td>
                            <td>
                              <select
                                className="form-control form-control-sm"
                                value={order.status || 'pending'}
                                onChange={(e) =>
                                  handleStatusUpdate(order.id, e.target.value)
                                }
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td>
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString()
                                : 'N/A'}
                            </td>
                            <td>{order.timeSlot || 'N/A'}</td>
                            <td>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-info"
                                onClick={() => handleViewOrder(order)}
                              >
                                <i className="fas fa-eye"></i> View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
                    Order Details #{orderDetails?.orderNumber || orderDetails?.id || selectedOrder?.id}
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
                            <strong>Name:</strong> {orderDetails.User?.name || orderDetails.customerName || orderDetails.userName || 'N/A'}
                          </p>
                          <p className="mb-1">
                            <strong>Email:</strong> {orderDetails.User?.email || orderDetails.email || 'N/A'}
                          </p>
                          <p className="mb-1">
                            <strong>Phone:</strong> {orderDetails.User?.phone || orderDetails.phone || 'N/A'}
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
      </div>
    </div>
  );
};

export default Orders;
