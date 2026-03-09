import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { packService, categoryService, packTypeService, productService, packProductService } from '../services/api';
import { authService } from '../services/api';

const Packs = () => {
  const [packs, setPacks] = useState([]);
  const [filteredPacks, setFilteredPacks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [allPackTypes, setAllPackTypes] = useState([]);
  const [filteredPackTypes, setFilteredPackTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    packTypeId: '',
    basePrice: '0',
    finalPrice: '',
    validFrom: '',
    validUntil: '',
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter packs based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPacks(packs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = packs.filter(pack =>
        pack.name?.toLowerCase().includes(query) ||
        pack.description?.toLowerCase().includes(query) ||
        pack.PackType?.name?.toLowerCase().includes(query) ||
        pack.Category?.name?.toLowerCase().includes(query) ||
        pack.finalPrice?.toString().includes(query) ||
        pack.id?.toString().includes(query)
      );
      setFilteredPacks(filtered);
    }
  }, [searchQuery, packs]);

  // Filter pack types when category changes or when modal opens
  useEffect(() => {
    if (showModal) {
      filterPackTypes(formData.categoryId);
    }
  }, [formData.categoryId, showModal, allPackTypes]);

  const filterPackTypes = (categoryId) => {
    if (!categoryId) {
      // If no category selected, show all pack types (for backward compatibility)
      setFilteredPackTypes(allPackTypes);
    } else {
      // Filter pack types by category (including null categoryId for legacy/global pack types)
      const filtered = allPackTypes.filter(
        pt => pt.categoryId === null || pt.categoryId === parseInt(categoryId)
      );
      setFilteredPackTypes(filtered);
    }
  };

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
      setFilteredPacks(packsRes.data || []);
      setCategories(categoriesRes.data || []);
      setAllPackTypes(packTypesRes.data || []);
      setFilteredPackTypes(packTypesRes.data || []);
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
      const selectedPackType = filteredPackTypes.find(pt => pt.id === parseInt(formData.packTypeId));
      const minPrices = {
        'Weekly': 2000,
        'Bi-Weekly': 4000,
        'Monthly': 7000
      };
      const minPrice = minPrices[selectedPackType?.name] || 0;
      const calculatedPrice = parseFloat(formData.finalPrice);

      if (calculatedPrice < minPrice) {
        setError(`Pack price must be at least ₹${minPrice} for ${selectedPackType?.name} packs`);
        return;
      }

      const packData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        finalPrice: calculatedPrice,
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
    } catch (error) {
      setError('Failed to save pack');
      console.error('Save error:', error);
    }
  };

  const handleEdit = async (pack) => {
    setEditingPack(pack);

    // Load existing pack products first
    try {
      const packProductsResponse = await packProductService.getByPackId(pack.id);
      const packProducts = packProductsResponse.data.map(pp => ({
        productId: pp.productId,
        quantity: pp.quantity,
        unitPrice: pp.unitPrice
      }));
      setSelectedProducts(packProducts);

      // Calculate base price from existing products
      const calculatedBasePrice = packProducts.reduce((total, sp) => total + (sp.quantity * sp.unitPrice), 0);

      setFormData({
        name: pack.name,
        description: pack.description || '',
        categoryId: pack.categoryId?.toString() || '',
        packTypeId: pack.packTypeId?.toString() || '',
        basePrice: calculatedBasePrice.toFixed(2),
        finalPrice: calculatedBasePrice.toFixed(2),
        validFrom: pack.validFrom ? pack.validFrom.substring(0, 10) : '',
        validUntil: pack.validUntil ? pack.validUntil.substring(0, 10) : '',
      });
    } catch (error) {
      console.error('Error loading pack products:', error);
      setSelectedProducts([]);
      setFormData({
        name: pack.name,
        description: pack.description || '',
        categoryId: pack.categoryId?.toString() || '',
        packTypeId: pack.packTypeId?.toString() || '',
        basePrice: pack.basePrice?.toString() || '0',
        finalPrice: pack.finalPrice?.toString() || pack.basePrice?.toString() || '0',
        validFrom: pack.validFrom ? pack.validFrom.substring(0, 10) : '',
        validUntil: pack.validUntil ? pack.validUntil.substring(0, 10) : '',
      });
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pack?')) {
      try {
        await packService.delete(id);
        fetchData();
      } catch (error) {
        setError('Failed to delete pack');
        console.error('Delete error:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      packTypeId: '',
      basePrice: '0',
      finalPrice: '0',
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

  // Auto-calculate price when selected products change
  React.useEffect(() => {
    const calculatedPrice = selectedProducts.reduce((total, sp) => total + (sp.quantity * sp.unitPrice), 0);
    setFormData(prev => ({
      ...prev,
      basePrice: calculatedPrice.toFixed(2),
      finalPrice: calculatedPrice.toFixed(2)
    }));
  }, [selectedProducts]);

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
            <h1 style={{ fontSize: '2rem' }}>Packs Management</h1>
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

        {/* Packs Management */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Packs</h3>
                <div className="card-tools">
                  <div className="input-group input-group-sm" style={{ width: '250px', marginRight: '10px' }}>
                    <input
                      type="text"
                      name="table_search"
                      className="form-control float-right"
                      placeholder="Search packs..."
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
                        <th>Products</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPacks.map((pack) => (
                        <tr key={pack.id}>
                          <td>{pack.id}</td>
                          <td>{pack.name}</td>
                          <td>
                            {pack.Category ? pack.Category.name : 'N/A'}
                          </td>
                          <td>
                            {pack.PackType ? pack.PackType.name : 'N/A'}
                          </td>
                          <td>
                            <small className="text-muted">
                              {pack.Products && pack.Products.length > 0 ? (
                                <div>
                                  {pack.Products.slice(0, 2).map((product, idx) => (
                                    <div key={idx}>
                                      {product.name} ({product.PackProduct.quantity}×₹{product.PackProduct.unitPrice})
                                    </div>
                                  ))}
                                  {pack.Products.length > 2 && (
                                    <div className="text-primary">+{pack.Products.length - 2} more</div>
                                  )}
                                </div>
                              ) : (
                                'No products'
                              )}
                            </small>
                          </td>
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
                            <div className="dropdown">
                              <button
                                className="btn btn-sm btn-secondary dropdown-toggle"
                                type="button"
                                id={`dropdownMenuButton${pack.id}`}
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                              >
                                <i className="fas fa-ellipsis-v"></i>
                              </button>
                              <div className="dropdown-menu" aria-labelledby={`dropdownMenuButton${pack.id}`}>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleEdit(pack)}
                                >
                                  <i className="fas fa-edit mr-2"></i>Edit
                                </button>
                                <div className="dropdown-divider"></div>
                                <button
                                  className="dropdown-item text-danger"
                                  onClick={() => handleDelete(pack.id)}
                                >
                                  <i className="fas fa-trash mr-2"></i>Delete
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {packs.length === 0 && (
                  <div className="text-center py-4">
                    <p>{searchQuery ? 'No packs found matching your search.' : 'No packs found. Add your first pack to get started.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block' }}>
            <div className="modal-dialog modal-lg" style={{ marginTop: '5vh' }}>
              <div className="modal-content" style={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', overflow: 'hidden' }}>
                <div className="modal-header" style={{ padding: '15px 50px 15px 20px', position: 'relative', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <h4 className="modal-title" style={{ fontWeight: '600', margin: 0 }}>
                    {editingPack ? 'Edit Pack' : 'Add Pack'}
                  </h4>
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '15px',
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '5px',
                      lineHeight: '1',
                      opacity: '0.8'
                    }}
                    onClick={() => setShowModal(false)}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body" style={{ padding: '20px' }}>
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
                                packTypeId: '', // Reset pack type when category changes
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
                            {filteredPackTypes.map((packType) => (
                              <option key={packType.id} value={packType.id}>
                                {packType.name} (₹{packType.basePrice})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Pack Price *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.finalPrice}
                            readOnly
                            style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                            title="Auto-calculated from selected products"
                          />
                          <small className="form-text text-muted">
                            Auto-calculated from products (base price)
                          </small>
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
                            <div className="d-flex justify-content-between align-items-center font-weight-bold border-top pt-2">
                              <span>Total Value (Base Price):</span>
                              <span className="text-success">₹{selectedProducts.reduce((total, sp) => total + (sp.quantity * sp.unitPrice), 0).toFixed(2)}</span>
                            </div>
                            {formData.finalPrice && parseFloat(formData.finalPrice) < parseFloat(formData.basePrice) && (
                              <div className="text-warning small mt-1">
                                <i className="fas fa-exclamation-triangle mr-1"></i>
                                Final price is lower than base price (potential discount)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer" style={{ borderTop: 'none', padding: '20px', background: '#f8f9fa' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ borderRadius: '25px', padding: '8px 20px' }}
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ borderRadius: '25px', padding: '8px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                    >
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