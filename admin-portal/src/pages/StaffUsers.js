import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { authService, api } from '../services/api';

const StaffUsers = () => {
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff'
  });

  // Get current user
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchStaffUsers();
  }, []);

  const fetchStaffUsers = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all admin and staff users
      const response = await api.get('/users?role=staff,admin');
      console.log('Staff users data received:', response.data?.length || 0);

      // Filter to show only staff users (exclude super admin if needed)
      const staff = (response.data || []).filter(u => u.role === 'staff');
      setStaffUsers(staff);
    } catch (error) {
      console.error('Staff users error:', error);
      setError(`Failed to load staff users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update existing staff user
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          role: formData.role
        };
        // Only update password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await api.put(`/users/${editingUser.id}`, updateData);
        setSuccess(`${formData.name} has been updated successfully`);
      } else {
        // Create new staff user - use auth endpoint
        await authService.register(formData.name, formData.email, formData.password, formData.phone);
        setSuccess(`${formData.name} has been created successfully as Staff`);
      }
      
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchStaffUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setError(error.response?.data?.message || 'Failed to save staff user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const user = staffUsers.find(u => u.id === id);
    
    if (window.confirm(`Are you sure you want to delete staff user "${user.name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/users/${id}`);
        setSuccess(`${user.name} has been deleted`);
        fetchStaffUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Delete error:', error);
        setError('Failed to delete staff user');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    const user = staffUsers.find(u => u.id === id);
    const newStatus = user.isActive === false;
    
    if (window.confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} "${user.name}"?`)) {
      try {
        await api.patch(`/users/${id}/status`);
        setSuccess(`"${user.name}" has been ${newStatus ? 'activated' : 'deactivated'}`);
        fetchStaffUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Status toggle error:', error);
        setError('Failed to update staff user status');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'staff'
    });
  };

  const handleAddNew = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  // Redirect if not authenticated or not admin
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="content">
        <div className="container-fluid">
          <div className="alert alert-warning">
            <h5><i className="icon fas fa-exclamation-triangle"></i> Access Denied</h5>
            Only administrators can manage staff users.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 text-center">
              <div className="spinner" style={{ margin: '50px auto' }}></div>
              <p>Loading staff users...</p>
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
            <h1>Staff Users</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item active">Staff Users</li>
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

        {/* Info Alert */}
        <div className="row">
          <div className="col-12">
            <div className="alert alert-info alert-dismissible">
              <button
                type="button"
                className="close"
                onClick={() => setSuccess('')}
              >
                ×
              </button>
              <h5><i className="icon fas fa-info"></i> Staff User Policy</h5>
              Staff users have limited access and cannot:
              <ul className="mb-0 mt-2">
                <li>Access Pack Types management</li>
                <li>Access Wallet & Credits settings</li>
                <li>Delete items directly (delete requests go to Admin for approval)</li>
                <li>Manage other staff users</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Staff Users Table */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Staff Users</h3>
                <div className="card-tools">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNew}
                  >
                    <i className="fas fa-plus"></i> Add Staff User
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.phone || '-'}</td>
                          <td>
                            <span className={`badge ${user.role === 'admin' ? 'badge-success' : 'badge-info'}`}>
                              {user.role === 'admin' ? 'Admin' : 'Staff'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${user.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                              {user.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info mr-2"
                              onClick={() => handleEdit(user)}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className={`btn btn-sm ${user.isActive !== false ? 'btn-warning' : 'btn-success'} mr-2`}
                              onClick={() => handleToggleStatus(user.id)}
                              title={user.isActive !== false ? 'Deactivate' : 'Activate'}
                            >
                              <i className={`fas ${user.isActive !== false ? 'fa-ban' : 'fa-check'}`}></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(user.id)}
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

                {staffUsers.length === 0 && (
                  <div className="text-center py-4">
                    <p>No staff users found. Add your first staff user to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">
                    {editingUser ? 'Edit Staff User' : 'Add Staff User'}
                  </h4>
                  <button
                    type="button"
                    className="close"
                    onClick={() => setShowModal(false)}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                        disabled={!!editingUser}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Password {editingUser ? '(leave blank to keep current)' : '*'}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required={!editingUser}
                        minLength={6}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                    {editingUser && (
                      <div className="form-group">
                        <label>Role</label>
                        <select
                          className="form-control"
                          value={formData.role}
                          onChange={(e) =>
                            setFormData({ ...formData, role: e.target.value })
                          }
                        >
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-default"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingUser ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showModal && <div className="modal-backdrop fade show"></div>}
      </div>
    </div>
  );
};

export default StaffUsers;
