import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';
import SingleImageUpload from '../../components/SingleImageUpload';

const BrandManagement = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logo: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });

    // Fetch brands
    const fetchBrands = async (page = 1) => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/brands', {
                params: { page, limit: 10 }
            });

            if (response.data.success) {
                setBrands(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tải thương hiệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBrand) {
                await axios.put(`/admin/brands/${editingBrand._id}`, formData);
            } else {
                await axios.post('/admin/brands', formData);
            }

            setShowModal(false);
            setEditingBrand(null);
            setFormData({ name: '', description: '', logo: '' });
            fetchBrands(pagination.currentPage);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi lưu thương hiệu');
        }
    };

    // Handle edit
    const handleEdit = (brand) => {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            description: brand.description || '',
            logo: brand.logo || ''
        });
        setShowModal(true);
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) {
            try {
                await axios.delete(`/admin/brands/${id}`);
                fetchBrands(pagination.currentPage);
            } catch (err) {
                setError(err.response?.data?.message || 'Lỗi khi xóa thương hiệu');
            }
        }
    };

    // Handle delete multiple
    const handleDeleteMultiple = async () => {
        if (selectedBrands.length === 0) return;

        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedBrands.length} thương hiệu đã chọn?`)) {
            try {
                await axios.delete('/admin/brands/multiple', {
                    data: { ids: selectedBrands }
                });
                setSelectedBrands([]);
                fetchBrands(pagination.currentPage);
            } catch (err) {
                setError(err.response?.data?.message || 'Lỗi khi xóa thương hiệu');
            }
        }
    };

    // Handle select all
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedBrands(brands.map(brand => brand._id));
        } else {
            setSelectedBrands([]);
        }
    };

    // Handle select individual
    const handleSelectBrand = (id) => {
        setSelectedBrands(prev =>
            prev.includes(id)
                ? prev.filter(brandId => brandId !== id)
                : [...prev, id]
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý Thương hiệu</h1>
                <p className="text-gray-600">Quản lý các thương hiệu trong hệ thống</p>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <i className="fas fa-plus"></i>
                            Thêm mới
                        </button>
                        <button
                            onClick={handleDeleteMultiple}
                            disabled={selectedBrands.length === 0}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <i className="fas fa-trash"></i>
                            Xóa tất cả
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Brands Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedBrands.length === brands.length && brands.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    STT
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    LOGO
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    TÊN THƯƠNG HIỆU
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    MÔ TẢ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    THAO TÁC
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-2">Đang tải...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : brands.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        Không có thương hiệu nào
                                    </td>
                                </tr>
                            ) : (
                                brands.map((brand, index) => (
                                    <tr key={brand._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand._id)}
                                                onChange={() => handleSelectBrand(brand._id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {brand.logo ? (
                                                <img
                                                    src={brand.logo}
                                                    alt={brand.name}
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
                                                {brand.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 max-w-xs truncate">
                                                {brand.description || 'Không có mô tả'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(brand)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(brand._id)}
                                                    className="text-red-600 hover:text-red-900"
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
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => fetchBrands(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            <button
                                onClick={() => fetchBrands(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <i className="fas fa-chevron-right"></i>
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
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => fetchBrands(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => fetchBrands(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.currentPage
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => fetchBrands(pagination.currentPage + 1)}
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
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border border-white/20 w-96 shadow-lg rounded-xl bg-white/95 backdrop-blur-md">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tên thương hiệu</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <SingleImageUpload
                                        initialImage={formData.logo}
                                        onImageChange={(image) => setFormData({ ...formData, logo: image })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingBrand(null);
                                            setFormData({ name: '', description: '', logo: '' });
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                    >
                                        {editingBrand ? 'Cập nhật' : 'Thêm mới'}
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

export default BrandManagement;
