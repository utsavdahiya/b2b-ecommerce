'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DieShapeSelector from '@/components/DieShapeSelector';
import type { CategoryConfig, CategoryFilter } from '@/lib/types/categoryConfig';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  sub_category?: string;
  product_code?: string;
  base_price_model: any;
  image_urls?: string[];
  stock_quantity?: number;
  estimated_delivery_days?: number;
  attributes?: Record<string, string>;
}

interface PriceBreakdown {
  basePrice: number;
  quantityPrice: number;
  materialPrice: number;
  sizePrice: number;
  finishingPrice: number;
  otherOptionsPrice: number;
  totalPrice: number;
  pricePerUnit: number;
  savings: number;
  breakdown: any;
}

export default function ProductConfiguratorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const productId = parseInt(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [categoryConfig, setCategoryConfig] = useState<CategoryConfig | null>(null);

  // Configuration state
  const [config, setConfig] = useState<any>({
    quantity: 5,
    material: '',
    size: '',
    paper: '',
    finishing: [],
    fold: '',
    printing: '',
  });

  // Price calculation state
  const [price, setPrice] = useState<PriceBreakdown | null>(null);
  const [currentTier, setCurrentTier] = useState<any>(null);

  useEffect(() => {
    // Scroll to top when navigating to product details
    window.scrollTo(0, 0);
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (product) {
      calculateClientPrice();
    }
  }, [config, product]);

  // Set default values from category config when it loads
  useEffect(() => {
    if (categoryConfig && categoryConfig.filters) {
      setConfig((prev: any) => {
        const updated = { ...prev };
        Object.entries(categoryConfig.filters).forEach(([key, filter]) => {
          if (filter.default !== undefined && prev[key] === undefined) {
            updated[key] = filter.default;
          }
        });
        return updated;
      });
    }
  }, [categoryConfig]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products?id=${productId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error('Product not found');
      }

      setProduct(data.product);

      // Fetch category configuration
      if (data.product.category) {
        try {
          const configRes = await fetch(
            `/api/category-config?category=${encodeURIComponent(data.product.category)}`
          );
          if (configRes.ok) {
            const configData = await configRes.json();
            if (configData.data) {
              setCategoryConfig(configData.data);
              console.log('Category config loaded:', configData.data);
            } else {
              console.warn('No category config found for category:', data.product.category);
            }
          } else {
            console.warn('Failed to fetch category config. Status:', configRes.status);
          }
        } catch (error) {
          console.warn('Failed to fetch category config:', error);
        }
      } else {
        console.warn('Product has no category set');
      }

      // Set default config values
      const priceModel = data.product.base_price_model;
      const tiers = priceModel.price_tiers || [];
      const defaultQuantity = tiers.length > 0 ? tiers[0].min_quantity : 1;

      setConfig((prev: any) => ({
        ...prev,
        quantity: defaultQuantity,
        material: Object.keys(priceModel.material_options || {})[0] || '',
        size: Object.keys(priceModel.size_options || {})[0] || '',
        paper: Object.keys(priceModel.paper_options || {})[0] || '',
        fold: Object.keys(priceModel.fold_options || {})[0] || '',
        printing: Object.keys(priceModel.printing_options || {})[0] || '',
      }));
    } catch (error) {
      console.error('Error fetching product:', error);
      setMessage({ type: 'error', text: 'Failed to load product' });
    } finally {
      setLoading(false);
    }
  };

  // Client-side price calculation for instant feedback
  const calculateClientPrice = () => {
    if (!product) return;

    const priceModel = product.base_price_model;
    const basePrice = priceModel.base_price || 0;

    // Handle empty or invalid quantity
    const quantity = Number(config.quantity) || 0;

    // Calculate quantity-based price
    let pricePerUnit = 0;
    let foundTier = null;
    const priceTiers = priceModel.price_tiers || [];
    
    for (const tier of priceTiers) {
      if (
        quantity >= tier.min_quantity &&
        (tier.max_quantity === null || quantity <= tier.max_quantity)
      ) {
        pricePerUnit = tier.price_per_unit;
        foundTier = tier;
        break;
      }
    }

    setCurrentTier(foundTier);
    const quantityPrice = pricePerUnit * quantity;

    // Calculate individual option prices
    let materialPrice = 0;
    let sizePrice = 0;
    let finishingPrice = 0;
    let otherOptionsPrice = 0;

    if (config.material && priceModel.material_options) {
      materialPrice = (priceModel.material_options[config.material] || 0) * quantity;
    }

    if (config.size && priceModel.size_options) {
      sizePrice = (priceModel.size_options[config.size] || 0) * quantity;
    }

    if (config.paper && priceModel.paper_options) {
      otherOptionsPrice += (priceModel.paper_options[config.paper] || 0) * quantity;
    }

    if (config.fold && priceModel.fold_options) {
      otherOptionsPrice += (priceModel.fold_options[config.fold] || 0) * quantity;
    }

    if (config.printing && priceModel.printing_options) {
      otherOptionsPrice += (priceModel.printing_options[config.printing] || 0) * quantity;
    }

    if (config.finishing && Array.isArray(config.finishing) && priceModel.finishing_options) {
      for (const finish of config.finishing) {
        finishingPrice += (priceModel.finishing_options[finish] || 0) * quantity;
      }
    }

    const totalPrice = basePrice + quantityPrice + materialPrice + sizePrice + finishingPrice + otherOptionsPrice;

    // Calculate savings
    const highestTierPrice = priceTiers.length > 0 ? priceTiers[0].price_per_unit : 0;
    const savings = (highestTierPrice - pricePerUnit) * quantity;

    setPrice({
      basePrice,
      quantityPrice,
      materialPrice,
      sizePrice,
      finishingPrice,
      otherOptionsPrice,
      totalPrice: Math.max(0, totalPrice),
      pricePerUnit,
      savings: Math.max(0, savings),
      breakdown: config,
    });
  };

  const handleQuantityChange = (value: string, validateImmediately = true) => {
    const priceModel = product?.base_price_model;
    const minQty = priceModel?.price_tiers?.[0]?.min_quantity || 1;
    
    // Allow empty string during typing
    if (value === '') {
      setConfig({ ...config, quantity: '' });
      return;
    }
    
    const newQuantity = parseInt(value);
    
    // Ignore invalid input
    if (isNaN(newQuantity)) {
      return;
    }
    
    if (validateImmediately) {
      const validQuantity = Math.max(minQty, newQuantity);
      setConfig({ ...config, quantity: validQuantity });
    } else {
      // Allow any value during typing, validate later
      setConfig({ ...config, quantity: newQuantity });
    }
  };

  const handleQuantityBlur = () => {
    const priceModel = product?.base_price_model;
    const minQty = priceModel?.price_tiers?.[0]?.min_quantity || 1;
    
    // If empty or invalid, set to minimum
    if (config.quantity === '' || config.quantity < minQty) {
      setConfig({ ...config, quantity: minQty });
      return;
    }
    
    const validQuantity = Math.max(minQty, config.quantity);
    if (validQuantity !== config.quantity) {
      setConfig({ ...config, quantity: validQuantity });
    }
  };

  const handleFinishingChange = (finish: string, checked: boolean) => {
    setConfig((prev: any) => ({
      ...prev,
      finishing: checked
        ? [...prev.finishing, finish]
        : prev.finishing.filter((f: string) => f !== finish),
    }));
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    setMessage(null);

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product!.id,
          configuration: config,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        // User not authenticated, redirect to login
        const currentPath = window.location.pathname;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add to cart');
      }

      setMessage({ type: 'success', text: 'Added to cart successfully!' });
      
      // Redirect to cart after a short delay
      setTimeout(() => {
        router.push('/cart');
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setAddingToCart(false);
    }
  };

  const formatOptionName = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleCategoryFilterChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderCategoryFilter = (key: string, filter: CategoryFilter) => {
    const value = config[key];

    switch (filter.type) {
      case 'select':
        // Determine layout based on number of options for optimal UX
        const optionCount = filter.options.length;
        let layoutClass = '';
        let buttonClass = '';
        
        if (optionCount <= 2) {
          // For 2 options: side-by-side toggle style
          layoutClass = 'grid grid-cols-2 gap-3';
          buttonClass = 'w-full';
        } else if (optionCount <= 4) {
          // For 3-4 options: horizontal button group
          layoutClass = 'flex flex-wrap gap-2';
          buttonClass = 'flex-1 min-w-[70px]';
        } else {
          // For 5+ options: responsive grid
          layoutClass = 'grid grid-cols-2 sm:grid-cols-3 gap-2';
          buttonClass = 'w-full';
        }
        
        return (
          <div className="bg-white rounded-lg shadow-md p-6" key={key}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {filter.label}
              {filter.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            <div className={layoutClass}>
              {filter.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleCategoryFilterChange(key, option)}
                  className={`
                    ${buttonClass}
                    px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm
                    ${value === option
                      ? 'border-primary-600 bg-primary-600 text-white shadow-md ring-2 ring-primary-300'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary-400 hover:bg-primary-50'
                    }
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 'die_shape_selector':
        return (
          <div className="bg-white rounded-lg shadow-md p-6" key={key}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {filter.label}
              {filter.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            <DieShapeSelector
              options={filter.options}
              selected={value || filter.default}
              onChange={(shapeId) => handleCategoryFilterChange(key, shapeId)}
            />
          </div>
        );

      case 'text':
        return (
          <div className="bg-white rounded-lg shadow-md p-6" key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {filter.label}
              {filter.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleCategoryFilterChange(key, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required={filter.required}
            />
          </div>
        );

      case 'number':
        return (
          <div className="bg-white rounded-lg shadow-md p-6" key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {filter.label}
              {filter.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleCategoryFilterChange(key, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required={filter.required}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const getNextTierInfo = () => {
    if (!product || !currentTier) return null;
    
    const priceTiers = product.base_price_model.price_tiers || [];
    const currentIndex = priceTiers.findIndex((t: any) => t === currentTier);
    
    if (currentIndex < priceTiers.length - 1) {
      const nextTier = priceTiers[currentIndex + 1];
      const unitsNeeded = nextTier.min_quantity - config.quantity;
      const savingsPerUnit = currentTier.price_per_unit - nextTier.price_per_unit;
      const totalSavings = savingsPerUnit * nextTier.min_quantity;
      
      return {
        unitsNeeded,
        nextTierPrice: nextTier.price_per_unit,
        totalSavings,
      };
    }
    
    return null;
  };

  const nextTierInfo = getNextTierInfo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
          <Link href="/products" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const priceModel = product.base_price_model;
  const images = product.image_urls && product.image_urls.length > 0 
    ? product.image_urls 
    : ['https://via.placeholder.com/800x600?text=No+Image'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link
          href="/products"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column: Product Image and Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image Carousel */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative aspect-[4/3] bg-gray-100">
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    imageZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  onClick={() => setImageZoomed(!imageZoomed)}
                />
                
                {images.length > 1 && (
                  <>
                    {/* Navigation Arrows */}
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Navigation */}
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex ? 'border-primary-600 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-2 flex items-center gap-3">
                {product.sub_category && (
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                    {product.sub_category}
                  </span>
                )}
                {product.product_code && (
                  <span className="text-sm text-gray-500">
                    Code: <span className="font-mono font-semibold text-gray-700">{product.product_code}</span>
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{product.description}</p>
              
              {/* Product Attributes */}
              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Product Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(product.attributes).map(([key, value]) => (
                      <div key={key} className="flex items-start bg-white rounded-md p-3 shadow-sm">
                        <div className="flex-1">
                          <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">{key}</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-semibold">{value}</dd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Trust Signals */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{product.stock_quantity || 0} in stock</span>
                </div>
                <div className="flex items-center text-blue-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Ships in {product.estimated_delivery_days || 3}-{(product.estimated_delivery_days || 3) + 2} business days</span>
                </div>
                <div className="flex items-center text-purple-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Bulk discounts available</span>
                </div>
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="bg-white rounded-lg shadow-md p-6 overflow-hidden">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quantity</h2>
              
              <div className="space-y-4">
                <div className="w-full overflow-hidden">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of units
                  </label>
                  
                  {/* Stepper Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(String(Number(config.quantity || 0) - 1))}
                      className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={config.quantity <= (priceModel.price_tiers?.[0]?.min_quantity || 1)}
                    >
                      −
                    </button>
                    
                    <input
                      type="number"
                      value={config.quantity}
                      onChange={(e) => handleQuantityChange(e.target.value, false)}
                      onBlur={handleQuantityBlur}
                      min={priceModel.price_tiers?.[0]?.min_quantity || 1}
                      className="flex-1 min-w-0 px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-xl font-semibold text-gray-900 bg-white"
                    />
                    
                    <button
                      onClick={() => handleQuantityChange(String(Number(config.quantity || 0) + 1))}
                      className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-xl transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Interactive Price Tiers */}
                {priceModel.price_tiers && priceModel.price_tiers.length > 0 && (
                  <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-4 border border-primary-200">
                    <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Volume Pricing Tiers
                    </p>
                    <div className="space-y-2">
                      {priceModel.price_tiers.map((tier: any, index: number) => {
                        const isCurrentTier = currentTier === tier;
                        const isNextTier = index === priceModel.price_tiers.findIndex((t: any) => t === currentTier) + 1;
                        const highestPrice = priceModel.price_tiers[0].price_per_unit;
                        const savings = ((highestPrice - tier.price_per_unit) / highestPrice * 100).toFixed(0);
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleQuantityChange(String(tier.min_quantity))}
                            className={`w-full flex justify-between items-center p-3 rounded-lg text-sm transition-all ${
                              isCurrentTier
                                ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-400'
                                : isNextTier
                                ? 'bg-blue-100 text-blue-900 border-2 border-blue-300 hover:bg-blue-200'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {isCurrentTier && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              {isNextTier && !isCurrentTier && (
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className="font-medium">
                                {tier.min_quantity}
                                {tier.max_quantity && ` - ${tier.max_quantity}`}
                                {!tier.max_quantity && '+'} units
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="font-bold">₹{tier.price_per_unit.toFixed(2)} each</span>
                              {savings !== '0' && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  isCurrentTier ? 'bg-white/20' : 'bg-green-100 text-green-700'
                                }`}>
                                  SAVE {savings}%
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Next Tier Upsell */}
                    {nextTierInfo && (
                      <div className="mt-3 p-3 bg-blue-600 text-white rounded-lg text-sm">
                        <p className="font-semibold flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          Add {nextTierInfo.unitsNeeded} more units and save ₹{nextTierInfo.totalSavings.toFixed(2)}!
                        </p>
                        <p className="text-xs mt-1 opacity-90">
                          Next tier: ₹{nextTierInfo.nextTierPrice.toFixed(2)} per unit
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Category Config Filters - Dynamic filters based on category configuration */}
            {categoryConfig?.filters && Object.entries(categoryConfig.filters).map(([key, filter]) =>
              renderCategoryFilter(key, filter)
            )}

            {/* Material Options */}
            {priceModel.material_options && Object.keys(priceModel.material_options).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Material</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(priceModel.material_options).map(([key, value]: [string, any]) => (
                    <button
                      key={key}
                      onClick={() => setConfig({ ...config, material: key })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        config.material === key
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{formatOptionName(key)}</div>
                      <div className={`text-sm mt-1 ${config.material === key ? 'text-primary-700' : 'text-gray-600'}`}>
                        {value === 0 ? (
                          <span className="inline-flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Standard - Included
                          </span>
                        ) : (
                          `+₹${value.toFixed(2)} per unit`
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Options */}
            {priceModel.size_options && Object.keys(priceModel.size_options).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Size</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(priceModel.size_options).map(([key, value]: [string, any]) => (
                    <button
                      key={key}
                      onClick={() => setConfig({ ...config, size: key })}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        config.size === key
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 uppercase">{key.replace('_', ' ')}</div>
                      <div className={`text-sm mt-1 ${config.size === key ? 'text-primary-700' : 'text-gray-600'}`}>
                        {value === 0 ? 'Standard' : value > 0 ? `+₹${value.toFixed(2)}` : `₹${value.toFixed(2)}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Paper Options */}
            {priceModel.paper_options && Object.keys(priceModel.paper_options).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Paper Type</h2>
                <div className="space-y-2">
                  {Object.entries(priceModel.paper_options).map(([key, value]: [string, any]) => (
                    <button
                      key={key}
                      onClick={() => setConfig({ ...config, paper: key })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        config.paper === key
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">{formatOptionName(key)}</span>
                        <span className={`text-sm ${config.paper === key ? 'text-primary-700 font-medium' : 'text-gray-600'}`}>
                          {value > 0 ? `+₹${value.toFixed(2)}` : 'Included'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fold Options */}
            {priceModel.fold_options && Object.keys(priceModel.fold_options).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Folding</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(priceModel.fold_options).map(([key, value]: [string, any]) => (
                    <button
                      key={key}
                      onClick={() => setConfig({ ...config, fold: key })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        config.fold === key
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{formatOptionName(key)}</div>
                      <div className={`text-sm mt-1 ${config.fold === key ? 'text-primary-700' : 'text-gray-600'}`}>
                        {value > 0 ? `+₹${value.toFixed(2)}` : 'Included'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Printing Options */}
            {priceModel.printing_options && Object.keys(priceModel.printing_options).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Printing</h2>
                <div className="space-y-2">
                  {Object.entries(priceModel.printing_options).map(([key, value]: [string, any]) => (
                    <button
                      key={key}
                      onClick={() => setConfig({ ...config, printing: key })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        config.printing === key
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">{formatOptionName(key)}</span>
                        <span className={`text-sm ${config.printing === key ? 'text-primary-700 font-medium' : 'text-gray-600'}`}>
                          {value > 0 ? `+₹${value.toFixed(2)}` : 'Included'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Finishing Options (Multiple Selection) */}
            {priceModel.finishing_options && Object.keys(priceModel.finishing_options).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Finishing Options</h2>
                <p className="text-sm text-gray-600 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Select multiple options to enhance your product
                </p>
                <div className="space-y-3">
                  {Object.entries(priceModel.finishing_options).map(([key, value]: [string, any]) => (
                    <label
                      key={key}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        config.finishing.includes(key)
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.finishing.includes(key)}
                          onChange={(e) => handleFinishingChange(key, e.target.checked)}
                          className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-3 font-semibold text-gray-900">
                          {formatOptionName(key)}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${config.finishing.includes(key) ? 'text-primary-700' : 'text-gray-600'}`}>
                        +₹{value.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Price Summary - Sticky on Desktop */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24 border-2 border-primary-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Summary</h2>

              {price && (
                <div className="space-y-3">
                  {/* Base Price */}
                  {price.basePrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Setup Fee:</span>
                      <span className="font-medium text-gray-900">₹{price.basePrice.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Quantity Price */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Base ({config.quantity} × ₹{price.pricePerUnit.toFixed(2)}):
                    </span>
                    <span className="font-medium text-gray-900">₹{price.quantityPrice.toFixed(2)}</span>
                  </div>

                  {/* Material Price */}
                  {price.materialPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Material ({formatOptionName(config.material)}):</span>
                      <span className="font-medium text-gray-900">+₹{price.materialPrice.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Size Price */}
                  {price.sizePrice !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Size ({config.size.toUpperCase().replace('_', ' ')}):</span>
                      <span className="font-medium text-gray-900">
                        {price.sizePrice > 0 ? '+' : ''}₹{price.sizePrice.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Other Options */}
                  {price.otherOptionsPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Other Options:</span>
                      <span className="font-medium text-gray-900">+₹{price.otherOptionsPrice.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Finishing Price */}
                  {price.finishingPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Finishing:</span>
                      <span className="font-medium text-gray-900">+₹{price.finishingPrice.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Savings Badge */}
                  {price.savings > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between text-green-700">
                        <span className="flex items-center font-semibold">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          You Save:
                        </span>
                        <span className="font-bold">₹{price.savings.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t-2 border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-3xl font-bold text-primary-600">
                        ₹{price.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-right">
                      ₹{(price.totalPrice / config.quantity).toFixed(2)} per unit
                    </p>
                  </div>
                </div>
              )}

              {message && (
                <div
                  className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Call to Action */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !config.quantity}
                className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                {addingToCart ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding to Cart...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </span>
                )}
              </button>

              {/* Additional Trust Signals */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs text-gray-600">
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Price locked - No surprises at checkout
                </p>
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                  Free shipping on orders over ₹5000
                </p>
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  100% satisfaction guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
