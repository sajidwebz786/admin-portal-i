import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { getCurrentUserRole } from '../utils/permissions';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    isActive: true
  });

  // Get current user role
  const currentUserRole = getCurrentUserRole();
  const isAdmin = currentUserRole === 'admin';

  // Admin app user roles (not customers)
  const adminRoles = ['admin', 'manager', 'staff', 'delivery'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      const allUsers = response.data || [];
      
      // Filter out customers - only show admin app users
      const adminAppUsers = allUsers.filter(user => adminRoles.includes(user.role));
      setUsers(adminAppUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'danger', text: 'Failed to load users from server. Please check if the server is running.' });
      setUsers([]);
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
      if (editingUser) {
        // Update existing user
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await userService.update(editingUser.id, updateData);
        setMessage({ type: 'success', text: 'User updated successfully!' });
      } else {
        // Create new user
        await userService.create(formData);
        setMessage({ type: 'success', text: 'New staff user created successfully!' });
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        phone: '',
        isActive: true
      });
      fetchUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving user:', error);
      setMessage({ type: 'danger', text: error.response?.data?.error || 'Failed to save user. Please try again.' });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'staff',
      phone: user.phone || '',
      isActive: user.isActive !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await userService.delete(userId);
      setMessage({ type: 'success', text: 'User deleted successfully!' });
      fetchUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'danger', text: 'Failed to delete user. Please try again.' });
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.isActive === false ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      await userService.toggleStatus(user.id);
      setMessage({ type: 'success', text: `User ${action}d successfully!` });
      fetchUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error toggling user status:', error);
      setMessage({ type: 'danger', text: 'Failed to update user status. Please try again.' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-danger',
      manager: 'bg-warning',
      staff: 'bg-primary',
      delivery: 'bg-info'
    };
    return badges[role] || 'bg-secondary';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      manager: 'Manager',
      staff: 'Staff',
      delivery: 'Delivery'
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">Staff Management</h1>
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
              <h1 className="m-0">Staff Management</h1>
              <small className="text-muted">Manage admin portal users (Admin, Manager, Staff, Delivery)</small>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active">Staff Management</li>
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

          <div className="alert alert-info mb-3">
            <i className="fas fa-info-circle"></i>
            <strong> Note:</strong> This section shows only Admin Application users (Admin, Manager, Staff, Delivery). 
            Mobile app customers are managed separately in the <a href="/customers">Customers</a> section.
            {!isAdmin && (
              <span><br /><strong>Note:</strong> You have view-only access. Only administrators can add, edit, or delete users.</span>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="row">
                <div className="col-md-6">
                  <h3 className="card-title">Admin App Users ({filteredUsers.length})</h3>
                </div>
                <div className="col-md-6">
                  <div className="card-tools float-right">
                    {isAdmin && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setEditingUser(null);
                          setFormData({
                            name: '',
                            email: '',
                            password: '',
                            role: 'staff',
                            phone: '',
                            isActive: true
                          });
                          setShowModal(true);
                        }}
                      >
                        <i className="fas fa-plus"></i> Add New Staff
                      </button>
                    )}
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
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <select
                    className="form-control"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setSearchTerm(''); setRoleFilter(''); }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body table-responsive p-0">
              {filteredUsers.length === 0 ? (
                <div className="text-center text-muted py-4">
                  {searchTerm || roleFilter ? 'No users match your filters.' : 'No staff users found. Add your first staff user using the "Add New Staff" button.'}
                </div>
              ) : (
                <table className="table table-hover text-nowrap">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.name}</strong>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>
                          <span className={`badge ${getRoleBadge(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td>
                          {user.isActive === false ? (
                            <span className="badge bg-secondary">Inactive</span>
                          ) : (
                            <span className="badge bg-success">Active</span>
                          )}
                        </td>
                        <td>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          {isAdmin && (
                            <>
                              <button
                                className="btn btn-info btn-sm mr-1"
                                onClick={() => handleEdit(user)}
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className={`btn btn-sm mr-1 ${user.isActive === false ? 'btn-success' : 'btn-warning'}`}
                                onClick={() => handleToggleStatus(user)}
                                title={user.isActive === false ? 'Activate' : 'Deactivate'}
                              >
                                <i className={`fas ${user.isActive === false ? 'fa-check' : 'fa-ban'}`}></i>
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(user.id)}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          )}
                          {!isAdmin && (
                            <span className="text-muted">View only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit User */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">
                  {editingUser ? 'Edit Staff User' : 'Add New Staff User'}
                </h4>
                <button type="button" className="close" onClick={() => setShowModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={!!editingUser}
                    />
                  </div>

                  {!editingUser && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!editingUser}
                        minLength={6}
                      />
                      <small className="text-muted">Minimum 6 characters</small>
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Role *</label>
                        <select
                          className="form-control"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="delivery">Delivery</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Phone</label>
                        <input
                          type="text"
                          className="form-control"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {editingUser && (
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="isActive">
                        Active Account
                      </label>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? 'Update User' : 'Create User'}
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

export default UserManagement;
