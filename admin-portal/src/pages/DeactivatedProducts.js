import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { productService, packService, packProductService } from '../services/api';
import { authService } from '../services/api';

const DeactivatedProducts = () => {
  const [products, setProducts] = useState([]);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPack, setSelectedPack] = useState('');
  const [packProducts, setPackProducts] = useState([]);

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

      // Fetch deactivated products
      const productsRes = await productService.getDeactivated();
      setProducts(productsRes.data || []);

      // Fetch all packs
      const packsRes = await packService.getAll();
      setPacks(packsRes.data || []);

    } catch (error) {
      console.error('Data fetch error:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePackChange = async (packId) => {
    setSelectedPack(packId);
    if (!packId) {
      setPackProducts([]);
      return;
    }

    try {
      // Get products in this pack that are deactivated
      const packProductsRes = await packProductService.getByPackId(packId);
      const allPackProducts = packProductsRes.data || [];

      // Filter to only show deactivated products
      const deactivatedInPack = allPackProducts.filter(pp => 
        products.some(p => p.id === pp.productId && !p.isActive)
      );

      // Get full product details
      const enrichedProducts = deactivatedInPack.map(pp => {
        const product = products.find(p => p.id === pp.productId);
        return {
          ...pp,
          product: product
        };
      }).filter(pp => pp.product);

      setPackProducts(enrichedProducts);
    } catch (error) {
      console.error('Error fetching pack products:', error);
      setPackProducts([]);
    }
  };

  const handleActivate = async (productId) => {
    const product = products.find(p => p.id === productId);
    
    if (window.confirm(`Are you sure you want to activate "${product?.name}"?`)) {
      try {
        await productService.activate(productId);
        setSuccess(`${product?.name} has been activated successfully`);
        
        // Refresh data
        fetchData();
        if (selectedPack) {
          handlePackChange(selectedPack);
        }
        
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Activate error:', error);
        setError('Failed to activate product');
      }
    }
  };

  // Get products that belong to selected pack
  const getProductsForPack = (packId) => {
    // This would need to fetch pack products from server
    // For now, showing all deactivated products
    return products;
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
              <p>Loading deactivated products...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayProducts = selectedPack ? packProducts.map(pp => pp.product).filter(Boolean) : products;

  return (
    <div className="content">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-2">
          <div className="col-sm-6">
            <h1>Deactivated Products</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item active">Deactivated Products</li>
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

        {/* Info Alert */}
        <div className="row">
          <div className="col-12">
            <div className="alert alert-info alert-dismissible">
              <button
                type="button"
                className="close"
                onClick={() => setSuccess('')}
              >
                ×
              </button>
              <h5><i className="icon fas fa-info"></i> Deactivated Products</h5>
              These products have been deactivated (soft deleted). You can view them here and activate them back if needed.
              {(isAdmin || isStaff) && (
                <p className="mb-0 mt-2">
                  Only admins and staff can activate deactivated products.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pack Filter */}
        <div className="row mb-3">
          <div className="col-md-4">
            <div className="form-group">
              <label>Filter by Pack (Optional)</label>
              <select
                className="form-control"
                value={selectedPack}
                onChange={(e) => handlePackChange(e.target.value)}
              >
                <option value="">All Deactivated Products</option>
                {packs.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} {pack.isActive ? '(Active)' : '(Inactive)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-group">
              <label>&nbsp;</label>
              <button
                className="btn btn-secondary form-control"
                onClick={() => {
                  setSelectedPack('');
                  setPackProducts([]);
                }}
              >
                Clear Filter
              </button>
            </div>
          </div>
        </div>

        {/* Deactivated Products Table */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  {selectedPack 
                    ? `Deactivated Products in "${packs.find(p => p.id === parseInt(selectedPack))?.name || 'Selected Pack'}"` 
                    : 'All Deactivated Products'}
                </h3>
                <div className="card-tools">
                  <button className="btn btn-primary btn-sm" onClick={fetchData}>
                    <i className="fas fa-sync"></i> Refresh
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
                        <th>Category</th>
                        <th>Price</th>
                        <th>Unit Type</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Deactivated Date</th>
                        {(isAdmin || isStaff) && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {displayProducts.map((product) => (
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
                          <td>{product.stock}</td>
                          <td>
                            <span className="badge badge-danger">
                              Inactive
                            </span>
                          </td>
                          <td>
                            {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          {(isAdmin || isStaff) && (
                            <td>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleActivate(product.id)}
                                title="Activate"
                              >
                                <i className="fas fa-check"></i> Activate
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {displayProducts.length === 0 && (
                  <div className="text-center py-4">
                    <p>No deactivated products found.</p>
                    {selectedPack && (
                      <p className="text-muted">
                        No deactivated products in the selected pack.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeactivatedProducts;
