import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { packTypeService } from '../services/api';
import { authService } from '../services/api';

const PackTypes = () => {
  const [packTypes, setPackTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPackType, setEditingPackType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: 'weekly',
    basePrice: '',
  });

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
      };

      if (editingPackType) {
        await packTypeService.update(editingPackType.id, packTypeData);
      } else {
        await packTypeService.create(packTypeData);
      }
      setShowModal(false);
      setEditingPackType(null);
      resetForm();
      fetchPackTypes();
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
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pack type?')) {
      try {
        await packTypeService.delete(id);
        fetchPackTypes();
      } catch (error) {
        setError('Failed to delete pack type');
        console.error('Delete error:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      duration: 'weekly',
      basePrice: '',
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
                        <th>Duration</th>
                        <th>Base Price</th>
                        <th>Status</th>
                        <th>Created At</th>
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
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => handleEdit(packType)}
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(packType.id)}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
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
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
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