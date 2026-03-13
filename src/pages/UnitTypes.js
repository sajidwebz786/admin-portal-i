import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { unitTypeService } from '../services/api';
import { authService } from '../services/api';

const UnitTypes = () => {
  const [unitTypes, setUnitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUnitType, setEditingUnitType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    description: '',
  });

  useEffect(() => {
    fetchUnitTypes();
  }, []);

  const fetchUnitTypes = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await unitTypeService.getAll();
      console.log('UnitTypes data received:', response.data?.length || 0);

      setUnitTypes(response.data || []);
    } catch (error) {
      console.error('UnitTypes error:', error);
      setError(`Failed to load unit types: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUnitType) {
        await unitTypeService.update(editingUnitType.id, formData);
      } else {
        await unitTypeService.create(formData);
      }
      setShowModal(false);
      setEditingUnitType(null);
      resetForm();
      fetchUnitTypes();
    } catch (error) {
      setError('Failed to save unit type');
      console.error('Save error:', error);
    }
  };

  const handleEdit = (unitType) => {
    setEditingUnitType(unitType);
    setFormData({
      name: unitType.name,
      abbreviation: unitType.abbreviation,
      description: unitType.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this unit type?')) {
      try {
        await unitTypeService.delete(id);
        fetchUnitTypes();
      } catch (error) {
        setError('Failed to delete unit type');
        console.error('Delete error:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      abbreviation: '',
      description: '',
    });
  };

  const handleAddNew = () => {
    setEditingUnitType(null);
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
              <p>Loading unit types...</p>
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
            <h1>Unit Types Management</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <a href="#">Home</a>
              </li>
              <li className="breadcrumb-item active">Unit Types</li>
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

        {/* Unit Types Management */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Unit Types</h3>
                <div className="card-tools">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNew}
                  >
                    <i className="fas fa-plus"></i> Add Unit Type
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
                        <th>Abbreviation</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unitTypes.map((unitType) => (
                        <tr key={unitType.id}>
                          <td>{unitType.id}</td>
                          <td>{unitType.name}</td>
                          <td>
                            <code>{unitType.abbreviation}</code>
                          </td>
                          <td>{unitType.description || '-'}</td>
                          <td>
                            <span
                              className={`badge ${
                                unitType.isActive ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {unitType.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {new Date(unitType.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info mr-2"
                              onClick={() => handleEdit(unitType)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(unitType.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {unitTypes.length === 0 && (
                  <div className="text-center py-4">
                    <p>No unit types found. Add your first unit type to get started.</p>
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
                    {editingUnitType ? 'Edit Unit Type' : 'Add Unit Type'}
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
                        placeholder="e.g., Kilogram, Gram, Piece"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Abbreviation *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.abbreviation}
                        onChange={(e) =>
                          setFormData({ ...formData, abbreviation: e.target.value })
                        }
                        placeholder="e.g., kg, g, pc"
                        required
                      />
                      <small className="form-text text-muted">
                        Short form used in product displays (e.g., "kg" for Kilogram)
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Optional description for this unit type"
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
                      {editingUnitType ? 'Update' : 'Create'}
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

export default UnitTypes;