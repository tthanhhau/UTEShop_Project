import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import ProductCard from "../components/ProductCard";


const NewArrivalsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                setLoading(true);
                setError(null);

                // Lấy tất cả sản phẩm mới nhất (không giới hạn 8)
                const res = await axios.get("/products?sort=newest&limit=50");
                setProducts(res.data.items || []);
            } catch (err) {
                console.error("Lỗi khi lấy sản phẩm mới:", err);
                setError("Không thể tải sản phẩm mới nhất");
            } finally {
                setLoading(false);
            }
        };
        fetchNewArrivals();
    }, []);

    const handleProductClick = (productId) => {
        navigate(`/products/${productId}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">NEW ARRIVALS</h1>
                <p className="text-gray-600 text-lg">Khám phá những sản phẩm mới nhất của chúng tôi</p>
                <div className="w-24 h-1 bg-blue-600 mx-auto mt-4"></div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard
                        key={product._id}
                        product={product}
                    />
                ))}
            </div>

            {/* Back Button */}
            <div className="text-center mt-12">
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                    ← Quay về trang chủ
                </button>
            </div>
        </div>
    );
};


export default NewArrivalsPage;
