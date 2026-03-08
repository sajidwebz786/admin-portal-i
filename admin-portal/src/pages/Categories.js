import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { categoryService, api } from '../services/api';
import { authService } from '../services/api';


const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
  });

  // Get current user
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await categoryService.getAll();
      console.log('Categories data received:', response.data?.length || 0);

      setCategories(response.data || []);
    } catch (error) {
      console.error('Categories error:', error);
      setError(`Failed to load categories: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
        setSuccess(`${formData.name} has been updated successfully`);
      } else {
        await categoryService.create(formData);
        setSuccess(`${formData.name} has been created successfully`);
      }
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save category');
      console.error('Save error:', error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const category = categories.find(c => c.id === id);
    
    if (isStaff && !isAdmin) {
      if (window.confirm(`Delete request: Are you sure you want to request deletion of "${category.name}"? The request will be sent to admin for approval.`)) {
        try {
          await api.post('/delete-requests', {
            entityType: 'category',
            entityId: id,
            entityName: category.name,
            requestedBy: currentUser.id,
            requestNote: `Request to delete category: ${category.name}`
          });
          setSuccess(`Delete request for "${category.name}" has been submitted to admin for approval`);
          setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
          console.error('Delete request error:', error);
          setError('Failed to submit delete request');
        }
      }
    } else {
      if (window.confirm('Are you sure you want to delete this category?')) {
        try {
          await categoryService.delete(id);
          setSuccess(`${category.name} has been marked as inactive`);
          fetchCategories();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
          setError('Failed to delete category');
          console.error('Delete error:', error);
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
    });
  };

  const handleAddNew = () => {
    setEditingCategory(null);
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
              <p>Loading categories...</p>
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
            <h1>Categories</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item active">Categories</li>
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

        {/* Categories Management */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Categories</h3>
                <div className="card-tools">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNew}
                  >
                    <i className="fas fa-plus"></i> Add Category
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
                        <th>Description</th>
                        <th>Image</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id}>
                          <td>{category.id}</td>
                          <td>{category.name}</td>
                          <td>{category.description || '-'}</td>
                          <td>
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                category.isActive
                                  ? 'badge-success'
                                  : 'badge-danger'
                              }`}
                            >
                              {category.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {new Date(category.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info mr-2"
                              onClick={() => handleEdit(category)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(category.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {categories.length === 0 && (
                  <div className="text-center py-4">
                    <p>No categories found. Add your first category to get started.</p>
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
                    {editingCategory ? 'Edit Category' : 'Add Category'}
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
                      <label>Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label>Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        value={formData.image}
                        onChange={(e) =>
                          setFormData({ ...formData, image: e.target.value })
                        }
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
                      {editingCategory ? 'Update' : 'Create'}
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

export default Categories;