import React, { useState, useEffect } from 'react';
import { getSimilarProducts } from '../api/similarProductApi';
import ProductCard from './ProductCard';

const SimilarProducts = ({ productId, limit = 8 }) => {
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSimilarProducts = async () => {
            try {
                setLoading(true);
                const response = await getSimilarProducts(productId, limit);
                setSimilarProducts(response.similarProducts || []);
            } catch (err) {
                setError(err.message || 'Có lỗi xảy ra');
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchSimilarProducts();
        }
    }, [productId, limit]);

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Sản phẩm tương tự</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="bg-gray-200 rounded-lg h-48 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500">
                Không thể tải sản phẩm tương tự
            </div>
        );
    }

    if (similarProducts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold">Sản phẩm tương tự</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {similarProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default SimilarProducts;
