import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';
import ImageUpload from '../../components/ImageUpload';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        images: [],
        category: '',
        brand: '',
        discountPercentage: 0
    });
    const [filters, setFilters] = useState({
        category: '',
        brand: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });

    // Fetch products
    const fetchProducts = async (page = 1, category = '', brand = '') => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/products', {
                params: { page, limit: 10, category, brand }
            });

            if (response.data.success) {
                setProducts(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tải sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories and brands
    const fetchCategoriesAndBrands = async () => {
        try {
            const [categoriesRes, brandsRes] = await Promise.all([
                axios.get('/categories'),
                axios.get('/brands')
            ]);
            setCategories(categoriesRes.data);
            setBrands(brandsRes.data);
        } catch (err) {
            console.error('Error fetching categories and brands:', err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategoriesAndBrands();
    }, []);

    // Handle filter change
    const handleFilterChange = (filterType, value) => {
        const newFilters = { ...filters, [filterType]: value };
        setFilters(newFilters);
        fetchProducts(1, newFilters.category, newFilters.brand);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                discountPercentage: parseFloat(formData.discountPercentage),
                images: formData.images || []
            };

            if (editingProduct) {
                await axios.put(`/admin/products/${editingProduct._id}`, submitData);
            } else {
                await axios.post('/admin/products', submitData);
            }

            setShowModal(false);
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                stock: '',
                images: [],
                category: '',
                brand: '',
                discountPercentage: 0
            });
            fetchProducts(pagination.currentPage, filters.category, filters.brand);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi lưu sản phẩm');
        }
    };

    // Handle edit
    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            stock: product.stock.toString(),
            images: product.images || [],
            category: product.category._id,
            brand: product.brand._id,
            discountPercentage: product.discountPercentage
        });
        setShowModal(true);
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

        try {
            await axios.delete(`/admin/products/${id}`);
            fetchProducts(pagination.currentPage, filters.category, filters.brand);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa sản phẩm');
        }
    };

    // Handle delete multiple
    const handleDeleteMultiple = async () => {
        if (selectedProducts.length === 0) return;
        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm?`)) return;

        try {
            await axios.delete('/admin/products', {
                data: { ids: selectedProducts }
            });
            setSelectedProducts([]);
            fetchProducts(pagination.currentPage, filters.category, filters.brand);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa sản phẩm');
        }
    };

    // Handle toggle discount
    const handleToggleDiscount = async (id) => {
        try {
            await axios.patch(`/admin/products/${id}/toggle-discount`);
            fetchProducts(pagination.currentPage, filters.category, filters.brand);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái giảm giá');
        }
    };

    // Handle toggle visibility
    const handleToggleVisibility = async (id) => {
        try {
            await axios.patch(`/admin/products/${id}/toggle-visibility`);
            fetchProducts(pagination.currentPage, filters.category, filters.brand);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái hiển thị');
        }
    };

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedProducts(products.map(product => product._id));
        } else {
            setSelectedProducts([]);
        }
    };

    // Handle select single
    const handleSelectSingle = (id, checked) => {
        if (checked) {
            setSelectedProducts([...selectedProducts, id]);
        } else {
            setSelectedProducts(selectedProducts.filter(productId => productId !== id));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý Sản phẩm</h1>
                <p className="text-gray-600">Quản lý các sản phẩm trong hệ thống</p>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <i className="fas fa-plus"></i>
                                Thêm mới
                            </button>

                            <button
                                onClick={handleDeleteMultiple}
                                disabled={selectedProducts.length === 0}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <i className="fas fa-trash"></i>
                                Xóa tất cả
                            </button>
                        </div>

                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>

                        <select
                            value={filters.brand}
                            onChange={(e) => handleFilterChange('brand', e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Tất cả thương hiệu</option>
                            {brands.map(brand => (
                                <option key={brand._id} value={brand._id}>{brand.name}</option>
                            ))}
                        </select>

                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.length === products.length && products.length > 0}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    STT
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hình
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tiêu đề
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Giá
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Giảm giá
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hiển thị
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center">
                                            <i className="fas fa-spinner fa-spin text-blue-600 mr-2"></i>
                                            Đang tải...
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                        Không có sản phẩm nào
                                    </td>
                                </tr>
                            ) : (
                                products.map((product, index) => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product._id)}
                                                onChange={(e) => handleSelectSingle(product._id, e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {product.images && product.images.length > 0 ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <i className="fas fa-image text-gray-400"></i>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                                {product.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {product.category?.name} - {product.brand?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatCurrency(product.discountedPrice || product.price)}
                                            </div>
                                            {product.discountPercentage > 0 && (
                                                <div className="text-sm text-gray-500 line-through">
                                                    {formatCurrency(product.price)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleDiscount(product._id)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.discountPercentage > 0 ? 'bg-green-600' : 'bg-gray-200'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.discountPercentage > 0 ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleVisibility(product._id)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.stock > 0 ? 'bg-green-600' : 'bg-gray-200'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.stock > 0 ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Sửa"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Xóa"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => fetchProducts(pagination.currentPage - 1, filters.category, filters.brand)}
                                disabled={pagination.currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => fetchProducts(pagination.currentPage + 1, filters.category, filters.brand)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                Sau
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Hiển thị{' '}
                                    <span className="font-medium">
                                        {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                                    </span>{' '}
                                    đến{' '}
                                    <span className="font-medium">
                                        {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                                    </span>{' '}
                                    của{' '}
                                    <span className="font-medium">{pagination.totalItems}</span>{' '}
                                    kết quả
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => fetchProducts(pagination.currentPage - 1, filters.category, filters.brand)}
                                        disabled={pagination.currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => fetchProducts(page, filters.category, filters.brand)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.currentPage
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => fetchProducts(pagination.currentPage + 1, filters.category, filters.brand)}
                                        disabled={pagination.currentPage === pagination.totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                            </h3>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tên sản phẩm *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập tên sản phẩm"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mô tả *
                                        </label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="3"
                                            placeholder="Nhập mô tả sản phẩm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Giá *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập giá sản phẩm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số lượng *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập số lượng"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Danh mục *
                                        </label>
                                        <select
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Chọn danh mục</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Thương hiệu *
                                        </label>
                                        <select
                                            required
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Chọn thương hiệu</option>
                                            {brands.map(brand => (
                                                <option key={brand._id} value={brand._id}>{brand.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            % Giảm giá
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.discountPercentage}
                                            onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập % giảm giá"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <ImageUpload
                                            initialImages={formData.images}
                                            onImagesChange={(images) => setFormData({ ...formData, images })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingProduct(null);
                                            setFormData({
                                                name: '',
                                                description: '',
                                                price: '',
                                                stock: '',
                                                images: [],
                                                category: '',
                                                brand: '',
                                                discountPercentage: 0
                                            });
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                    >
                                        {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;
