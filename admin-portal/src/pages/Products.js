import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { productService, categoryService, unitTypeService, api } from '../services/api';
import { authService } from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    categoryId: '',
    unitTypeId: '',
    quantity: '1',
    stock: '',
  });

  // Get current user
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [productsRes, categoriesRes, unitTypesRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        unitTypeService.getAll(),
      ]);

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setUnitTypes(unitTypesRes.data || []);
    } catch (error) {
      console.error('Products error:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId),
        unitTypeId: parseInt(formData.unitTypeId),
        quantity: parseFloat(formData.quantity),
        stock: parseInt(formData.stock),
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, productData);
        setSuccess(`${formData.name} has been updated successfully`);
      } else {
        await productService.create(productData);
        setSuccess(`${formData.name} has been created successfully`);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setError('Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '',
      image: product.image || '',
      categoryId: product.categoryId?.toString() || '',
      unitTypeId: product.unitTypeId?.toString() || '', // FIXED
      quantity: product.quantity?.toString() || '1',
      stock: product.stock?.toString() || '0',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const product = products.find(p => p.id === id);
    
    if (isStaff && !isAdmin) {
      // Staff users cannot delete directly - create a delete request
      if (window.confirm(`Delete request: Are you sure you want to request deletion of "${product.name}"? The request will be sent to admin for approval.`)) {
        try {
          await api.post('/delete-requests', {
            entityType: 'product',
            entityId: id,
            entityName: product.name,
            requestedBy: currentUser.id,
            requestNote: `Request to delete product: ${product.name}`
          });
          setSuccess(`Delete request for "${product.name}" has been submitted to admin for approval`);
          setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
          console.error('Delete request error:', error);
          setError('Failed to submit delete request');
        }
      }
    } else {
      // Admin can delete directly
      if (window.confirm('Are you sure you want to delete this product?')) {
        try {
          await productService.delete(id);
          setSuccess(`${product.name} has been marked as inactive`);
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
          console.error('Delete error:', error);
          setError('Failed to delete product');
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image: '',
      categoryId: '',
      unitTypeId: '',
      quantity: '1',
      stock: '',
    });
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="content">
        <div className="container-fluid text-center mt-5">
          <div className="spinner" style={{ margin: '50px auto' }}></div>
          <p>Loading products...</p>
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
            <h1>Products</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item"><a href="#">Home</a></li>
              <li className="breadcrumb-item active">Products</li>
            </ol>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger alert-dismissible">
            <button type="button" className="close" onClick={() => setError('')}>×</button>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="alert alert-success alert-dismissible">
            <button type="button" className="close" onClick={() => setSuccess('')}>×</button>
            {success}
          </div>
        )}

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Manage Products</h3>
            <div className="card-tools">
              <button className="btn btn-primary btn-sm" onClick={handleAddNew}>
                <i className="fas fa-plus"></i> Add Product
              </button>
            </div>
          </div>

          <div className="card-body table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Unit Type</th>
                  <th>Quantity</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>

                    <td>{product.Category?.name || 'N/A'}</td>

                    <td>₹{product.price}</td>

                    <td>
                      {product.UnitType
                        ? `${product.UnitType.abbreviation} (${product.UnitType.name})`
                        : 'N/A'}
                    </td>

                    <td>{product.quantity}</td>
                    <td>{product.stock}</td>

                    <td>
                      <span className={`badge ${product.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>

                    <td>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{ width: 50, height: 50, objectFit: 'cover' }}
                        />
                      ) : '-'}
                    </td>

                    <td>
                      <button className="btn btn-sm btn-info mr-2" onClick={() => handleEdit(product)}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="text-center py-4">No products found.</div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <>
            <div className="modal fade show" style={{ display: 'block' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">

                  <div className="modal-header">
                    <h4 className="modal-title">
                      {editingProduct ? 'Edit Product' : 'Add Product'}
                    </h4>
                    <button type="button" className="close" onClick={() => setShowModal(false)}>
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="modal-body">

                      <div className="row">
                        <div className="col-md-6">
                          <label>Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label>Category *</label>
                          <select
                            className="form-control"
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            required
                          >
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <label>Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>

                      <div className="row mt-2">
                        <div className="col-md-6">
                          <label>Price *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label>Stock *</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="row mt-2">
                        <div className="col-md-6">
                          <label>Unit Type *</label>
                          <select
                            className="form-control"
                            value={formData.unitTypeId}
                            onChange={(e) => setFormData({ ...formData, unitTypeId: e.target.value })}
                            required
                          >
                            <option value="">Select Unit Type</option>
                            {unitTypes.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.abbreviation} - {u.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label>Quantity *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <label className="mt-2">Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      />

                    </div>

                    <div className="modal-footer">
                      <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingProduct ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            </div>

            <div className="modal-backdrop fade show"></div>
          </>
        )}

      </div>
    </div>
  );
};

export default Products;
