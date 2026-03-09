import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { categoryService } from '../services/api';
import { authService } from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = categories.filter(category =>
        category.name?.toLowerCase().includes(query) ||
        category.description?.toLowerCase().includes(query) ||
        category.id?.toString().includes(query)
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await categoryService.getAll();
      console.log('Categories data received:', response.data?.length || 0);

      setCategories(response.data || []);
      setFilteredCategories(response.data || []);
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
      setError('');
      setSuccess('');
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      if (formData.image) {
        data.append('image', formData.image);
      }

      if (editingCategory) {
        const id = parseInt(editingCategory.id);
        if (isNaN(id)) {
          setError('Invalid category ID');
          return;
        }
        await categoryService.update(id, data);
        setSuccess('Category updated successfully!');
      } else {
        await categoryService.create(data);
        setSuccess('Category created successfully!');
      }
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save category';
      setError(errorMessage);
      console.error('Save error:', error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: null, // File input can't be pre-filled
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const categoryId = parseInt(id);
        if (isNaN(categoryId)) {
          setError('Invalid category ID');
          return;
        }
        await categoryService.delete(categoryId);
        fetchCategories();
      } catch (error) {
        setError('Failed to delete category');
        console.error('Delete error:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: null,
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

        {/* Success Alert */}
        {success && (
          <div className="row">
            <div className="col-12">
              <div
                className="alert alert-success alert-dismissible fade show"
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                  color: '#155724',
                  fontWeight: '500',
                  padding: '15px 20px',
                  marginBottom: '20px'
                }}
              >
                <i className="fas fa-check-circle mr-2" style={{ fontSize: '18px' }}></i>
                <strong>Success!</strong> {success}
                <button
                  type="button"
                  className="close"
                  onClick={() => setSuccess('')}
                  style={{ fontSize: '20px', color: '#155724', opacity: '0.8' }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="row">
            <div className="col-12">
              <div
                className="alert alert-danger alert-dismissible fade show"
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                  color: '#721c24',
                  fontWeight: '500',
                  padding: '15px 20px',
                  marginBottom: '20px'
                }}
              >
                <i className="fas fa-exclamation-triangle mr-2" style={{ fontSize: '18px' }}></i>
                <strong>Error!</strong> {error}
                <button
                  type="button"
                  className="close"
                  onClick={() => setError('')}
                  style={{ fontSize: '20px', color: '#721c24', opacity: '0.8' }}
                >
                  ×
                </button>
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
                  <div className="input-group input-group-sm" style={{ width: '250px', marginRight: '10px' }}>
                    <input
                      type="text"
                      name="table_search"
                      className="form-control float-right"
                      placeholder="Search categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="input-group-append">
                      <button type="submit" className="btn btn-default">
                        <i className="fas fa-search"></i>
                      </button>
                    </div>
                  </div>
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
                      {filteredCategories.map((category) => (
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
                              className="btn btn-sm btn-outline-info mr-2"
                              onClick={() => handleEdit(category)}
                            >
                              <i className="fas fa-edit"></i> Edit
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
                    <p>{searchQuery ? 'No categories found matching your search.' : 'No categories found. Add your first category to get started.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block' }}>
            <div className="modal-dialog modal-lg">
              <div
                className="modal-content"
                style={{
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden'
                }}
              >
                <div
                  className="modal-header"
                  style={{
                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                    color: 'white',
                    borderBottom: 'none',
                    padding: '20px 30px',
                    position: 'relative'
                  }}
                >
                  <h4 className="modal-title" style={{ fontWeight: '600', margin: 0 }}>
                    {editingCategory ? 'Edit Category' : 'Add Category'}
                  </h4>
                  <button
                    type="button"
                    className="close"
                    style={{
                      position: 'absolute',
                      top: '15px',
                      right: '20px',
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      color: 'white',
                      cursor: 'pointer',
                      opacity: '0.8',
                      padding: '5px'
                    }}
                    onClick={() => setShowModal(false)}
                    onMouseOver={(e) => e.target.style.opacity = '1'}
                    onMouseOut={(e) => e.target.style.opacity = '0.8'}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div
                    className="modal-body"
                    style={{
                      padding: '30px',
                      background: '#f8f9fa'
                    }}
                  >
                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#495057' }}>Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #ced4da',
                          padding: '10px 15px',
                          fontSize: '14px'
                        }}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: '600', color: '#495057' }}>Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #ced4da',
                          padding: '10px 15px',
                          fontSize: '14px'
                        }}
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
                      <label style={{ fontWeight: '600', color: '#495057' }}>Image</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #ced4da',
                          padding: '10px 15px',
                          fontSize: '14px'
                        }}
                        onChange={(e) =>
                          setFormData({ ...formData, image: e.target.files[0] })
                        }
                      />
                      {editingCategory && editingCategory.image && (
                        <div style={{ marginTop: '10px' }}>
                          <small className="form-text text-muted" style={{ display: 'block', marginBottom: '5px' }}>
                            Current Image:
                          </small>
                          <img
                            src={editingCategory.image}
                            alt="Current category"
                            style={{
                              width: '100px',
                              height: '100px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                          <small className="form-text text-muted" style={{ display: 'block', marginTop: '5px' }}>
                            Leave file input empty to keep current image
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className="modal-footer"
                    style={{
                      borderTop: 'none',
                      padding: '20px 30px',
                      background: '#f8f9fa'
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        borderRadius: '6px',
                        padding: '8px 20px',
                        fontWeight: '500'
                      }}
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{
                        borderRadius: '6px',
                        padding: '8px 20px',
                        fontWeight: '500',
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        border: 'none'
                      }}
                    >
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div
            className="modal-backdrop fade show"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          ></div>
        )}
      </div>
    </div>
  );
};

export default Categories;