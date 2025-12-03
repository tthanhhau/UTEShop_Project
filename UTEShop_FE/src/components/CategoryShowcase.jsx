import React from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";

const CategoryShowcase = ({ title, subtitle, products, backgroundImage, backgroundColor, textColor, viewAllLink, maxProducts = 4 }) => {
  const navigate = useNavigate();

  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  // Determine grid columns based on maxProducts
  const getGridCols = () => {
    if (maxProducts === 8) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    if (maxProducts === 6) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className={`relative py-12 overflow-hidden w-full ${backgroundColor || 'bg-gray-50'}`}>
      {/* Background Image with Overlay */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="mb-10">
          {/* Title and Description */}
          <div className="mb-6">
            <h2 className={`text-3xl md:text-4xl font-bold mb-3 ${textColor || 'text-gray-800'}`}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-base text-gray-600 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Decorative Bar */}
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mb-6"></div>

          {/* View All Button - Now below title */}
          {viewAllLink && (
            <div className="flex justify-end">
              <button
                onClick={() => navigate(viewAllLink)}
                className="group bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-full text-sm font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <span>Xem tất cả</span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className={`grid ${getGridCols()} gap-6`}>
          {products.slice(0, maxProducts).map((product) => (
            <div
              key={product._id}
              className="transform transition-all duration-300 hover:scale-105"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryShowcase;

