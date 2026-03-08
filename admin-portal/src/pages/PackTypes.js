import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { packTypeService, api } from '../services/api';
import { authService } from '../services/api';

const PackTypes = () => {
  const [packTypes, setPackTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPackType, setEditingPackType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: 'small',
    basePrice: '',
    sizeLabel: '',
    persons: '',
    days: '',
    fruitCount: '',
    weight: '',
    targetAudience: '',
    includesExotic: false,
  });

  // Get current user
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';

  useEffect(() => {
    fetchPackTypes();
  }, []);

  const fetchPackTypes = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await packTypeService.getAll();
      console.log('PackTypes data received:', response.data?.length || 0);

      setPackTypes(response.data || []);
    } catch (error) {
      console.error('PackTypes error:', error);
      setError(`Failed to load pack types: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const packTypeData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        includesExotic: formData.includesExotic || false,
      };

      if (editingPackType) {
        await packTypeService.update(editingPackType.id, packTypeData);
        setSuccess(`${formData.name} has been updated successfully`);
      } else {
        await packTypeService.create(packTypeData);
        setSuccess(`${formData.name} has been created successfully`);
      }
      setShowModal(false);
      setEditingPackType(null);
      resetForm();
      fetchPackTypes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save pack type');
      console.error('Save error:', error);
    }
  };

  const handleEdit = (packType) => {
    setEditingPackType(packType);
    setFormData({
      name: packType.name,
      duration: packType.duration,
      basePrice: packType.basePrice?.toString() || '',
      sizeLabel: packType.sizeLabel || '',
      persons: packType.persons || '',
      days: packType.days || '',
      fruitCount: packType.fruitCount || '',
      weight: packType.weight || '',
      targetAudience: packType.targetAudience || '',
      includesExotic: packType.includesExotic || false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const packType = packTypes.find(p => p.id === id);
    
    if (isStaff && !isAdmin) {
      if (window.confirm(`Delete request: Are you sure you want to request deletion of "${packType.name}"? The request will be sent to admin for approval.`)) {
        try {
          await api.post('/delete-requests', {
            entityType: 'packType',
            entityId: id,
            entityName: packType.name,
            requestedBy: currentUser.id,
            requestNote: `Request to delete pack type: ${packType.name}`
          });
          setSuccess(`Delete request for "${packType.name}" has been submitted to admin for approval`);
          setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
          console.error('Delete request error:', error);
          setError('Failed to submit delete request');
        }
      }
    } else {
      if (window.confirm('Are you sure you want to delete this pack type?')) {
        try {
          await packTypeService.delete(id);
          setSuccess(`${packType.name} has been marked as inactive`);
          fetchPackTypes();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
          setError('Failed to delete pack type');
          console.error('Delete error:', error);
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      duration: 'small',
      basePrice: '',
      sizeLabel: '',
      persons: '',
      days: '',
      fruitCount: '',
      weight: '',
      targetAudience: '',
      includesExotic: false,
    });
  };

  const handleAddNew = () => {
    setEditingPackType(null);
    resetForm();
    setShowModal(true);
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
              <p>Loading pack types...</p>
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
            <h1>Pack Types Management</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <a href="#">Home</a>
              </li>
              <li className="breadcrumb-item active">Pack Types</li>
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

        {/* Pack Types Management */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Pack Types</h3>
                <div className="card-tools">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNew}
                  >
                    <i className="fas fa-plus"></i> Add Pack Type
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
                        <th>Size</th>
                        <th>Persons</th>
                        <th>Duration</th>
                        <th>Price</th>
                        <th>Target</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packTypes.map((packType) => (
                        <tr key={packType.id}>
                          <td>{packType.id}</td>
                          <td>{packType.name}</td>
                          <td>
                            <span className={`badge ${
                              packType.duration === 'weekly' ? 'badge-primary' :
                              packType.duration === 'bi-weekly' ? 'badge-info' : 'badge-success'
                            }`}>
                              {packType.duration === 'bi-weekly' ? 'Bi-weekly' : packType.duration}
                            </span>
                          </td>
                          <td>₹{packType.basePrice}</td>
                          <td>
                            <span
                              className={`badge ${
                                packType.isActive ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {packType.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {new Date(packType.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info mr-2"
                              onClick={() => handleEdit(packType)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(packType.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {packTypes.length === 0 && (
                  <div className="text-center py-4">
                    <p>No pack types found. Add your first pack type to get started.</p>
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
                    {editingPackType ? 'Edit Pack Type' : 'Add Pack Type'}
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
                        placeholder="e.g., Weekly Pack, Monthly Pack"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Duration *</label>
                      <select
                        className="form-control"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: e.target.value })
                        }
                        required
                      >
                        <option value="small">Small Pack</option>
                        <option value="medium">Medium Pack</option>
                        <option value="large">Large Pack</option>
                        <option value="custom">Custom Pack</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Base Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.basePrice}
                        onChange={(e) =>
                          setFormData({ ...formData, basePrice: e.target.value })
                        }
                        placeholder="Enter base price"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Size Label</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.sizeLabel}
                        onChange={(e) =>
                          setFormData({ ...formData, sizeLabel: e.target.value })
                        }
                        placeholder="e.g., Small, Medium, Large"
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>For Persons</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.persons}
                            onChange={(e) =>
                              setFormData({ ...formData, persons: e.target.value })
                            }
                            placeholder="e.g., 1-2 Persons"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Duration</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.days}
                            onChange={(e) =>
                              setFormData({ ...formData, days: e.target.value })
                            }
                            placeholder="e.g., 3-4 Days"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Fruit Count</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.fruitCount}
                        onChange={(e) =>
                          setFormData({ ...formData, fruitCount: e.target.value })
                        }
                        placeholder="e.g., 4-5 Seasonal Fruits"
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Weight</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.weight}
                            onChange={(e) =>
                              setFormData({ ...formData, weight: e.target.value })
                            }
                            placeholder="e.g., Approx 3-4 Kg"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Target Audience</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.targetAudience}
                            onChange={(e) =>
                              setFormData({ ...formData, targetAudience: e.target.value })
                            }
                            placeholder="e.g., Basic Family Consumption"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="includesExotic"
                          checked={formData.includesExotic}
                          onChange={(e) =>
                            setFormData({ ...formData, includesExotic: e.target.checked })
                          }
                        />
                        <label className="form-check-label" htmlFor="includesExotic">
                          Includes Exotic Fruits
                        </label>
                      </div>
                    </div>
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
                      {editingPackType ? 'Update' : 'Create'}
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

export default PackTypes;