import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { productService, categoryService, unitTypeService, notificationService } from '../services/api';
import { authService } from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: null,
    categoryId: '',
    unitTypeId: '',
    quantity: '1',
    stock: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.Category?.name?.toLowerCase().includes(query) ||
        product.price?.toString().includes(query) ||
        product.id?.toString().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [productsRes, categoriesRes, unitTypesRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        unitTypeService.getAll(),
      ]);

      // Ensure product list order stays consistent after updates (e.g., image uploads)
      // by sorting on a stable attribute (id) rather than relying on server ordering.
      const sortedProducts = (productsRes.data || []).slice().sort((a, b) => a.id - b.id);

      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
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
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('categoryId', formData.categoryId);
      data.append('unitTypeId', formData.unitTypeId);
      data.append('quantity', formData.quantity);
      data.append('stock', formData.stock);
      if (formData.image) {
        data.append('image', formData.image);
      }

      if (editingProduct) {
        await productService.update(editingProduct.id, data);
      } else {
        await productService.create(data);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchData();
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
      image: null, // File input can't be pre-filled
      categoryId: product.categoryId?.toString() || '',
      unitTypeId: product.unitTypeId?.toString() || '', // FIXED
      quantity: product.quantity?.toString() || '1',
      stock: product.stock?.toString() || '0',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    // Check who is logged in
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isAdmin = adminUser.role === 'admin';
    
    if (isAdmin) {
      // Admin can delete directly - soft delete to deactivated
      if (window.confirm('Are you sure you want to delete this product? It will be moved to Deactivated Products.')) {
        try {
          await productService.update(id, { isActive: false, deactivatedAt: new Date().toISOString(), deactivationReason: 'Deleted by admin' });
          fetchData();
        } catch (error) {
          console.error('Delete error:', error);
          setError('Failed to delete product');
        }
      }
    } else {
      // Staff members need admin approval for deletion - send to server
      if (window.confirm('This will send a deletion request to the admin for approval. Continue?')) {
        try {
          const product = products.find(p => p.id === id || p._id === id);
          
          // Send deletion request to server
          await notificationService.create({
            type: 'product_deletion_request',
            title: 'Product Deletion Request',
            message: `${adminUser.name || 'A staff member'} requested to delete product: ${product?.name || 'Unknown'}`,
            referenceId: id,
            referenceType: 'product',
            priority: 'high',
            actionRequired: true
          });
          
          alert('Deletion request sent to admin for approval!');
          fetchData();
        } catch (error) {
          console.error('Delete request error:', error);
          setError('Failed to send deletion request');
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image: null,
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

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Manage Products</h3>
            <div className="card-tools">
              <div className="input-group input-group-sm" style={{ width: '250px', marginRight: '10px' }}>
                <input
                  type="text"
                  name="table_search"
                  className="form-control float-right"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="input-group-append">
                  <button type="submit" className="btn btn-default">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
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
                {filteredProducts.map((product) => (
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
                      <button
                        className="btn btn-sm btn-outline-info mr-2"
                        onClick={() => handleEdit(product)}
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-4">{searchQuery ? 'No products found matching your search.' : 'No products found.'}</div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <>
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
                      {editingProduct ? 'Edit Product' : 'Add Product'}
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
                      <div className="row">
                        <div className="col-md-6">
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
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label style={{ fontWeight: '600', color: '#495057' }}>Category *</label>
                          <select
                            className="form-control"
                            style={{
                              borderRadius: '6px',
                              border: '1px solid #ced4da',
                              padding: '10px 15px',
                              fontSize: '14px'
                            }}
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

                      <label style={{ fontWeight: '600', color: '#495057', marginTop: '15px', display: 'block' }}>Description</label>
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
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>

                      <div className="row mt-3">
                        <div className="col-md-6">
                          <label style={{ fontWeight: '600', color: '#495057' }}>Price *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            style={{
                              borderRadius: '6px',
                              border: '1px solid #ced4da',
                              padding: '10px 15px',
                              fontSize: '14px'
                            }}
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label style={{ fontWeight: '600', color: '#495057' }}>Stock *</label>
                          <input
                            type="number"
                            className="form-control"
                            style={{
                              borderRadius: '6px',
                              border: '1px solid #ced4da',
                              padding: '10px 15px',
                              fontSize: '14px'
                            }}
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="row mt-3">
                        <div className="col-md-6">
                          <label style={{ fontWeight: '600', color: '#495057' }}>Unit Type *</label>
                          <select
                            className="form-control"
                            style={{
                              borderRadius: '6px',
                              border: '1px solid #ced4da',
                              padding: '10px 15px',
                              fontSize: '14px'
                            }}
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
                          <label style={{ fontWeight: '600', color: '#495057' }}>Quantity *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            style={{
                              borderRadius: '6px',
                              border: '1px solid #ced4da',
                              padding: '10px 15px',
                              fontSize: '14px'
                            }}
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <label style={{ fontWeight: '600', color: '#495057', marginTop: '15px', display: 'block' }}>Image</label>
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
                        onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                      />
                      {editingProduct && editingProduct.image && (
                        <div style={{ marginTop: '10px' }}>
                          <small className="form-text text-muted" style={{ display: 'block', marginBottom: '5px' }}>
                            Current Image:
                          </small>
                          <img
                            src={editingProduct.image}
                            alt="Current product image"
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
                        {editingProduct ? 'Update Product' : 'Create Product'}
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            </div>

            <div
              className="modal-backdrop fade show"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            ></div>
          </>
        )}

      </div>
    </div>
  );
};

export default Products;
