'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from './ProductCard';

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

  // Group products by sub-category
  const groupProductsBySubCategory = (products: Product[]) => {
    const grouped: { [key: string]: Product[] } = {};
    const withoutSubCategory: Product[] = [];

    products.forEach(product => {
      if (product.sub_category && product.sub_category.trim() !== '') {
        if (!grouped[product.sub_category]) {
          grouped[product.sub_category] = [];
        }
        grouped[product.sub_category].push(product);
      } else {
        withoutSubCategory.push(product);
      }
    });

    return { grouped, withoutSubCategory };
  };

  const { grouped: groupedProducts, withoutSubCategory } = groupProductsBySubCategory(filteredProducts);
  const subCategories = Object.keys(groupedProducts).sort();

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
          <div className="space-y-12">
            {/* Render products grouped by sub-category first */}
            {subCategories.map(subCategory => (
              <div key={subCategory} className="space-y-4">
                {/* Sub-category header */}
                <div className="border-b border-gray-200 pb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {formatCategoryName(subCategory)}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {groupedProducts[subCategory].length} {groupedProducts[subCategory].length === 1 ? 'product' : 'products'}
                  </p>
                </div>
                
                {/* Products grid for this sub-category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedProducts[subCategory].map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      getStartingPrice={getStartingPrice}
                      getMinQuantity={getMinQuantity}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Render products without sub-category in "Others" section */}
            {withoutSubCategory.length > 0 && (
              <div className="space-y-4">
                {/* Others section header */}
                <div className="border-b border-gray-200 pb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Others
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {withoutSubCategory.length} {withoutSubCategory.length === 1 ? 'product' : 'products'}
                  </p>
                </div>
                
                {/* Products grid for others */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {withoutSubCategory.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      getStartingPrice={getStartingPrice}
                      getMinQuantity={getMinQuantity}
                    />
                  ))}
                </div>
              </div>
            )}
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

