'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  sub_category?: string;
  product_code?: string;
  base_price_model: any;
  image_urls?: string[];
  attributes?: Record<string, string>;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const categoryParam = searchParams?.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const category = searchParams?.get('category') || 'all';
    setSelectedCategory(category);
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter(p => p.category === selectedCategory);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const url = category === 'all' ? '/products' : `/products?category=${category}`;
    router.push(url);
  };

  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getMinQuantity = (product: Product) => {
    const tiers = product.base_price_model?.price_tiers || [];
    if (tiers.length === 0) return 1;
    return Math.min(...tiers.map((t: any) => t.min_quantity));
  };

  const getStartingPrice = (product: Product) => {
    const basePrice = product.base_price_model?.base_price || 0;
    const tiers = product.base_price_model?.price_tiers || [];
    
    if (tiers.length > 0) {
      const minQuantity = getMinQuantity(product);
      const firstTier = tiers.find((t: any) => t.min_quantity === minQuantity);
      if (firstTier) {
        return (basePrice + firstTier.price_per_unit * minQuantity).toFixed(2);
      }
    }
    
    return basePrice.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Professional Printing Services</h1>
          <p className="mt-3 text-lg sm:text-xl text-primary-100">
            High-quality printing for your business needs
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatCategoryName(category)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products available in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
              >
                {/* Product Image */}
                <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center group-hover:from-primary-200 group-hover:to-primary-300 transition-colors overflow-hidden">
                  {product.image_urls && product.image_urls.length > 0 ? (
                    <img 
                      src={product.image_urls[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to SVG icon if image fails to load
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <svg
                    className="w-24 h-24 text-primary-600 opacity-50"
                    style={{ display: product.image_urls && product.image_urls.length > 0 ? 'none' : 'block' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                      {product.sub_category ? (
                        <p className="mt-1 text-sm font-medium text-primary-600">
                          {product.sub_category}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">
                          {formatCategoryName(product.category)}
                        </p>
                      )}
                      {product.product_code && (
                        <p className="mt-1 text-xs text-gray-400">
                          Code: {product.product_code}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-gray-600 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Product Attributes */}
                  {product.attributes && Object.keys(product.attributes).length > 0 && (
                    <div className="mt-3 space-y-1">
                      {Object.entries(product.attributes).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex items-start text-xs">
                          <span className="text-gray-500 mr-1">{key}:</span>
                          <span className="text-gray-700 font-medium line-clamp-1">{value}</span>
                        </div>
                      ))}
                      {Object.keys(product.attributes).length > 3 && (
                        <p className="text-xs text-primary-600">+ {Object.keys(product.attributes).length - 3} more</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Starting from</p>
                      <p className="text-2xl font-bold text-primary-600">
                        ${getStartingPrice(product)}
                      </p>
                      <p className="text-xs text-gray-500">Min. {getMinQuantity(product)} units</p>
                    </div>

                    <div className="text-primary-600 group-hover:translate-x-1 transition-transform">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}

