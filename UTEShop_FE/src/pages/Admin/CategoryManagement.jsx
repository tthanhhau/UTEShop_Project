import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });

    // Fetch categories
    const fetchCategories = async (page = 1) => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/categories', {
                params: { page, limit: 10 }
            });

            if (response.data.success) {
                setCategories(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);


    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await axios.put(`/admin/categories/${editingCategory._id}`, formData);
            } else {
                await axios.post('/admin/categories', formData);
            }

            setShowModal(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
            fetchCategories(pagination.currentPage);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi lưu danh mục');
        }
    };

    // Handle edit
    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || ''
        });
        setShowModal(true);
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

        try {
            await axios.delete(`/admin/categories/${id}`);
            fetchCategories(pagination.currentPage);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa danh mục');
        }
    };

    // Handle delete multiple
    const handleDeleteMultiple = async () => {
        if (selectedCategories.length === 0) return;
        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCategories.length} danh mục?`)) return;

        try {
            await axios.delete('/admin/categories', {
                data: { ids: selectedCategories }
            });
            setSelectedCategories([]);
            fetchCategories(pagination.currentPage);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa danh mục');
        }
    };

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedCategories(categories.map(cat => cat._id));
        } else {
            setSelectedCategories([]);
        }
    };

    // Handle select single
    const handleSelectSingle = (id, checked) => {
        if (checked) {
            setSelectedCategories([...selectedCategories, id]);
        } else {
            setSelectedCategories(selectedCategories.filter(catId => catId !== id));
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý Danh mục</h1>
                <p className="text-gray-600">Quản lý các danh mục sản phẩm trong hệ thống</p>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
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
                            disabled={selectedCategories.length === 0}
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

            {/* Categories Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.length === categories.length && categories.length > 0}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    STT
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tiêu đề
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mô tả
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center">
                                            <i className="fas fa-spinner fa-spin text-blue-600 mr-2"></i>
                                            Đang tải...
                                        </div>
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        Không có danh mục nào
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category, index) => (
                                    <tr key={category._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category._id)}
                                                onChange={(e) => handleSelectSingle(category._id, e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 max-w-xs truncate">
                                                {category.description || 'Không có mô tả'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category._id)}
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
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => fetchCategories(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => fetchCategories(pagination.currentPage + 1)}
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
                                        onClick={() => fetchCategories(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => fetchCategories(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.currentPage
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => fetchCategories(pagination.currentPage + 1)}
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
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                            </h3>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên danh mục *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập tên danh mục"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="Nhập mô tả danh mục"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingCategory(null);
                                            setFormData({ name: '', description: '' });
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                    >
                                        {editingCategory ? 'Cập nhật' : 'Thêm mới'}
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

export default CategoryManagement;
