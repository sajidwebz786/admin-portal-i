import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { rewardConfigService, api } from '../services/api';
import { authService } from '../services/api';

const RewardSettings = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: 'Default Reward',
    rewardPercentage: '5',
    minOrderAmount: '0',
    maxRewardCredits: '100',
    description: '',
    isActive: true,
  });

  // Get current user
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await rewardConfigService.getAdminAll();
      setConfigs(response.data || []);
    } catch (error) {
      console.error('RewardConfig error:', error);
      setError(`Failed to load reward configurations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const configData = {
        ...formData,
        rewardPercentage: parseFloat(formData.rewardPercentage),
        minOrderAmount: parseFloat(formData.minOrderAmount),
        maxRewardCredits: parseInt(formData.maxRewardCredits),
      };

      if (editingConfig) {
        await rewardConfigService.update(editingConfig.id, configData);
        setSuccess(`Reward configuration has been updated successfully`);
      } else {
        await rewardConfigService.create(configData);
        setSuccess(`Reward configuration has been created successfully`);
      }
      setShowModal(false);
      setEditingConfig(null);
      resetForm();
      fetchConfigs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save reward configuration');
      console.error('Save error:', error);
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      rewardPercentage: config.rewardPercentage?.toString() || '5',
      minOrderAmount: config.minOrderAmount?.toString() || '0',
      maxRewardCredits: config.maxRewardCredits?.toString() || '100',
      description: config.description || '',
      isActive: config.isActive !== false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: 'Default Reward',
      rewardPercentage: '5',
      minOrderAmount: '0',
      maxRewardCredits: '100',
      description: '',
      isActive: true,
    });
  };

  const handleAddNew = () => {
    setEditingConfig(null);
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
              <p>Loading reward settings...</p>
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
            <h1>Reward Settings</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <a href="#">Home</a>
              </li>
              <li className="breadcrumb-item active">Reward Settings</li>
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
                <h3 className="card-title">How Rewards Work</h3>
              </div>
              <div className="card-body">
                <p className="mb-2"><strong>Reward System:</strong></p>
                <ul className="mb-2">
                  <li>Customers earn credits back on every purchase as a reward</li>
                  <li>The reward percentage determines how much of each order is credited back</li>
                  <li>Minimum order amount can be set to require a minimum purchase before rewards apply</li>
                  <li>Maximum reward credits cap the amount of credits earned per order</li>
                </ul>
                <p className="mb-0"><strong>Example:</strong> If reward percentage is 5%, min order is ₹100, and max reward is 100 credits:</p>
                <ul>
                  <li>Order of ₹200 = 10 credits earned</li>
                  <li>Order of ₹500 = 25 credits earned (capped at 100)</li>
                  <li>Order below ₹100 = No credits earned</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Management */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Reward Settings</h3>
                <div className="card-tools">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNew}
                  >
                    <i className="fas fa-plus"></i> Add Reward Configuration
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
                        <th>Reward %</th>
                        <th>Min Order</th>
                        <th>Max Credits</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map((config) => (
                        <tr key={config.id}>
                          <td>{config.id}</td>
                          <td>{config.name}</td>
                          <td>{config.rewardPercentage}%</td>
                          <td>₹{config.minOrderAmount}</td>
                          <td>{config.maxRewardCredits} credits</td>
                          <td>{config.description || '-'}</td>
                          <td>
                            <span
                              className={`badge ${
                                config.isActive ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {config.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info mr-2"
                              onClick={() => handleEdit(config)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {configs.length === 0 && (
                  <div className="text-center py-4">
                    <p>No reward configurations found. Add one to get started.</p>
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
                    {editingConfig ? 'Edit Reward Configuration' : 'Add Reward Configuration'}
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
                      <label>Configuration Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Default Reward"
                        required
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Reward Percentage (%) *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.rewardPercentage}
                            onChange={(e) =>
                              setFormData({ ...formData, rewardPercentage: e.target.value })
                            }
                            placeholder="e.g., 5"
                            required
                          />
                          <small className="text-muted">Percentage of order amount to give as credits</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Maximum Reward Credits *</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.maxRewardCredits}
                            onChange={(e) =>
                              setFormData({ ...formData, maxRewardCredits: e.target.value })
                            }
                            placeholder="e.g., 100"
                            required
                          />
                          <small className="text-muted">Maximum credits earned per order</small>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Minimum Order Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.minOrderAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, minOrderAmount: e.target.value })
                        }
                        placeholder="e.g., 0"
                      />
                      <small className="text-muted">Minimum order amount required to earn rewards (0 = no minimum)</small>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Brief description of this reward configuration"
                      ></textarea>
                    </div>

                    {editingConfig && (
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
                      {editingConfig ? 'Update' : 'Create'}
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

export default RewardSettings;
