'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from '../../../lib/axios';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';

interface Category {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

interface Toast {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [toast, setToast] = useState<Toast | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id?: string;
    multiple?: boolean;
  }>({ show: false });
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchCategories = useCallback(async (search = '') => {
    try {
      // Chỉ set loading cho lần đầu, không set khi search
      if (isFirstLoad) {
        setLoading(true);
      }
      const response = await axios.get('/admin/Categorys', {
        params: { limit: 100, search }
      });

      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      if (isFirstLoad) {
        setLoading(false);
        setIsFirstLoad(false);
      }
    }
  }, [isFirstLoad]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        // Update
        const response = await axios.put(`/admin/Categorys/${editingCategory._id}`, formData);
        if (response.data) {
          showToast('success', 'Cập nhật danh mục thành công!');
        }
      } else {
        // Create
        const response = await axios.post('/admin/Categorys', formData);
        if (response.data) {
          showToast('success', 'Tạo danh mục thành công!');
        }
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      fetchCategories(searchTerm);
    } catch (error: any) {
      console.error('Error saving category:', error);
      showToast('error', error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    // Kiểm tra trước xem có thể xóa không
    try {
      const response = await axios.get(`/admin/Categorys/check-delete/${id}`);
      if (!response.data.canDelete) {
        // Hiện modal cảnh báo giữa màn hình
        setAlertModal({
          show: true,
          message: 'Danh mục này đã được thêm sản phẩm, không thể xóa!'
        });
        return;
      }
      // Chỉ hiện modal xác nhận nếu có thể xóa
      setDeleteConfirm({ show: true, id, multiple: false });
    } catch (error: any) {
      // Nếu API lỗi, hiện modal cảnh báo
      setAlertModal({
        show: true,
        message: 'Danh mục này đã được thêm sản phẩm, không thể xóa!'
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      await axios.delete(`/admin/Categorys/${deleteConfirm.id}`);
      showToast('success', 'Xóa danh mục thành công!');
      fetchCategories(searchTerm);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showToast('error', error.response?.data?.message || 'Không thể xóa danh mục!');
    } finally {
      setDeleteConfirm({ show: false });
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedCategories.length === 0) {
      showToast('error', 'Vui lòng chọn ít nhất một danh mục!');
      return;
    }

    // Kiểm tra trước xem có thể xóa không
    try {
      const response = await axios.post('/admin/Categorys/can-delete-multiple', {
        ids: selectedCategories
      });
      if (!response.data.canDelete) {
        // Hiện modal cảnh báo giữa màn hình
        setAlertModal({
          show: true,
          message: 'Một số danh mục đã được thêm sản phẩm, không thể xóa!'
        });
        return;
      }
      // Chỉ hiện modal xác nhận nếu có thể xóa
      setDeleteConfirm({ show: true, multiple: true });
    } catch (error: any) {
      // Nếu API lỗi, hiện modal cảnh báo
      setAlertModal({
        show: true,
        message: 'Một số danh mục đã được thêm sản phẩm, không thể xóa!'
      });
    }
  };

  const confirmDeleteMultiple = async () => {
    try {
      await axios.delete('/admin/Categorys/multiple/delete', {
        data: { ids: selectedCategories }
      });
      showToast('success', 'Xóa danh mục thành công!');
      setSelectedCategories([]);
      fetchCategories(searchTerm);
    } catch (error: any) {
      console.error('Error deleting categories:', error);
      showToast('error', error.response?.data?.message || 'Không thể xóa danh mục!');
    } finally {
      setDeleteConfirm({ show: false });
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategories(categories.map(c => c._id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(cid => cid !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          toast.type === 'success' ? 'bg-green-500' : 
          toast.type === 'warning' ? 'bg-orange-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-medium">
                {toast.type === 'success' ? 'Thành công' : 
                 toast.type === 'warning' ? 'Cảnh báo' : 'Lỗi'}
              </p>
              <p className="text-sm mt-1">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FaTrash className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Xác nhận xóa
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {deleteConfirm.multiple
                  ? `Bạn có chắc chắn muốn xóa ${selectedCategories.length} danh mục đã chọn?`
                  : 'Bạn có chắc chắn muốn xóa danh mục này?'}
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() =>
                    deleteConfirm.multiple
                      ? confirmDeleteMultiple()
                      : confirmDelete()
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal - Hiển thị giữa màn hình */}
      {alertModal.show && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-3">
                Không thể xóa!
              </h3>
              <p className="text-gray-700 mb-6">{alertModal.message}</p>
              <button
                onClick={() => setAlertModal({ show: false, message: '' })}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Danh mục</h1>
        <div className="flex space-x-3">
          {selectedCategories.length > 0 && (
            <button
              onClick={handleDeleteMultiple}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <FaTrash />
              <span>Xóa ({selectedCategories.length})</span>
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <FaPlus />
            <span>Thêm danh mục</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedCategories.length === categories.length && categories.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Không có danh mục nào
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category._id)}
                      onChange={() => handleSelectOne(category._id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{category.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-purple-600 hover:text-purple-900 mr-4"
                    >
                      <FaEdit className="inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash className="inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(128, 128, 128, 0.3)' }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData({ name: '', description: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  {editingCategory ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
