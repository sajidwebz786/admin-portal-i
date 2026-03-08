import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { packService, categoryService, packTypeService, productService, packProductService, api } from '../services/api';
import { authService } from '../services/api';

const Packs = () => {
  const [packs, setPacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [packTypes, setPackTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    packTypeId: '',
    basePrice: '',
    finalPrice: '',
    validFrom: '',
    validUntil: '',
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

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

      const [packsRes, categoriesRes, packTypesRes, productsRes] = await Promise.all([
        packService.getAll(),
        categoryService.getAll(),
        packTypeService.getAll(),
        productService.getAll(),
      ]);

      console.log('Packs data received:', {
        packs: packsRes.data?.length || 0,
        categories: categoriesRes.data?.length || 0,
        packTypes: packTypesRes.data?.length || 0,
        products: productsRes.data?.length || 0,
      });

      setPacks(packsRes.data || []);
      setCategories(categoriesRes.data || []);
      setPackTypes(packTypesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Packs error:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const packData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        finalPrice: parseFloat(formData.finalPrice),
        categoryId: parseInt(formData.categoryId),
        packTypeId: parseInt(formData.packTypeId),
      };

      let savedPack;
      if (editingPack) {
        savedPack = await packService.update(editingPack.id, packData);
      } else {
        savedPack = await packService.create(packData);
      }

      // Save selected products if any
      if (selectedProducts.length > 0) {
        try {
          await packProductService.createBulk({
            packId: savedPack.data.id,
            products: selectedProducts
          });
        } catch (error) {
          console.error('Error saving pack products:', error);
          setError('Failed to save pack products');
          return;
        }
      }

      setShowModal(false);
      setEditingPack(null);
      resetForm();
      fetchData();
      
      const message = editingPack 
        ? `${formData.name} has been updated successfully` 
        : `${formData.name} has been created successfully`;
      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save pack');
      console.error('Save error:', error);
    }
  };

  const handleEdit = async (pack) => {
    setEditingPack(pack);
    setFormData({
      name: pack.name,
      description: pack.description || '',
      categoryId: pack.categoryId?.toString() || '',
      packTypeId: pack.packTypeId?.toString() || '',
      basePrice: pack.basePrice?.toString() || '',
      finalPrice: pack.finalPrice?.toString() || '',
      validFrom: pack.validFrom ? pack.validFrom.substring(0, 10) : '',
      validUntil: pack.validUntil ? pack.validUntil.substring(0, 10) : '',
    });

    // Load existing pack products
    try {
      const packProductsResponse = await packProductService.getByPackId(pack.id);
      const packProducts = packProductsResponse.data.map(pp => ({
        productId: pp.productId,
        quantity: pp.quantity,
        unitPrice: pp.unitPrice
      }));
      setSelectedProducts(packProducts);
    } catch (error) {
      console.error('Error loading pack products:', error);
      setSelectedProducts([]);
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const pack = packs.find(p => p.id === id);
    
    if (isStaff && !isAdmin) {
      // Staff users cannot delete directly - create a delete request
      if (window.confirm(`Delete request: Are you sure you want to request deletion of "${pack.name}"? The request will be sent to admin for approval.`)) {
        try {
          await api.post('/delete-requests', {
            entityType: 'pack',
            entityId: id,
            entityName: pack.name,
            requestedBy: currentUser.id,
            requestNote: `Request to delete pack: ${pack.name}`
          });
          setSuccess(`Delete request for "${pack.name}" has been submitted to admin for approval`);
          setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
          console.error('Delete request error:', error);
          setError('Failed to submit delete request');
        }
      }
    } else {
      // Admin can delete directly
      if (window.confirm('Are you sure you want to delete this pack?')) {
        try {
          await packService.delete(id);
          setSuccess(`${pack.name} has been marked as inactive`);
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
          setError('Failed to delete pack');
          console.error('Delete error:', error);
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      packTypeId: '',
      basePrice: '',
      finalPrice: '',
      validFrom: '',
      validUntil: '',
    });
    setSelectedProducts([]);
  };

  const handleProductToggle = (product) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === product.id);
      if (existing) {
        return prev.filter(p => p.productId !== product.id);
      } else {
        return [...prev, {
          productId: product.id,
          quantity: 1,
          unitPrice: product.price
        }];
      }
    });
  };

  const handleProductQuantityChange = (productId, quantity) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.productId === productId
          ? { ...p, quantity: parseInt(quantity) || 1 }
          : p
      )
    );
  };

  const handleProductPriceChange = (productId, unitPrice) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.productId === productId
          ? { ...p, unitPrice: parseFloat(unitPrice) || 0 }
          : p
      )
    );
  };

  const removeProductFromPack = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const handleAddNew = () => {
    setEditingPack(null);
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
              <p>Loading packs...</p>
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
            <h1>Packs Management</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <a href="#">Home</a>
              </li>
              <li className="breadcrumb-item active">Packs</li>
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

        {/* Packs Management */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Packs</h3>
                <div className="card-tools">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNew}
                  >
                    <i className="fas fa-plus"></i> Add Pack
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
                        <th>Pack Type</th>
                        <th>Base Price</th>
                        <th>Final Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packs.map((pack) => (
                        <tr key={pack.id}>
                          <td>{pack.id}</td>
                          <td>{pack.name}</td>
                          <td>
                            {pack.Category ? pack.Category.name : 'N/A'}
                          </td>
                          <td>
                            {pack.PackType ? pack.PackType.name : 'N/A'}
                          </td>
                          <td>₹{pack.basePrice}</td>
                          <td>₹{pack.finalPrice}</td>
                          <td>
                            <span
                              className={`badge ${
                                pack.isActive ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {pack.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info mr-2"
                              onClick={() => handleEdit(pack)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(pack.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {packs.length === 0 && (
                  <div className="text-center py-4">
                    <p>No packs found. Add your first pack to get started.</p>
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
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">
                    {editingPack ? 'Edit Pack' : 'Add Pack'}
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
                    <div className="row">
                      <div className="col-md-6">
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
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Category *</label>
                          <select
                            className="form-control"
                            value={formData.categoryId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                categoryId: e.target.value,
                              })
                            }
                            required
                          >
                            <option value="">Select Category</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
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

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Pack Type *</label>
                          <select
                            className="form-control"
                            value={formData.packTypeId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                packTypeId: e.target.value,
                              })
                            }
                            required
                          >
                            <option value="">Select Pack Type</option>
                            {packTypes.map((packType) => (
                              <option key={packType.id} value={packType.id}>
                                {packType.name} (₹{packType.basePrice})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
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
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Final Price *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.finalPrice}
                            onChange={(e) =>
                              setFormData({ ...formData, finalPrice: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Valid From *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.validFrom}
                            onChange={(e) =>
                              setFormData({ ...formData, validFrom: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Valid Until *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.validUntil}
                            onChange={(e) =>
                              setFormData({ ...formData, validUntil: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Product Selection Section */}
                    <div className="form-group">
                      <label>Add Products to Pack</label>
                      <div className="border rounded p-3" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        <div className="row">
                          {products
                            .filter(product => !formData.categoryId || product.categoryId === parseInt(formData.categoryId))
                            .map((product) => {
                              const isSelected = selectedProducts.some(p => p.productId === product.id);
                              const selectedProduct = selectedProducts.find(p => p.productId === product.id);

                              return (
                                <div key={product.id} className="col-md-6 mb-3">
                                  <div className={`card ${isSelected ? 'border-primary' : ''}`}>
                                    <div className="card-body p-2">
                                      <div className="d-flex align-items-center">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handleProductToggle(product)}
                                          className="mr-2"
                                        />
                                        <div className="flex-grow-1">
                                          <small className="font-weight-bold d-block">{product.name}</small>
                                          <small className="text-muted">₹{product.price} per {product.UnitType?.abbreviation || 'unit'}</small>
                                        </div>
                                      </div>

                                      {isSelected && (
                                        <div className="mt-2">
                                          <div className="row">
                                            <div className="col-4">
                                              <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                placeholder="Qty"
                                                value={selectedProduct.quantity}
                                                onChange={(e) => handleProductQuantityChange(product.id, e.target.value)}
                                                min="1"
                                              />
                                            </div>
                                            <div className="col-6">
                                              <input
                                                type="number"
                                                step="0.01"
                                                className="form-control form-control-sm"
                                                placeholder="Unit Price"
                                                value={selectedProduct.unitPrice}
                                                onChange={(e) => handleProductPriceChange(product.id, e.target.value)}
                                              />
                                            </div>
                                            <div className="col-2">
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeProductFromPack(product.id)}
                                              >
                                                ×
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {selectedProducts.length > 0 && (
                          <div className="mt-3 pt-3 border-top">
                            <h6>Selected Products ({selectedProducts.length})</h6>
                            {selectedProducts.map((sp) => {
                              const product = products.find(p => p.id === sp.productId);
                              return (
                                <div key={sp.productId} className="d-flex justify-content-between align-items-center mb-1">
                                  <span>{product?.name}</span>
                                  <small className="text-muted">
                                    {sp.quantity} × ₹{sp.unitPrice} = ₹{(sp.quantity * sp.unitPrice).toFixed(2)}
                                  </small>
                                </div>
                              );
                            })}
                            <div className="d-flex justify-content-between align-items-center font-weight-bold">
                              <span>Total Value:</span>
                              <span>₹{selectedProducts.reduce((total, sp) => total + (sp.quantity * sp.unitPrice), 0).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
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
                      {editingPack ? 'Update' : 'Create'}
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

export default Packs;