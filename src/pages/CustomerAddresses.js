import React, { useState, useEffect } from 'react';
import { userService, addressService } from '../services/api';

const CustomerAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    userId: '',
    type: 'Home',
    name: '',
    address: '',
    isDefault: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching customers and addresses...');
      
      // Get all users using the service
      const usersRes = await userService.getAll();
      const allUsers = usersRes.data || [];
      const customerData = allUsers.filter(u => u.role === 'customer');
      console.log('Customers found:', customerData.length);
      
      setCustomers(customerData);
      
      // Get addresses for each customer
      const allAddresses = [];
      for (const customer of customerData) {
        try {
          // Use the address service
          const addrRes = await addressService.getByUserId(customer.id);
          const customerAddresses = addrRes.data || [];
          console.log(`Addresses for customer ${customer.id}:`, customerAddresses.length);
          customerAddresses.forEach(addr => {
            allAddresses.push({
              ...addr,
              userId: customer.id,
              customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email
              }
            });
          });
        } catch (e) {
          console.log(`No addresses for customer ${customer.id}:`, e.message);
        }
      }
      
      console.log('Total addresses:', allAddresses.length);
      setAddresses(allAddresses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error response:', error.response?.data);
      setMessage({ type: 'danger', text: 'Failed to load data: ' + (error.response?.data?.error || error.message) });
      setAddresses([]);
      setCustomers([]);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editingAddress) {
        // Update existing address
        await addressService.update(editingAddress.id, formData);
        setMessage({ type: 'success', text: 'Address updated successfully!' });
      } else {
        // Create new address
        await addressService.create(formData);
        setMessage({ type: 'success', text: 'Address added successfully!' });
      }

      setShowModal(false);
      setEditingAddress(null);
      setFormData({
        userId: '',
        type: 'Home',
        name: '',
        address: '',
        isDefault: false
      });
      fetchData();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving address:', error);
      setMessage({ type: 'danger', text: error.response?.data?.error || 'Failed to save address. Please try again.' });
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      userId: address.userId || address.customer?.id || '',
      type: address.type || 'Home',
      name: address.name || '',
      address: address.address || '',
      isDefault: address.isDefault || false
    });
    setShowModal(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await addressService.delete(addressId);
      setMessage({ type: 'success', text: 'Address deleted successfully!' });
      fetchData();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting address:', error);
      setMessage({ type: 'danger', text: 'Failed to delete address. Please try again.' });
    }
  };

  const handleSetDefault = async (address) => {
    if (!window.confirm('Set this as the default address for this customer?')) {
      return;
    }

    try {
      await addressService.update(address.id, { isDefault: true });
      setMessage({ type: 'success', text: 'Default address updated!' });
      fetchData();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error setting default address:', error);
      setMessage({ type: 'danger', text: 'Failed to update default address.' });
    }
  };

  const getCustomerName = (address) => {
    if (address?.customer?.name) return address.customer.name;
    const customer = customers.find(c => c.id === (address.userId || address.customer?.id));
    return customer?.name || 'Unknown';
  };

  const filteredAddresses = addresses.filter(addr => {
    const matchesSearch = 
      addr.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addr.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(addr).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = !filterCustomer || addr.userId === filterCustomer || addr.customer?.id === filterCustomer;
    return matchesSearch && matchesCustomer;
  });

  // Group addresses by customer
  const groupedAddresses = filteredAddresses.reduce((groups, address) => {
    const customerId = address.userId || address.customer?.id || 'unknown';
    if (!groups[customerId]) {
      groups[customerId] = [];
    }
    groups[customerId].push(address);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">Customer Addresses</h1>
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
              <h1 className="m-0">Customer Addresses</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active">Customer Addresses</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="container-fluid">
          {message.text && (
            <div className={`alert alert-${message.type} alert-dismissible`}>
              <button type="button" className="close" data-dismiss="alert" onClick={() => setMessage({ type: '', text: '' })}>
                &times;
              </button>
              {message.text}
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <div className="row">
                <div className="col-md-6">
                  <h3 className="card-title">All Customer Addresses ({addresses.length})</h3>
                </div>
                <div className="col-md-6">
                  <div className="card-tools float-right">
                    <button
                      className="btn btn-primary btn-sm mr-2"
                      onClick={() => {
                        setEditingAddress(null);
                        setFormData({
                          userId: '',
                          type: 'Home',
                          name: '',
                          address: '',
                          isDefault: false
                        });
                        setShowModal(true);
                      }}
                    >
                      <i className="fas fa-plus"></i> Add Address
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-header">
              <div className="row">
                <div className="col-md-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <select
                    className="form-control"
                    value={filterCustomer}
                    onChange={(e) => setFilterCustomer(e.target.value)}
                  >
                    <option value="">All Customers</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setSearchTerm(''); setFilterCustomer(''); }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body table-responsive p-0">
              {Object.keys(groupedAddresses).length === 0 ? (
                <div className="text-center text-muted py-4">
                  {searchTerm || filterCustomer ? 'No addresses match your filters.' : 'No customer addresses found. Customers may not have saved any addresses yet.'}
                </div>
              ) : (
                Object.entries(groupedAddresses).map(([customerId, customerAddresses]) => (
                  <div key={customerId} className="mb-4">
                    <div className="bg-light p-2 px-3 border-bottom">
                      <strong>
                        <i className="fas fa-user mr-1"></i>
                        {getCustomerName(customerAddresses[0])}
                      </strong>
                      <span className="text-muted ml-2">
                        ({customerAddresses.length} address{customerAddresses.length > 1 ? 'es' : ''})
                      </span>
                    </div>
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th style={{width: '100px'}}>Type</th>
                          <th>Name/Label</th>
                          <th>Address</th>
                          <th>Status</th>
                          <th style={{width: '150px'}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerAddresses.map((addr) => (
                          <tr key={addr.id}>
                            <td>
                              <span className="badge bg-info">{addr.type || 'N/A'}</span>
                            </td>
                            <td>{addr.name || 'N/A'}</td>
                            <td>{addr.address}</td>
                            <td>
                              {addr.isDefault ? (
                                <span className="badge bg-success">Default</span>
                              ) : (
                                <span className="badge bg-secondary">Regular</span>
                              )}
                            </td>
                            <td>
                              {!addr.isDefault && (
                                <button
                                  className="btn btn-success btn-sm mr-1"
                                  onClick={() => handleSetDefault(addr)}
                                  title="Set as Default"
                                >
                                  <i className="fas fa-check-circle"></i>
                                </button>
                              )}
                              <button
                                className="btn btn-info btn-sm mr-1"
                                onClick={() => handleEdit(addr)}
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(addr.id)}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit Address */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h4>
                <button type="button" className="close" onClick={() => setShowModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Customer *</label>
                    <select
                      className="form-control"
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Address Type *</label>
                        <select
                          className="form-control"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="Office">Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Label/Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., Home, Office"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Address *</label>
                    <textarea
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      placeholder="Full address with street, city, state, zip"
                    ></textarea>
                  </div>

                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isDefault"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="isDefault">
                      Set as default address
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingAddress ? 'Update Address' : 'Add Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerAddresses;
