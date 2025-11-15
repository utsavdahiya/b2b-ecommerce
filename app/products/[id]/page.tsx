'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  base_price_model: any;
}

interface PriceBreakdown {
  basePrice: number;
  quantityPrice: number;
  optionsPrice: number;
  totalPrice: number;
  pricePerUnit: number;
  breakdown: any;
}

export default function ProductConfiguratorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const productId = parseInt(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Configuration state
  const [config, setConfig] = useState<any>({
    quantity: 100,
    material: '',
    size: '',
    paper: '',
    finishing: [],
    fold: '',
    printing: '',
  });

  // Price calculation state
  const [price, setPrice] = useState<PriceBreakdown | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (product) {
      calculateClientPrice();
    }
  }, [config, product]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products?id=${productId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error('Product not found');
      }

      setProduct(data.product);

      // Set default config values
      const priceModel = data.product.base_price_model;
      const tiers = priceModel.price_tiers || [];
      const defaultQuantity = tiers.length > 0 ? tiers[0].min_quantity : 100;

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

    // Calculate quantity-based price
    let pricePerUnit = 0;
    const priceTiers = priceModel.price_tiers || [];
    
    for (const tier of priceTiers) {
      if (
        config.quantity >= tier.min_quantity &&
        (tier.max_quantity === null || config.quantity <= tier.max_quantity)
      ) {
        pricePerUnit = tier.price_per_unit;
        break;
      }
    }

    const quantityPrice = pricePerUnit * config.quantity;

    // Calculate options price
    let optionsPrice = 0;

    if (config.material && priceModel.material_options) {
      optionsPrice += (priceModel.material_options[config.material] || 0) * config.quantity;
    }

    if (config.size && priceModel.size_options) {
      optionsPrice += (priceModel.size_options[config.size] || 0) * config.quantity;
    }

    if (config.paper && priceModel.paper_options) {
      optionsPrice += (priceModel.paper_options[config.paper] || 0) * config.quantity;
    }

    if (config.fold && priceModel.fold_options) {
      optionsPrice += (priceModel.fold_options[config.fold] || 0) * config.quantity;
    }

    if (config.printing && priceModel.printing_options) {
      optionsPrice += (priceModel.printing_options[config.printing] || 0) * config.quantity;
    }

    if (config.finishing && Array.isArray(config.finishing) && priceModel.finishing_options) {
      for (const finish of config.finishing) {
        optionsPrice += (priceModel.finishing_options[finish] || 0) * config.quantity;
      }
    }

    const totalPrice = basePrice + quantityPrice + optionsPrice;

    setPrice({
      basePrice,
      quantityPrice,
      optionsPrice,
      totalPrice: Math.max(0, totalPrice),
      pricePerUnit,
      breakdown: config,
    });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link
          href="/products"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Configuration Form - Mobile First */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="mt-2 text-gray-600">{product.description}</p>
            </div>

            {/* Quantity Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quantity</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of units
                  </label>
                  <input
                    type="number"
                    value={config.quantity}
                    onChange={(e) => setConfig({ ...config, quantity: parseInt(e.target.value) || 0 })}
                    min={priceModel.price_tiers?.[0]?.min_quantity || 1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                  />
                </div>

                {/* Quantity Tiers Info */}
                {priceModel.price_tiers && priceModel.price_tiers.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Price Tiers:</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      {priceModel.price_tiers.map((tier: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>
                            {tier.min_quantity}
                            {tier.max_quantity && ` - ${tier.max_quantity}`}
                            {!tier.max_quantity && '+'} units
                          </span>
                          <span className="font-medium">
                            ${tier.price_per_unit.toFixed(2)} each
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{formatOptionName(key)}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {value > 0 ? `+$${value.toFixed(2)}` : 'Included'}
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
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 uppercase">{key.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {value > 0 ? `+$${value.toFixed(2)}` : value < 0 ? `$${value.toFixed(2)}` : 'Standard'}
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
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{formatOptionName(key)}</span>
                        <span className="text-sm text-gray-600">
                          {value > 0 ? `+$${value.toFixed(2)}` : 'Included'}
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
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{formatOptionName(key)}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {value > 0 ? `+$${value.toFixed(2)}` : 'Included'}
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
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{formatOptionName(key)}</span>
                        <span className="text-sm text-gray-600">
                          {value > 0 ? `+$${value.toFixed(2)}` : 'Included'}
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
                <p className="text-sm text-gray-600 mb-4">Select all that apply</p>
                <div className="space-y-3">
                  {Object.entries(priceModel.finishing_options).map(([key, value]: [string, any]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.finishing.includes(key)}
                          onChange={(e) => handleFinishingChange(key, e.target.checked)}
                          className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-3 font-medium text-gray-900">
                          {formatOptionName(key)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        +${value.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Summary - Sticky on Desktop */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Summary</h2>

              {price && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">${price.basePrice.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Quantity ({config.quantity} × ${price.pricePerUnit.toFixed(2)}):
                    </span>
                    <span className="font-medium">${price.quantityPrice.toFixed(2)}</span>
                  </div>

                  {price.optionsPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Options & Finishing:</span>
                      <span className="font-medium">${price.optionsPrice.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-3xl font-bold text-primary-600">
                        ${price.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      ${(price.totalPrice / config.quantity).toFixed(2)} per unit
                    </p>
                  </div>
                </div>
              )}

              {message && (
                <div
                  className={`mt-4 p-3 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !config.quantity}
                className="w-full mt-6 py-3 px-6 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                Price calculated in real-time. Final price will be validated at checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

