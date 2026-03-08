import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { creditPackageService, api } from '../services/api';
import { authService } from '../services/api';

const CreditPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    credits: '',
    price: '',
    bonusCredits: '',
    description: '',
    isPopular: false,
    sortOrder: '',
    isActive: true,
  });

  // Get current user
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await creditPackageService.getAdminAll();
      setPackages(response.data || []);
    } catch (error) {
      console.error('CreditPackages error:', error);
      setError(`Failed to load credit packages: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const packageData = {
        ...formData,
        credits: parseInt(formData.credits),
        price: parseFloat(formData.price),
        bonusCredits: parseInt(formData.bonusCredits) || 0,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };

      if (editingPackage) {
        await creditPackageService.update(editingPackage.id, packageData);
        setSuccess(`${formData.name} has been updated successfully`);
      } else {
        await creditPackageService.create(packageData);
        setSuccess(`${formData.name} has been created successfully`);
      }
      setShowModal(false);
      setEditingPackage(null);
      resetForm();
      fetchPackages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save credit package');
      console.error('Save error:', error);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      credits: pkg.credits?.toString() || '',
      price: pkg.price?.toString() || '',
      bonusCredits: pkg.bonusCredits?.toString() || '0',
      description: pkg.description || '',
      isPopular: pkg.isPopular || false,
      sortOrder: pkg.sortOrder?.toString() || '0',
      isActive: pkg.isActive !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const pkg = packages.find(p => p.id === id);
    
    if (window.confirm(`Are you sure you want to delete "${pkg.name}"?`)) {
      try {
        await creditPackageService.delete(id);
        setSuccess(`${pkg.name} has been deactivated`);
        fetchPackages();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete credit package');
        console.error('Delete error:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      credits: '',
      price: '',
      bonusCredits: '',
      description: '',
      isPopular: false,
      sortOrder: '',
      isActive: true,
    });
  };

  const handleAddNew = () => {
    setEditingPackage(null);
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
              <p>Loading credit packages...</p>
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
            <h1>Credit Packages Management</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <a href="#">Home</a>
              </li>
              <li className="breadcrumb-item active">Credit Packages</li>
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

        {/* Info Card */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card card-info">
              <div className="card-header">
                <h3 className="card-title">Wallet System Information</h3>
              </div>
              <div className="card-body">
                <p className="mb-1"><strong>Credit Packages</strong> allow users to purchase credits that can be used to buy fruit packs.</p>
                <p className="mb-0"><strong>Bonus Credits</strong> are additional credits given as an incentive to encourage larger purchases.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Packages Management */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Credit Packages</h3>
                <div className="card-tools">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNew}
                  >
                    <i className="fas fa-plus"></i> Add Credit Package
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
                        <th>Credits</th>
                        <th>Bonus</th>
                        <th>Price</th>
                        <th>Cost/Credit</th>
                        <th>Popular</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packages.map((pkg) => (
                        <tr key={pkg.id}>
                          <td>{pkg.id}</td>
                          <td>{pkg.name}</td>
                          <td>{pkg.credits}</td>
                          <td>
                            {pkg.bonusCredits > 0 && (
                              <span className="badge badge-warning">+{pkg.bonusCredits}</span>
                            )}
                          </td>
                          <td>₹{pkg.price}</td>
                          <td>₹{((pkg.price / (pkg.credits + pkg.bonusCredits))).toFixed(2)}</td>
                          <td>
                            {pkg.isPopular && (
                              <span className="badge badge-success">Popular</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                pkg.isActive ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {pkg.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info mr-2"
                              onClick={() => handleEdit(pkg)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(pkg.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {packages.length === 0 && (
                  <div className="text-center py-4">
                    <p>No credit packages found. Add your first credit package to get started.</p>
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
                    {editingPackage ? 'Edit Credit Package' : 'Add Credit Package'}
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
                      <label>Package Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Starter Pack, Family Pack"
                        required
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Credits *</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.credits}
                            onChange={(e) =>
                              setFormData({ ...formData, credits: e.target.value })
                            }
                            placeholder="e.g., 100"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Bonus Credits</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.bonusCredits}
                            onChange={(e) =>
                              setFormData({ ...formData, bonusCredits: e.target.value })
                            }
                            placeholder="e.g., 10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Price (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({ ...formData, price: e.target.value })
                            }
                            placeholder="e.g., 100"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Sort Order</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.sortOrder}
                            onChange={(e) =>
                              setFormData({ ...formData, sortOrder: e.target.value })
                            }
                            placeholder="e.g., 1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Brief description of the package"
                      />
                    </div>

                    <div className="form-group">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isPopular"
                          checked={formData.isPopular}
                          onChange={(e) =>
                            setFormData({ ...formData, isPopular: e.target.checked })
                          }
                        />
                        <label className="form-check-label" htmlFor="isPopular">
                          Mark as Popular Package
                        </label>
                      </div>
                    </div>

                    {editingPackage && (
                      <div className="form-group">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) =>
                              setFormData({ ...formData, isActive: e.target.checked })
                            }
                          />
                          <label className="form-check-label" htmlFor="isActive">
                            Active
                          </label>
                        </div>
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
                      {editingPackage ? 'Update' : 'Create'}
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

export default CreditPackages;
