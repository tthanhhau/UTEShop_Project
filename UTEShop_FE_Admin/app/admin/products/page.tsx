'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from '../../../lib/axios';
import MultiImageUpload from '../../../components/MultiImageUpload';

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    images: [] as string[],
    category: '',
    brand: '',
    discountPercentage: 0
  });
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Fetch products
  const fetchProducts = useCallback(async (page = 1, category = '', brand = '', search = '') => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/Products', {
        params: { page, limit: 10, category, brand, search }
      });

      if (response.data.success) {
        setProducts(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories and brands
  const fetchCategoriesAndBrands = useCallback(async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        axios.get('/admin/Categorys'),
        axios.get('/admin/brands')
      ]);
      setCategories(categoriesRes.data.data || []);
      setBrands(brandsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching categories and brands:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategoriesAndBrands();
  }, [fetchProducts, fetchCategoriesAndBrands]);

  // Debounce search with useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1, filters.category, filters.brand, filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search, filters.category, filters.brand, fetchProducts]);

  // Handle filter change
  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    if (filterType !== 'search') {
      fetchProducts(1, newFilters.category, newFilters.brand, newFilters.search);
    }
  };

  // Handle search - only update state, useEffect will handle fetch
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ ...filters, search: value });
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        discountPercentage: parseFloat(formData.discountPercentage.toString()),
        images: formData.images || []
      };

      if (editingProduct) {
        await axios.put(`/admin/Products/${editingProduct._id}`, submitData);
      } else {
        await axios.post('/admin/Products', submitData);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts(pagination.currentPage, filters.category, filters.brand, filters.search);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await axios.delete(`/admin/Products/${id}`);
        fetchProducts(pagination.currentPage, filters.category, filters.brand, filters.search);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    if (confirm(`Bạn có chắc muốn xóa ${selectedProducts.length} sản phẩm?`)) {
      try {
        await axios.delete('/admin/Products/multiple/delete', {
          data: { ids: selectedProducts }
        });
        setSelectedProducts([]);
        fetchProducts(pagination.currentPage, filters.category, filters.brand, filters.search);
      } catch (error) {
        console.error('Error deleting products:', error);
      }
    }
  };

  // Reset form
  const resetForm = () => {
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
  };

  // Handle edit
  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      images: product.images || [],
      category: product.category?._id || '',
      brand: product.brand?._id || '',
      discountPercentage: product.discountPercentage || 0
    });
    setShowModal(true);
  };

  // Handle checkbox
  const handleSelectProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p: any) => p._id));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản Lý Sản Phẩm</h1>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Xóa đã chọn ({selectedProducts.length})
            </button>
          )}
          <button
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            + Thêm Sản Phẩm
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm..."
            value={filters.search}
            onChange={handleSearch}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat: any) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Tất cả thương hiệu</option>
            {brands.map((brand: any) => (
              <option key={brand._id} value={brand._id}>{brand.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hình ảnh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thương hiệu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product: any) => (
                <tr key={product._id}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => handleSelectProduct(product._id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {product.images && product.images[0] && (
                      <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded" />
                    )}
                  </td>
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">{product.category?.name || 'N/A'}</td>
                  <td className="px-6 py-4">{product.brand?.name || 'N/A'}</td>
                  <td className="px-6 py-4">{product.price.toLocaleString()}đ</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div>
          Hiển thị {products.length} / {pagination.totalItems} sản phẩm
        </div>
        <div className="flex gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => fetchProducts(page, filters.category, filters.brand, filters.search)}
              className={`px-3 py-1 rounded ${page === pagination.currentPage
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
                }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(128, 128, 128, 0.3)' }}
        >
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Tên sản phẩm</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Giá</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kho</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat: any) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Thương hiệu</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Chọn thương hiệu</option>
                    {brands.map((brand: any) => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Giảm giá (%)</label>
                <input
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  max="100"
                />
              </div>

              <div className="mb-4">
                <MultiImageUpload
                  onImagesChange={(urls) => setFormData({ ...formData, images: urls })}
                  initialImages={formData.images}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}





