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

interface ProductCardProps {
  product: Product;
  getStartingPrice: (product: Product) => string;
  getMinQuantity: (product: Product) => number;
}

export default function ProductCard({ product, getStartingPrice, getMinQuantity }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group flex flex-col"
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
      <div className="p-6 flex flex-col flex-1">
        {/* Title and Code - Fixed height */}
        <div className="h-16 flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
              {product.name}
            </h3>
            {product.product_code && (
              <p className="mt-1 text-xs text-gray-400">
                Code: {product.product_code}
              </p>
            )}
          </div>
        </div>

        {/* Description - Fixed height */}
        <div className="h-12 mb-3">
          <p className="text-gray-600 line-clamp-2 text-sm">
            {product.description}
          </p>
        </div>

        {/* Product Attributes - Fixed height */}
        <div className="h-16 mb-4">
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="space-y-1">
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
        </div>

        {/* Price Section - Push to bottom */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Starting from</p>
            <p className="text-2xl font-bold text-primary-600">
              ₹{getStartingPrice(product)}
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
  );
}

