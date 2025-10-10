'use client';

import { useState, useEffect } from 'react';
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

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/Categorys', {
        params: { limit: 100, search: searchTerm }
      });
      
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Không thể tải danh mục!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update
        const response = await axios.put(`/admin/Categorys/${editingCategory._id}`, formData);
        if (response.data) {
          alert('Cập nhật danh mục thành công!');
        }
      } else {
        // Create
        const response = await axios.post('/admin/Categorys', formData);
        if (response.data) {
          alert('Tạo danh mục thành công!');
        }
      }
      
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra!');
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
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    
    try {
      await axios.delete(`/admin/Categorys/${id}`);
      alert('Xóa danh mục thành công!');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.message || 'Không thể xóa danh mục!');
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedCategories.length === 0) {
      alert('Vui lòng chọn ít nhất một danh mục!');
      return;
    }
    
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedCategories.length} danh mục?`)) return;
    
    try {
      await axios.delete('/admin/Categorys/multiple/delete', {
        data: { ids: selectedCategories }
      });
      alert('Xóa danh mục thành công!');
      setSelectedCategories([]);
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting categories:', error);
      alert(error.response?.data?.message || 'Không thể xóa danh mục!');
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
