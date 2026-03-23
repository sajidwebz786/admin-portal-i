 import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { packService, categoryService, productService, packProductService, unitTypeService, packTypeService } from '../services/api';
import { authService } from '../services/api';

const Packs = () => {
  const [packs, setPacks] = useState([]);
  const [filteredPacks, setFilteredPacks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [packTypes, setPackTypes] = useState([]);
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
    content: '',
    categoryId: '',
    packTypeId: '',
    basePrice: '0',
    finalPrice: '',
    sellingPrice: '',
    validFrom: '',
    validUntil: '',
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Standard unit types to show in dropdown (filter out sub-units like 500G, 250G, etc.)
  const standardUnitTypes = unitTypes.filter(u => {
    const abbr = (u.abbreviation || '').toUpperCase().trim();
    const standardUnits = ['KG', 'G', 'L', 'ML', 'PC', 'PCS', 'DOZEN', 'DZ', 'PACK', 'PKT', 'BUNCH'];
    // Exclude sub-units
    const subUnits = ['500G', '250G', '100G', '75G', '200G', '1/2KG', '0.5KG', 'HALF KG', '500ML', '250ML', '100ML', '1/2L', '0.5L', 'HALF L', '1/4KG', '0.25KG', '1/4L', '0.25L', '6PCS', '1/2DZ'];
    return standardUnits.includes(abbr) && !subUnits.includes(abbr);
  });

  // Quantity options based on unit type
  const getQuantityOptions = (unitTypeId) => {
    if (!unitTypeId) return [];
    const unitType = unitTypes.find(u => u.id === parseInt(unitTypeId));
    if (!unitType) return [];
    const abbr = (unitType.abbreviation || '').toUpperCase().trim();
    
    // For pieces/items - allow custom input
    if (['PC', 'PCS', 'PACK', 'PKT', 'BUNCH'].includes(abbr)) {
      return [
        { value: '1', label: '1 PC' },
        { value: '2', label: '2 PCs' },
        { value: '3', label: '3 PCs' },
        { value: '4', label: '4 PCs' },
        { value: '5', label: '5 PCs' },
        { value: '6', label: '6 PCs' },
        { value: 'custom', label: 'Custom...' },
      ];
    }
    
    // For KG/L based units
    if (abbr === 'KG' || abbr === 'L') {
      return [
        { value: '1', label: `1 ${abbr}` },
        { value: '0.5', label: `1/2 ${abbr} (0.5)` },
        { value: '0.25', label: `1/4 ${abbr} (0.25)` },
        { value: 'custom', label: 'Custom...' },
      ];
    }
    
    // For G/ML based units
    if (abbr === 'G' || abbr === 'ML') {
      return [
        { value: '500', label: abbr === 'G' ? '500 G' : '500 ML' },
        { value: '250', label: abbr === 'G' ? '250 G' : '250 ML' },
        { value: '100', label: abbr === 'G' ? '100 G' : '100 ML' },
        { value: 'custom', label: 'Custom...' },
      ];
    }
    
    // For dozen
    if (abbr === 'DOZEN' || abbr === 'DZ') {
      return [
        { value: '1', label: '1 Dozen (12)' },
        { value: '0.5', label: 'Half Dozen (6)' },
        { value: 'custom', label: 'Custom...' },
      ];
    }
    
    return [
      { value: '1', label: '1' },
      { value: 'custom', label: 'Custom...' },
    ];
  };

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

      const [packsRes, categoriesRes, productsRes, unitTypesRes, packTypesRes] = await Promise.all([
        packService.getAll(),
        categoryService.getAll(),
        productService.getAll(),
        unitTypeService.getAll(),
        packTypeService.getAll(),
      ]);

      console.log('Packs data received:', {
        packs: packsRes.data?.length || 0,
        categories: categoriesRes.data?.length || 0,
        products: productsRes.data?.length || 0,
        packTypes: packTypesRes.data?.length || 0,
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
      setPackTypes(packTypesRes.data || []);

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
        isActive: true,  // Always set new packs as active
        basePrice: parseFloat(formData.basePrice),
        finalPrice: calculatedPrice,
        categoryId: parseInt(formData.categoryId),
        packTypeId: formData.packTypeId ? parseInt(formData.packTypeId) : null,
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
            productId: p.productId,
            quantity: parseFloat(p.quantity) || 1,
            unitPrice: parseFloat(p.unitPrice) || p.unitPrice || 0,
            amount: parseFloat(p.amount) || (parseFloat(p.quantity) || 1) * (parseFloat(p.unitPrice) || p.unitPrice || 0),
            unitTypeId: p.unitTypeId || null,
            notes: p.notes || null
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
        unitPrice: parseFloat(pp.unitPrice) || 0,
        unitTypeId: pp.unitTypeId || null,
        notes: pp.notes || '',
        // Use stored amount if available, otherwise calculate from quantity * unitPrice
        amount: pp.amount !== undefined && pp.amount !== null ? parseFloat(pp.amount) : (pp.quantity * (parseFloat(pp.unitPrice) || 0)),
        // If amount was stored, consider it as edited (manually set)
        amountEdited: pp.amount !== undefined && pp.amount !== null
      }));
      setSelectedProducts(packProducts);

      // Calculate base price from existing products (use stored amount if edited)
      const calculatedBasePrice = packProducts.reduce((total, sp) => {
        // Use stored amount if it was edited, otherwise calculate from quantity * unitPrice
        const itemAmount = sp.amountEdited && sp.amount !== undefined ? sp.amount : (sp.quantity * sp.unitPrice);
        return total + itemAmount;
      }, 0);

      setFormData({
        name: pack.name,
        description: pack.description || '',
        content: pack.content || '',
        categoryId: pack.categoryId?.toString() || '',
        packTypeId: pack.packTypeId?.toString() || '',
        basePrice: calculatedBasePrice.toFixed(2),
        finalPrice: calculatedBasePrice.toFixed(2),
        sellingPrice: pack.sellingPrice?.toString() || '',
        validFrom: pack.validFrom ? pack.validFrom.substring(0, 10) : '',
        validUntil: pack.validUntil ? pack.validUntil.substring(0, 10) : '',
      });
    } catch (error) {
      console.error('Error loading pack products:', error);
      setSelectedProducts([]);
      setFormData({
        name: pack.name,
        description: pack.description || '',
        content: pack.content || '',
        categoryId: pack.categoryId?.toString() || '',
        packTypeId: pack.packTypeId?.toString() || '',
        basePrice: pack.basePrice?.toString() || '0',
        finalPrice: pack.finalPrice?.toString() || pack.basePrice?.toString() || '0',
        sellingPrice: pack.sellingPrice?.toString() || '',
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

  const handleToggleStatus = async (pack) => {
    try {
      const newStatus = !pack.isActive;
      const action = newStatus ? 'activate' : 'deactivate';
      if (!window.confirm(`Are you sure you want to ${action} this pack?`)) {
        return;
      }
      await packService.toggleStatus(pack.id, newStatus);
      fetchData();
    } catch (error) {
      setError('Failed to update pack status');
      console.error('Toggle status error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      categoryId: '',
      packTypeId: '',
      basePrice: '0',
      finalPrice: '0',
      sellingPrice: '',
      validFrom: '',
      validUntil: '',
    });
    setSelectedProducts([]);
  };

  const handleProductToggle = (product) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => {
        const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
        const newId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
        return pId === newId;
      });
      
      if (existing) {
        return prev.filter(p => {
          const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
          const filterId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
          return pId !== filterId;
        });
      } else {
        const defaultQty = 1;
        const defaultPrice = parseFloat(product.price) || 0;
        return [...prev, {
          productId: product.id,
          quantity: defaultQty,
          unitPrice: defaultPrice,
          amount: defaultQty * defaultPrice, // Default calculated amount
          amountEdited: false, // Track if amount was manually edited
          unitTypeId: product.unitTypeId || null
        }];
      }
    });
  };

  const handleProductQuantityChange = (productId, quantity) => {
    // Ensure productId is compared as the same type
    const parsedQuantity = parseInt(quantity) || 1;
    setSelectedProducts(prev =>
      prev.map(p => {
        // Convert both to same type for comparison
        const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
        const newId = typeof productId === 'string' ? parseInt(productId) : productId;
        
        return pId === newId
          ? { ...p, quantity: parsedQuantity }
          : p;
      })
    );
  };

  const handleProductPriceChange = (productId, unitPrice) => {
    // Don't allow empty or zero unit price
    const parsedPrice = parseFloat(unitPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return; // Keep the existing value
    }
    setSelectedProducts(prev =>
      prev.map(p => {
        // Convert both to same type for comparison
        const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
        const newId = typeof productId === 'string' ? parseInt(productId) : productId;
        
        if (pId === newId) {
          const newAmount = p.quantity * parsedPrice;
          // If amount was not manually edited, recalculate it
          if (!p.amountEdited) {
            return { ...p, unitPrice: parsedPrice, amount: newAmount };
          } else {
            // If amount was edited, just update unit price but keep edited amount
            return { ...p, unitPrice: parsedPrice };
          }
        }
        return p;
      })
    );
  };

  const handleProductQuantityOptionChange = (productId, quantityOption) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
        const newId = typeof productId === 'string' ? parseInt(productId) : productId;
        
        if (pId !== newId) return p;
        
        // If custom, keep the existing quantity but set a flag
        if (quantityOption === 'custom') {
          return { ...p, useCustomQuantity: true };
        }
        
        // Parse the quantity value - just update quantity, keep unit price same
        const parsedQty = parseFloat(quantityOption);
        
        // Recalculate amount if not edited manually
        const newAmount = p.amountEdited ? p.amount : (parsedQty || 1) * p.unitPrice;
        
        return {
          ...p,
          quantity: parsedQty || 1,
          amount: newAmount,
          useCustomQuantity: false
        };
      })
    );
  };

  const handleProductCustomQuantityChange = (productId, customQty) => {
    const parsedQty = parseFloat(customQty);
    if (isNaN(parsedQty) || parsedQty <= 0) return;
    
    setSelectedProducts(prev =>
      prev.map(p => {
        const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
        const newId = typeof productId === 'string' ? parseInt(productId) : productId;
        
        if (pId !== newId) return p;
        
        // Just update quantity, keep unit price same, recalculate amount if not edited
        const newAmount = p.amountEdited ? p.amount : parsedQty * p.unitPrice;
        return {
          ...p,
          quantity: parsedQty,
          amount: newAmount
        };
      })
    );
  };

  // New handler for amount change - when user manually edits the amount
  const handleProductAmountChange = (productId, newAmount) => {
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return; // Keep the existing value
    }
    setSelectedProducts(prev =>
      prev.map(p => {
        const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
        const newId = typeof productId === 'string' ? parseInt(productId) : productId;
        
        if (pId === newId) {
          return { 
            ...p, 
            amount: parsedAmount, 
            amountEdited: true // Mark as manually edited
          };
        }
        return p;
      })
    );
  };

  const handleProductNotesChange = (productId, notes) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
        const newId = typeof productId === 'string' ? parseInt(productId) : productId;
        
        return pId === newId
          ? { ...p, notes: notes }
          : p;
      })
    );
  };

  // Helper function to calculate unit type conversion ratio
  // Returns the multiplier to convert price from old unit to new unit
  // Example: 180/kg to 500g = 180 * 0.5 = 90 (divide by 2 because 500g is half of 1kg)
  const getUnitConversionRatio = (fromUnitTypeId, toUnitTypeId, products, unitTypes) => {
    if (!fromUnitTypeId || !toUnitTypeId || fromUnitTypeId === toUnitTypeId) return 1;
    
    const fromUnit = unitTypes.find(u => u.id === fromUnitTypeId);
    const toUnit = unitTypes.find(u => u.id === toUnitTypeId);
    
    if (!fromUnit || !toUnit) return 1;
    
    // Get abbreviations in lowercase for comparison
    const fromAbbr = (fromUnit.abbreviation || '').toLowerCase().trim();
    const toAbbr = (toUnit.abbreviation || '').toLowerCase().trim();
    
    // ==========================================
    // KILOGRAM BASED CONVERSIONS
    // ==========================================
    // kg to g
    if (fromAbbr === 'kg' && toAbbr === 'g') return 0.001;
    // kg to 500g / 1/2kg / 0.5kg
    if (fromAbbr === 'kg' && ['500g', '1/2kg', '0.5kg', 'half kg'].includes(toAbbr)) return 0.5;
    // kg to 250g
    if (fromAbbr === 'kg' && toAbbr === '250g') return 0.25;
    // kg to 100g
    if (fromAbbr === 'kg' && toAbbr === '100g') return 0.1;
    
    // g to kg
    if (fromAbbr === 'g' && toAbbr === 'kg') return 1000;
    // g to 500g
    if (fromAbbr === 'g' && ['500g', '1/2kg', '0.5kg', 'half kg'].includes(toAbbr)) return 500;
    // g to 250g
    if (fromAbbr === 'g' && toAbbr === '250g') return 250;
    // g to 100g
    if (fromAbbr === 'g' && toAbbr === '100g') return 100;
    
    // 500g to kg
    if (['500g', '1/2kg', '0.5kg', 'half kg'].includes(fromAbbr) && toAbbr === 'kg') return 2;
    // 500g to g
    if (['500g', '1/2kg', '0.5kg', 'half kg'].includes(fromAbbr) && toAbbr === 'g') return 500;
    // 500g to 250g
    if (['500g', '1/2kg', '0.5kg', 'half kg'].includes(fromAbbr) && toAbbr === '250g') return 2;
    // 500g to 100g
    if (['500g', '1/2kg', '0.5kg', 'half kg'].includes(fromAbbr) && toAbbr === '100g') return 5;
    
    // ==========================================
    // DOZEN BASED CONVERSIONS (12 items = 1 dozen)
    // ==========================================
    // Dozen to Half Dozen (6 pcs)
    if ((fromAbbr === 'dozen' || fromAbbr === 'dz' || fromAbbr === '12pcs') && 
        (toAbbr === 'half dozen' || toAbbr === 'hdzn' || toAbbr === '6pcs' || toAbbr === '1/2dz')) return 0.5;
    // Dozen to pieces
    if ((fromAbbr === 'dozen' || fromAbbr === 'dz' || fromAbbr === '12pcs') && toAbbr === 'pc') return 12;
    if ((fromAbbr === 'dozen' || fromAbbr === 'dz' || fromAbbr === '12pcs') && toAbbr === 'pcs') return 12;
    
    // Half Dozen (6 pcs) to Dozen
    if ((fromAbbr === 'half dozen' || fromAbbr === 'hdzn' || fromAbbr === '6pcs' || fromAbbr === '1/2dz') && 
        (toAbbr === 'dozen' || toAbbr === 'dz' || toAbbr === '12pcs')) return 2;
    // Half Dozen to pieces
    if ((fromAbbr === 'half dozen' || fromAbbr === 'hdzn' || fromAbbr === '6pcs' || fromAbbr === '1/2dz') && toAbbr === 'pc') return 6;
    if ((fromAbbr === 'half dozen' || fromAbbr === 'hdzn' || fromAbbr === '6pcs' || fromAbbr === '1/2dz') && toAbbr === 'pcs') return 6;
    
    // Pieces to Dozen
    if ((fromAbbr === 'pc' || fromAbbr === 'pcs') && (toAbbr === 'dozen' || toAbbr === 'dz' || toAbbr === '12pcs')) return 1/12;
    // Pieces to Half Dozen
    if ((fromAbbr === 'pc' || fromAbbr === 'pcs') && (toAbbr === 'half dozen' || toAbbr === 'hdzn' || toAbbr === '6pcs' || toAbbr === '1/2dz')) return 1/6;
    
    // ==========================================
    // LITER BASED CONVERSIONS
    // ==========================================
    // L to ml
    if (fromAbbr === 'l' && toAbbr === 'ml') return 0.001;
    // L to 500ml
    if (fromAbbr === 'l' && ['500ml', '1/2l', '0.5l'].includes(toAbbr)) return 0.5;
    // L to 250ml
    if (fromAbbr === 'l' && toAbbr === '250ml') return 0.25;
    
    // ml to L
    if (fromAbbr === 'ml' && toAbbr === 'l') return 1000;
    // 500ml to L
    if (['500ml', '1/2l', '0.5l'].includes(fromAbbr) && toAbbr === 'l') return 2;
    
    // Default: no conversion
    return 1;
  };

  const handleProductUnitTypeChange = (productId, newUnitTypeId) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        // Convert both to same type for comparison
        const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
        const newId = typeof productId === 'string' ? parseInt(productId) : productId;
        
        if (pId !== newId) return p;
        
        // Get the product to find its original unit type and price
        const product = products.find(prod => {
          const prodId = typeof prod.id === 'string' ? parseInt(prod.id) : prod.id;
          return prodId === newId;
        });
        if (!product) return { ...p, unitTypeId: parseInt(newUnitTypeId) || null };
        
        // Calculate new price based on unit type conversion
        const oldUnitTypeId = p.unitTypeId || product.unitTypeId;
        const ratio = getUnitConversionRatio(oldUnitTypeId, parseInt(newUnitTypeId), products, unitTypes);
        const newPrice = (p.unitPrice || product.price) * ratio;
        
        // Recalculate amount if not manually edited
        const newAmount = p.amountEdited ? p.amount : p.quantity * parseFloat(newPrice.toFixed(2));
        
        return {
          ...p,
          unitTypeId: parseInt(newUnitTypeId) || null,
          unitPrice: parseFloat(newPrice.toFixed(2)),
          amount: newAmount
        };
      })
    );
  };

  const removeProductFromPack = (productId) => {
    setSelectedProducts(prev => 
      prev.filter(p => {
        const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
        const removeId = typeof productId === 'string' ? parseInt(productId) : productId;
        return pId !== removeId;
      })
    );
  };

  // Auto-calculate price when selected products change
  // Use edited amount if available, otherwise calculate from quantity * unitPrice
  React.useEffect(() => {
    const calculatedPrice = selectedProducts.reduce((total, sp) => {
      // If amount was manually edited, use that value; otherwise calculate from qty * unitPrice
      const itemAmount = sp.amountEdited && sp.amount !== undefined ? sp.amount : ((sp.quantity || 0) * (sp.unitPrice || 0));
      return total + itemAmount;
    }, 0);
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
                    style={{ marginRight: '10px', display: 'none' }}
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
                          <td>₹{pack.sellingPrice || pack.finalPrice}</td>
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
                            <div className="action-buttons">
                              <button
                                className={`btn btn-sm ${pack.isActive ? 'btn-warning' : 'btn-success'}`}
                                onClick={() => handleToggleStatus(pack)}
                                title={pack.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <i className={`fas ${pack.isActive ? 'fa-ban' : 'fa-check'}`}></i>
                              </button>
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => handleEdit(pack)}
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(pack.id)}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
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
            <div className="modal-dialog modal-xl" style={{ marginTop: '5vh', maxWidth: '1200px' }}>
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
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Pack Type</label>
                          <select
                            className="form-control"
                            value={formData.packTypeId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                packTypeId: e.target.value,
                              })
                            }
                          >
                            <option value="">Select Pack Type</option>
                            {packTypes.map((packType) => (
                              <option key={packType.id} value={packType.id}>
                                {packType.name}
                              </option>
                            ))}
                          </select>
                          <small className="form-text text-muted">
                            Optional: Select a pack type for this pack
                          </small>
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

                    <div className="form-group">
                      <label>Content (Long Description)</label>
                      <textarea
                        className="form-control"
                        rows="5"
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            content: e.target.value,
                          })
                        }
                        placeholder="Enter detailed content about this pack..."
                      ></textarea>
                      <small className="form-text text-muted">
                        This will be displayed as the long description for the pack
                      </small>
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
                            style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed', fontSize: '18px', fontWeight: 'bold' }}
                            title="Auto-calculated from selected products"
                          />
                          <small className="form-text text-muted">
                            Auto-calculated from products (base price)
                          </small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Selling Price (Customer Price)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.sellingPrice}
                            onChange={(e) =>
                              setFormData({ ...formData, sellingPrice: e.target.value })
                            }
                            placeholder="Enter selling price"
                            style={{ fontSize: '18px', fontWeight: 'bold', borderColor: formData.sellingPrice && parseFloat(formData.sellingPrice) < parseFloat(formData.finalPrice) ? '#ffc107' : '' }}
                          />
                          <small className="form-text text-muted">
                            Price shown to customers (leave empty to use base price)
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
                                  // Normalize IDs to handle string/number type mismatches
                                  const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
                                  const isSelected = selectedProducts.some(p => {
                                    const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
                                    return pId === productId;
                                  });
                                  const selectedProduct = selectedProducts.find(p => {
                                    const pId = typeof p.productId === 'string' ? parseInt(p.productId) : p.productId;
                                    return pId === productId;
                                  });

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
                                              <div className="mt-3" style={{ borderTop: '1px solid #e3e6f0', paddingTop: '12px' }}>
                                                {/* Field Labels Row */}
                                                <div className="row mb-2">
                                                  <div className="col-md-2">
                                                    <span style={{ fontWeight: 700, fontSize: '1.08rem', color: '#343a40', letterSpacing: '0.5px' }}>Quantity</span>
                                                  </div>
                                                  <div className="col-md-2">
                                                    <span style={{ fontWeight: 700, fontSize: '1.08rem', color: '#343a40', letterSpacing: '0.5px' }}>Unit Type</span>
                                                  </div>
                                                  <div className="col-md-3">
                                                    <span style={{ fontWeight: 700, fontSize: '1.08rem', color: '#343a40', letterSpacing: '0.5px' }}>Unit Price (₹)</span>
                                                  </div>
                                                  <div className="col-md-3">
                                                    <span style={{ fontWeight: 700, fontSize: '1.08rem', color: '#343a40', letterSpacing: '0.5px' }}>Total Amount (₹)</span>
                                                  </div>
                                                  <div className="col-md-2">
                                                    <span style={{ fontWeight: 700, fontSize: '1.08rem', color: '#343a40', letterSpacing: '0.5px' }}>Action</span>
                                                  </div>
                                                </div>
                                                {/* Input Fields Row */}
                                                <div className="row">
                                                  <div className="col-md-2">
                                                    <select
                                                      className="form-control form-control-sm"
                                                      value={selectedProduct.unitTypeId || product.unitTypeId || ''}
                                                      onChange={(e) => handleProductUnitTypeChange(product.id, e.target.value)}
                                                      title="Select unit of measurement"
                                                    >
                                                      <option value="">Select Unit</option>
                                                      {standardUnitTypes.map((u) => (
                                                        <option key={u.id} value={u.id}>
                                                          {u.abbreviation}
                                                        </option>
                                                      ))}
                                                    </select>
                                                  </div>
                                                  <div className="col-md-2">
                                                    <select
                                                      className="form-control form-control-sm"
                                                      value={selectedProduct.useCustomQuantity ? 'custom' : (selectedProduct.quantity || 1).toString()}
                                                      onChange={(e) => handleProductQuantityOptionChange(product.id, e.target.value)}
                                                      title="Select or enter quantity"
                                                    >
                                                      {getQuantityOptions(selectedProduct.unitTypeId || product.unitTypeId).map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                          {opt.label}
                                                        </option>
                                                      ))}
                                                    </select>
                                                    {selectedProduct.useCustomQuantity && (
                                                      <input
                                                        type="number"
                                                        className="form-control form-control-sm mt-1"
                                                        placeholder="Enter quantity"
                                                        value={selectedProduct.quantity || ''}
                                                        onChange={(e) => handleProductCustomQuantityChange(product.id, e.target.value)}
                                                        min="0.01"
                                                        step="0.01"
                                                      />
                                                    )}
                                                  </div>
                                                  <div className="col-md-3">
                                                    <input
                                                      type="number"
                                                      step="0.01"
                                                      className="form-control form-control-sm"
                                                      placeholder="0.00"
                                                      value={(selectedProduct.unitPrice || 0).toFixed(2)}
                                                      onChange={(e) => {
                                                        handleProductPriceChange(product.id, e.target.value);
                                                      }}
                                                      title="Price per unit"
                                                    />
                                                  </div>
                                                  <div className="col-md-3">
                                                    <input
                                                      type="number"
                                                      step="0.01"
                                                      className={`form-control form-control-sm ${selectedProduct.amountEdited ? 'border-warning' : ''}`}
                                                      placeholder="0.00"
                                                      value={(selectedProduct.amount || 0).toFixed(2)}
                                                      onChange={(e) => {
                                                        handleProductAmountChange(product.id, e.target.value);
                                                      }}
                                                      title={selectedProduct.amountEdited ? 'Amount manually edited' : 'Auto-calculated: Quantity x Unit Price'}
                                                    />
                                                    {selectedProduct.amountEdited && (
                                                      <div className="text-warning" style={{ fontSize: '10px', marginTop: '2px' }}>
                                                        <i className="fas fa-edit"></i> Modified
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                                {/* Notes field for price variation and Remove button */}
                                                <div className="row mt-3 pt-2" style={{ borderTop: '1px solid #e3e6f0' }}>
                                                  <div className="col-md-10">
                                                    <label className="small text-muted font-weight-bold mb-1">Notes (optional)</label>
                                                    <input
                                                      type="text"
                                                      className="form-control form-control-sm"
                                                      placeholder="e.g., small PC, medium PC, large PC - reason for price variation"
                                                      value={selectedProduct.notes || ''}
                                                      onChange={(e) => handleProductNotesChange(product.id, e.target.value)}
                                                    />
                                                  </div>
                                                  <div className="col-md-2 d-flex align-items-end justify-content-center">
                                                    <button
                                                      type="button"
                                                      onClick={() => removeProductFromPack(product.id)}
                                                      title="Remove this product"
                                                      className="btn btn-sm btn-danger"
                                                      style={{ 
                                                        padding: '4px 8px',
                                                        fontSize: '14px',
                                                        transition: 'transform 0.2s',
                                                        marginBottom: '4px'
                                                      }}
                                                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                    >
                                                      Remove
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
                              const product = products.find(p => {
                                const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                                const spId = typeof sp.productId === 'string' ? parseInt(sp.productId) : sp.productId;
                                return pId === spId;
                              });
                              // Use edited amount if available, otherwise calculate from quantity * unitPrice
                              const displayAmount = sp.amountEdited && sp.amount !== undefined ? sp.amount : (sp.quantity * sp.unitPrice);
                              return (
                                <div key={sp.productId} className="d-flex justify-content-between align-items-center mb-1">
                                  <span>{product?.name}</span>
                                  <small className={`text-muted ${sp.amountEdited ? 'text-warning' : ''}`}>
                                    {sp.quantity} × ₹{sp.unitPrice} {sp.unitTypeId ? `(${unitTypes.find(u => u.id === sp.unitTypeId)?.abbreviation || ''})` : ''} = ₹{displayAmount.toFixed(2)}
                                    {sp.amountEdited && <span className="ml-1" title="Amount manually modified">✎</span>}
                                    {sp.notes && <span className="text-info ml-1" title={sp.notes}>*</span>}
                                  </small>
                                </div>
                              );
                            })}
                            <div className="d-flex justify-content-between align-items-center font-weight-bold border-top pt-2">
                              <span>Total Value (Base Price):</span>
                              <span className="text-success">₹{selectedProducts.reduce((total, sp) => {
                                // Use edited amount if available, otherwise calculate from quantity * unitPrice
                                const itemAmount = sp.amountEdited && sp.amount !== undefined ? sp.amount : (sp.quantity * sp.unitPrice);
                                return total + itemAmount;
                              }, 0).toFixed(2)}</span>
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