import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';

const DeactivatedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDeactivatedProducts();
  }, []);

  const fetchDeactivatedProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      const allProducts = response.data || [];
      
      // Filter for deactivated/inactive products
      const deactivated = allProducts.filter(p => p.isAvailable === false);
      setProducts(deactivated);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching deactivated products:', error);
      setProducts([]);
      setLoading(false);
    }
  };

  const handleReactivate = async (productId) => {
    if (!window.confirm('Are you sure you want to reactivate this product?')) {
      return;
    }

    try {
      await productService.update(productId, { isAvailable: true });
      setMessage({ type: 'success', text: 'Product reactivated successfully!' });
      // Remove from list
      setProducts(products.filter(p => p.id !== productId));
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error reactivating product:', error);
      setMessage({ type: 'danger', text: 'Failed to reactivate product. Please try again.' });
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to permanently delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await productService.delete(productId);
      setMessage({ type: 'success', text: 'Product deleted permanently!' });
      setProducts(products.filter(p => p.id !== productId));
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage({ type: 'danger', text: 'Failed to delete product. Please try again.' });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">Deactivated Products</h1>
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
              <h1 className="m-0">Deactivated Products</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active">Deactivated Products</li>
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

          <div className="card">
            <div className="card-header">
              <div className="row">
                <div className="col-md-6">
                  <h3 className="card-title">
                    Inactive/Deactivated Products ({filteredProducts.length})
                  </h3>
                </div>
                <div className="col-md-6">
                  <div className="card-tools float-right">
                    <div className="input-group input-group-sm" style={{ width: '250px' }}>
                      <input
                        type="text"
                        name="table_search"
                        className="form-control float-right"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="input-group-append">
                        <button type="submit" className="btn btn-default">
                          <i className="fas fa-search"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body table-responsive p-0">
              {filteredProducts.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="fas fa-check-circle text-success fa-2x mb-3"></i>
                  <h5>No Deactivated Products</h5>
                  <p>All products are currently active.</p>
                </div>
              ) : (
                <table className="table table-hover text-nowrap">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Deactivated Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <i className="fas fa-image text-muted"></i>
                            </div>
                          )}
                        </td>
                        <td>
                          <strong>{product.name}</strong>
                          {product.description && (
                            <div className="text-muted small">
                              {product.description.substring(0, 50)}...
                            </div>
                          )}
                        </td>
                        <td>{product.categoryName || product.category?.name || 'N/A'}</td>
                        <td className="font-weight-bold">₹{Number(product.price || 0).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
                            {product.stock || 0}
                          </span>
                        </td>
                        <td>
                          {product.deactivatedAt ? new Date(product.deactivatedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleReactivate(product.id)}
                              title="Reactivate"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(product.id)}
                              title="Delete Permanently"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
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
    </div>
  );
};

export default DeactivatedProducts;
