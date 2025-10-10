'use client';

import { useState, useEffect } from 'react';
import axios from '../../../lib/axios';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import SingleImageUpload from '../../../components/SingleImageUpload';

interface Brand {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BrandsManagement() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    website: '',
    country: ''
  });

  useEffect(() => {
    fetchBrands();
  }, [searchTerm]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/brands', {
        params: { limit: 100, search: searchTerm }
      });

      if (response.data.success) {
        setBrands(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      alert('Không thể tải thương hiệu!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBrand) {
        // Update
        const response = await axios.put(`/admin/brands/${editingBrand._id}`, formData);
        if (response.data) {
          alert('Cập nhật thương hiệu thành công!');
        }
      } else {
        // Create
        const response = await axios.post('/admin/brands', formData);
        if (response.data) {
          alert('Tạo thương hiệu thành công!');
        }
      }

      setShowModal(false);
      setEditingBrand(null);
      setFormData({ name: '', description: '', logo: '', website: '', country: '' });
      fetchBrands();
    } catch (error: any) {
      console.error('Error saving brand:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      logo: brand.logo || '',
      website: brand.website || '',
      country: brand.country || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) return;

    try {
      await axios.delete(`/admin/brands/${id}`);
      alert('Xóa thương hiệu thành công!');
      fetchBrands();
    } catch (error: any) {
      console.error('Error deleting brand:', error);
      alert(error.response?.data?.message || 'Không thể xóa thương hiệu!');
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedBrands.length === 0) {
      alert('Vui lòng chọn ít nhất một thương hiệu!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedBrands.length} thương hiệu?`)) return;

    try {
      await axios.delete('/admin/brands/multiple/delete', {
        data: { ids: selectedBrands }
      });
      alert('Xóa thương hiệu thành công!');
      setSelectedBrands([]);
      fetchBrands();
    } catch (error: any) {
      console.error('Error deleting brands:', error);
      alert(error.response?.data?.message || 'Không thể xóa thương hiệu!');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBrands(brands.map(b => b._id));
    } else {
      setSelectedBrands([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedBrands.includes(id)) {
      setSelectedBrands(selectedBrands.filter(bid => bid !== id));
    } else {
      setSelectedBrands([...selectedBrands, id]);
    }
  };

  const openCreateModal = () => {
    setEditingBrand(null);
    setFormData({ name: '', description: '', logo: '', website: '', country: '' });
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
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Thương hiệu</h1>
        <div className="flex space-x-3">
          {selectedBrands.length > 0 && (
            <button
              onClick={handleDeleteMultiple}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <FaTrash />
              <span>Xóa ({selectedBrands.length})</span>
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <FaPlus />
            <span>Thêm thương hiệu</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm thương hiệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
          />
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedBrands.length === brands.length && brands.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Logo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên thương hiệu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {brands.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Không có thương hiệu nào
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand._id)}
                      onChange={() => handleSelectOne(brand._id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="w-12 h-12 object-contain rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        No Logo
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{brand.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(brand)}
                      className="text-purple-600 hover:text-purple-900 mr-4"
                    >
                      <FaEdit className="inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(brand._id)}
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
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingBrand ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu mới'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên thương hiệu *
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

              <div>
                <SingleImageUpload
                  onImageChange={(url) => setFormData({ ...formData, logo: url })}
                  initialImage={formData.logo}
                />

                {/* URL Input as fallback */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hoặc nhập URL ảnh trực tiếp:</label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBrand(null);
                    setFormData({ name: '', description: '', logo: '', website: '', country: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  {editingBrand ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
