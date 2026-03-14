import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { packService, categoryService, productService, packProductService, unitTypeService } from '../services/api';
import { authService } from '../services/api';

const Packs = () => {
  const [packs, setPacks] = useState([]);
  const [filteredPacks, setFilteredPacks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPack, setEditingPack] = useState(null);

  // Scroll to top when modal opens
  useEffect(() => {
    if (showModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const modalContent = document.querySelector('.modal-content');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }
  }, [showModal]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
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
        pack.Category?.name?.toLowerCase().includes(query) ||
        pack.finalPrice?.toString().includes(query) ||
        pack.id?.toString().includes(query)
      );
      setFilteredPacks(filtered);
    }
  }, [searchQuery, packs]);

  // Ensure selected products always match the selected category.
  // If the category changes, drop selections that no longer belong to the chosen category.
  useEffect(() => {
    if (!formData.categoryId) {
      setSelectedProducts([]);
      return;
    }

    const categoryIdNum = parseInt(formData.categoryId);
    setSelectedProducts((prevSelected) =>
      prevSelected.filter((selected) => {
        const product = products.find((p) => p.id === selected.productId);
        return product?.categoryId === categoryIdNum;
      })
    );
  }, [formData.categoryId, products]);

  // Maintain a filtered product list based on the chosen category (for the selection UI)
  useEffect(() => {
    const categoryIdNum = parseInt(formData.categoryId);
    if (!categoryIdNum) {
      setFilteredProducts([]);
      return;
    }

    const filtered = products.filter((product) => product.categoryId === categoryIdNum);
    setFilteredProducts(filtered);
  }, [formData.categoryId, products]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [packsRes, categoriesRes, productsRes, unitTypesRes] = await Promise.all([
        packService.getAll(),
        categoryService.getAll(),
        productService.getAll(),
        unitTypeService.getAll(),
      ]);

      console.log('Packs data received:', {
        packs: packsRes.data?.length || 0,
        categories: categoriesRes.data?.length || 0,
        products: productsRes.data?.length || 0,
      });

      // Sort packs by categoryId, then by id
      const sortedPacks = (packsRes.data || []).sort((a, b) => {
        if (a.categoryId !== b.categoryId) {
          return a.categoryId - b.categoryId;
        }
        return a.id - b.id;
      });

      setPacks(sortedPacks);
      setFilteredPacks(sortedPacks);
      setCategories(categoriesRes.data || []);

      // Sort products by categoryId, then by id to maintain consistent order
      const sortedProducts = (productsRes.data || []).sort((a, b) => {
        if (a.categoryId !== b.categoryId) {
          return a.categoryId - b.categoryId;
        }
        return a.id - b.id;
      });

      setProducts(sortedProducts);
      setUnitTypes(unitTypesRes.data || []);
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
      const calculatedPrice = parseFloat(formData.finalPrice);

      const packData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        finalPrice: calculatedPrice,
        categoryId: parseInt(formData.categoryId),
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
          // Validate all products have valid unitPrice
          const validProducts = selectedProducts.map(p => ({
            ...p,
            unitPrice: parseFloat(p.unitPrice) || p.unitPrice || 0,
            quantity: parseInt(p.quantity) || 1
          }));

          // Check if any product has invalid unitPrice
          const invalidProducts = validProducts.filter(p => !p.unitPrice || p.unitPrice <= 0);
          if (invalidProducts.length > 0) {
            setError('All products must have a valid unit price greater than 0');
            return;
          }

          // First delete existing pack products if editing
          if (editingPack) {
            await packProductService.deleteByPackId(editingPack.id);
          }
          await packProductService.createBulk({
            packId: savedPack.data.id,
            products: validProducts
          });
        } catch (error) {
          console.error('Error saving pack products:', error);
          // Pack was saved successfully, but products failed - show warning but don't fail
          setShowModal(false);
          setEditingPack(null);
          resetForm();
          fetchData();
          // Show a warning that pack was saved but products need attention
          alert('Pack saved successfully, but there was an issue saving the products. Please edit the pack to update products.');
          return;
        }
      } else if (editingPack && selectedProducts.length === 0) {
        // If editing and no products selected, delete all existing products
        try {
          await packProductService.deleteByPackId(editingPack.id);
        } catch (error) {
          console.error('Error deleting pack products:', error);
        }
      }

      setShowModal(false);
      setEditingPack(null);
      resetForm();
      // Scroll to the updated pack row
      const packId = savedPack.data.id;
      setTimeout(() => {
        const packRow = document.getElementById(`pack-row-${packId}`);
        if (packRow) {
          packRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          packRow.classList.add('bg-success');
          setTimeout(() => packRow.classList.remove('bg-success'), 2000);
        }
      }, 100);
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save pack';
      setError(errorMessage);
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
        unitPrice: pp.unitPrice,
        unitTypeId: pp.unitTypeId || null
      }));
      setSelectedProducts(packProducts);

      // Calculate base price from existing products
      const calculatedBasePrice = packProducts.reduce((total, sp) => total + (sp.quantity * sp.unitPrice), 0);

      setFormData({
        name: pack.name,
        description: pack.description || '',
        categoryId: pack.categoryId?.toString() || '',
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
          unitPrice: product.price,
          unitTypeId: product.unitTypeId || null
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
    // Don't allow empty or zero unit price
    const parsedPrice = parseFloat(unitPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return; // Keep the existing value
    }
    setSelectedProducts(prev =>
      prev.map(p =>
        p.productId === productId
          ? { ...p, unitPrice: parsedPrice }
          : p
      )
    );
  };

  // Helper function to calculate unit type conversion ratio
  // Returns the multiplier to convert price from old unit to new unit
  const getUnitConversionRatio = (fromUnitTypeId, toUnitTypeId, products, unitTypes) => {
    if (!fromUnitTypeId || !toUnitTypeId || fromUnitTypeId === toUnitTypeId) return 1;
    
    const fromUnit = unitTypes.find(u => u.id === fromUnitTypeId);
    const toUnit = unitTypes.find(u => u.id === toUnitTypeId);
    
    if (!fromUnit || !toUnit) return 1;
    
    // Common weight conversions
    const fromAbbr = fromUnit.abbreviation?.toLowerCase() || '';
    const toAbbr = toUnit.abbreviation?.toLowerCase() || '';
    
    // When converting FROM a larger unit TO a smaller unit, we need to divide
    // Example: 180/kg to 500g means 180/2 = 90 (divide by 2 because 500g is half of 1kg)
    // kg to g: divide by 1000 (1kg = 1000g, so price per gram is price per kg / 1000)
    if (fromAbbr === 'kg' && toAbbr === 'g') return 0.001;
    // kg to 500g: divide by 2 (1kg = 2 x 500g, so price per 500g is price per kg / 2)
    if (fromAbbr === 'kg' && (toAbbr === '500g' || toAbbr === '1/2kg' || toAbbr === '0.5kg')) return 0.5;
    // kg to 250g: divide by 4
    if (fromAbbr === 'kg' && toAbbr === '250g') return 0.25;
    // kg to 100g: divide by 10
    if (fromAbbr === 'kg' && toAbbr === '100g') return 0.1;
    
    // g to kg: multiply by 1000 (1g = 0.001kg, so price per kg = price per g * 1000)
    if (fromAbbr === 'g' && toAbbr === 'kg') return 1000;
    // g to 500g: multiply by 500 (1g = 0.5 500g, so price per 500g = price per g * 500)
    if (fromAbbr === 'g' && (toAbbr === '500g' || toAbbr === '1/2kg' || toAbbr === '0.5kg')) return 500;
    // g to 250g: multiply by 250
    if (fromAbbr === 'g' && toAbbr === '250g') return 250;
    // g to 100g: multiply by 100
    if (fromAbbr === 'g' && toAbbr === '100g') return 100;
    
    // 500g to kg: multiply by 2 (1 x 500g = 0.5kg, so price per kg = price per 500g * 2)
    if ((fromAbbr === '500g' || fromAbbr === '1/2kg' || fromAbbr === '0.5kg') && toAbbr === 'kg') return 2;
    // 500g to g: multiply by 500 (1 x 500g = 500g, so price per g = price per 500g * 500)
    if ((fromAbbr === '500g' || fromAbbr === '1/2kg' || fromAbbr === '0.5kg') && toAbbr === 'g') return 500;
    // 500g to 250g: multiply by 2 (1 x 500g = 2 x 250g)
    if ((fromAbbr === '500g' || fromAbbr === '1/2kg' || fromAbbr === '0.5kg') && toAbbr === '250g') return 2;
    // 500g to 100g: multiply by 5 (1 x 500g = 5 x 100g)
    if ((fromAbbr === '500g' || fromAbbr === '1/2kg' || fromAbbr === '0.5kg') && toAbbr === '100g') return 5;
    
    // Default: no conversion
    return 1;
  };

  const handleProductUnitTypeChange = (productId, newUnitTypeId) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p.productId !== productId) return p;
        
        // Get the product to find its original unit type and price
        const product = products.find(prod => prod.id === productId);
        if (!product) return { ...p, unitTypeId: parseInt(newUnitTypeId) || null };
        
        // Calculate new price based on unit type conversion
        const oldUnitTypeId = p.unitTypeId || product.unitTypeId;
        const ratio = getUnitConversionRatio(oldUnitTypeId, parseInt(newUnitTypeId), products, unitTypes);
        const newPrice = (p.unitPrice || product.price) * ratio;
        
        return {
          ...p,
          unitTypeId: parseInt(newUnitTypeId) || null,
          unitPrice: parseFloat(newPrice.toFixed(2))
        };
      })
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

  const handleResetAllPacks = async () => {
    if (!window.confirm('⚠️ WARNING: This will DELETE ALL packs, pack-products, and pack types! This action cannot be undone. Are you sure you want to continue?')) {
      return;
    }
    if (!window.confirm('⚠️ FINAL WARNING: All packs will be permanently deleted and pack IDs will restart from 1. Continue?')) {
      return;
    }
    try {
      setLoading(true);
      await packService.resetAll();
      alert('All packs have been reset successfully. You can now add packs starting from ID 1.');
      fetchData();
    } catch (error) {
      setError('Failed to reset packs: ' + (error.response?.data?.message || error.message));
      console.error('Reset error:', error);
    } finally {
      setLoading(false);
    }
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
                    className="btn btn-danger btn-sm"
                    onClick={handleResetAllPacks}
                    style={{ marginRight: '10px' }}
                    title="Delete all packs and reset IDs to start from 1"
                  >
                    <i className="fas fa-trash-alt"></i> Reset All
                  </button>
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
                        <tr key={pack.id} id={`pack-row-${pack.id}`}>
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
                        {formData.categoryId ? (
                          <>
                            <div className="mb-2 text-muted small">
                              Showing products for: {categories.find(c => c.id === parseInt(formData.categoryId))?.name}
                            </div>
                            <div className="row">
                              {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => {
                                  const isSelected = selectedProducts.some(p => p.productId === product.id);
                                  const selectedProduct = selectedProducts.find(p => p.productId === product.id);

                                  return (
                                    <div key={product.id} className="col-md-6 mb-3">
                                      <div className={`card ${isSelected ? 'border-primary shadow-sm' : 'shadow-sm'}`}>
                                        <div className="card-body p-3 d-flex align-items-start">
                                          <div className="custom-control custom-checkbox mr-3" style={{ flexShrink: 0 }}>
                                            <input
                                              type="checkbox"
                                              className="custom-control-input"
                                              id={`product-checkbox-${product.id}`}
                                              checked={isSelected}
                                              onChange={() => handleProductToggle(product)}
                                            />
                                            <label
                                              className="custom-control-label"
                                              htmlFor={`product-checkbox-${product.id}`}
                                            />
                                          </div>
                                          <div className="flex-grow-1">
                                            <div className="d-flex align-items-start">
                                              {product.image && (
                                                <img
                                                  src={product.image}
                                                  alt={product.name}
                                                  style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, marginRight: 12 }}
                                                />
                                              )}
                                              <div>
                                                <div className="font-weight-bold">{product.name}</div>
                                                <div className="text-muted small">
                                                  ₹{product.price} per {product.UnitType?.abbreviation || 'unit'}
                                                </div>
                                              </div>
                                            </div>

                                            {isSelected && (
                                              <div className="mt-3">
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
                                                  <div className="col-3">
                                                    <select
                                                      className="form-control form-control-sm"
                                                      value={selectedProduct.unitTypeId || ''}
                                                      onChange={(e) => handleProductUnitTypeChange(product.id, e.target.value)}
                                                    >
                                                      <option value="">Unit</option>
                                                      {unitTypes.map((u) => (
                                                        <option key={u.id} value={u.id}>
                                                          {u.abbreviation}
                                                        </option>
                                                      ))}
                                                    </select>
                                                  </div>
                                                  <div className="col-3">
                                                    <input
                                                      type="number"
                                                      step="0.01"
                                                      className="form-control form-control-sm"
                                                      placeholder="Price"
                                                      value={selectedProduct.unitPrice}
                                                      onChange={(e) => handleProductPriceChange(product.id, e.target.value)}
                                                    />
                                                  </div>
                                                  <div className="col-2 d-flex justify-content-end">
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
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="col-12 text-center py-4 text-muted">
                                  <i className="fas fa-info-circle mr-2"></i>
                                  No products found for this category.
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-muted py-4">
                            <i className="fas fa-info-circle mr-2"></i>
                            Please select a category to view available products
                          </div>
                        )}

                        {selectedProducts.length > 0 && (
                          <div className="mt-3 pt-3 border-top">
                            <h6>Selected Products ({selectedProducts.length})</h6>
                            {selectedProducts.map((sp) => {
                              const product = products.find(p => p.id === sp.productId);
                              return (
                                <div key={sp.productId} className="d-flex justify-content-between align-items-center mb-1">
                                  <span>{product?.name}</span>
                                  <small className="text-muted">
                                    {sp.quantity} × ₹{sp.unitPrice} {sp.unitTypeId ? `(${unitTypes.find(u => u.id === sp.unitTypeId)?.abbreviation || ''})` : ''} = ₹{(sp.quantity * sp.unitPrice).toFixed(2)}
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