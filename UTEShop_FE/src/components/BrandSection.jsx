import React from "react";
import { useNavigate } from "react-router-dom";

const BrandSection = ({ brands }) => {
  const navigate = useNavigate();

  if (!brands || brands.length === 0) {
    return null;
  }

  const handleBrandClick = (brandId) => {
    navigate(`/products?brand=${brandId}`);
  };

  return (
    <div className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Thương hiệu nổi bật
          </h2>
          <p className="text-gray-600 text-lg">
            Khám phá các thương hiệu làm đẹp hàng đầu thế giới
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Brand Grid */}
        <div className="flex flex-wrap justify-between gap-6">
          {brands.map((brand) => (
            <div
              key={brand._id}
              onClick={() => handleBrandClick(brand._id)}
              className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden w-[180px] cursor-pointer"
            >
              {/* Brand Logo Container */}
              <div className="aspect-square p-4 flex items-center justify-center bg-white">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800 mb-2">
                      {brand.name}
                    </div>
                  </div>
                )}
              </div>

              {/* Brand Info Overlay (on hover) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <div className="p-4 text-white w-full">
                  <h3 className="font-bold text-lg mb-1">{brand.name}</h3>
                  {brand.country && (
                    <p className="text-sm text-gray-200 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {brand.country}
                    </p>
                  )}
                  {brand.description && (
                    <p className="text-xs text-gray-300 mt-2 line-clamp-2">
                      {brand.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Top badge for featured brands (optional) */}
              {brand.featured && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                  Nổi bật
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Button (optional) */}
        {brands.length > 12 && (
          <div className="text-center mt-12">
            <button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Xem tất cả thương hiệu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandSection;

