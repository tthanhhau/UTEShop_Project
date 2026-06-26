'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from '../../../lib/axios';
import MultiImageUpload from '../../../components/MultiImageUpload';
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    images: [] as string[],
    category: '',
    brand: '',
    discountPercentage: 0,
    sizes: [] as Array<{ size: string; stock: number }>
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
      // Tính tổng stock từ sizes nếu có, nếu không dùng stock nhập tay
      const totalStock = formData.sizes.length > 0
        ? formData.sizes.reduce((sum, item) => sum + (item.stock || 0), 0)
        : parseInt(formData.stock || '0');

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: totalStock,
        discountPercentage: parseFloat(formData.discountPercentage.toString()),
        images: formData.images || [],
        sizes: formData.sizes
      };

      console.log('📤 Submitting product data:', submitData);

      if (editingProduct) {
        await axios.put(`/admin/Products/${editingProduct._id}`, submitData);
      } else {
        await axios.post('/admin/Products', submitData);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts(pagination.currentPage, filters.category, filters.brand, filters.search);
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert('Lỗi khi lưu sản phẩm: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await axios.delete(`/admin/Products/${id}`);
        fetchProducts(pagination.currentPage, filters.category, filters.brand, filters.search);
        alert('Xóa sản phẩm thành công!');
      } catch (error: any) {
        console.error('Error deleting product:', error);
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm';
        alert(errorMessage);
      }
    }
  };

  // Handle toggle product visibility
  const handleToggleVisibility = async (id: string) => {
    try {
      await axios.patch(`/admin/Products/${id}/toggle-visibility`);
      fetchProducts(pagination.currentPage, filters.category, filters.brand, filters.search);
    } catch (error) {
      console.error('Error toggling product visibility:', error);
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
        alert('Xóa các sản phẩm thành công!');
      } catch (error: any) {
        console.error('Error deleting products:', error);
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa các sản phẩm';
        alert(errorMessage);
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
      discountPercentage: 0,
      sizes: []
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
      discountPercentage: product.discountPercentage || 0,
      sizes: product.sizes || []
    });
    setShowModal(true);
  };

  // Get selected category info
  const getSelectedCategory = (): any => {
    return categories.find((cat: any) => cat._id === formData.category);
  };

  // Check if category is clothing (quần áo)
  const isClothingCategory = (): boolean => {
    const category = getSelectedCategory();
    return category?.name?.toLowerCase().includes('quần') ||
      category?.name?.toLowerCase().includes('áo') ||
      category?.name?.toLowerCase().includes('clothing');
  };

  // Check if category is shoes (giày)
  const isShoesCategory = (): boolean => {
    const category = getSelectedCategory();
    return category?.name?.toLowerCase().includes('giày') ||
      category?.name?.toLowerCase().includes('shoe');
  };

  // Add size
  const handleAddSize = () => {
    const newSize = isClothingCategory() ? 'S' : '38';
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { size: newSize, stock: 0 }]
    });
  };

  // Remove size
  const handleRemoveSize = (index: number) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.filter((_, i) => i !== index)
    });
  };

  // Update size
  const handleUpdateSize = (index: number, field: 'size' | 'stock', value: string | number) => {
    const updatedSizes = [...formData.sizes];
    updatedSizes[index] = {
      ...updatedSizes[index],
      [field]: field === 'stock' ? parseInt(value.toString()) : value
    };
    setFormData({ ...formData, sizes: updatedSizes });
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

  // Handle AI description generation
  const handleGenerateDescription = async () => {
    if (!formData.name) {
      alert("Vui lòng nhập tên sản phẩm trước!");
      return;
    }
    if (!formData.images || formData.images.length === 0) {
      alert("Vui lòng tải lên ít nhất 1 hình ảnh trước!");
      return;
    }
    
    // Tìm tên brand
    const selectedBrand = brands.find((b: any) => b._id === formData.brand);
    const brandName = selectedBrand ? selectedBrand.name : "";

    setIsGeneratingDesc(true);
    try {
      // Đã tự động cấu hình theo tên tài khoản của bạn (hauttttt) và tên Space dự kiến (blip-api)
      const API_URL = "https://hauttttt-blip-api.hf.space/api/generate-description";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_url: formData.images[0],
          name: formData.name,
          brand: brandName
        })
      });
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, description: data.description }));
      } else {
        alert("Lỗi: " + (data.detail || "Không thể tạo mô tả"));
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối tới AI Server. Vui lòng kiểm tra đường dẫn Hugging Face Space API.");
    } finally {
      setIsGeneratingDesc(false);
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
                  Giá gốc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá bán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
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
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`font-semibold ${product.discountPercentage > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                        {(product.price * (1 - (product.discountPercentage || 0) / 100)).toLocaleString()}đ
                      </span>
                      <span className="text-xs text-gray-500">
                        (-{product.discountPercentage || 0}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.sizes && product.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.sizes.map((sizeItem: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded whitespace-nowrap"
                            title={`Số lượng: ${sizeItem.stock}`}
                          >
                            {sizeItem.size} ({sizeItem.stock})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Không có size</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleVisibility(product._id)}
                      className={`p-2 rounded-full ${product.isActive ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={product.isActive ? 'Click để ẩn sản phẩm' : 'Click để hiển thị sản phẩm'}
                    >
                      {product.isActive ? <FaEye /> : <FaEyeSlash />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-purple-600 hover:text-purple-900 mr-4"
                    >
                      <FaEdit className="inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash className="inline" />
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
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Mô tả</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDesc}
                    className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                  >
                    ✨ {isGeneratingDesc ? 'Đang tạo...' : 'Tạo bằng AI'}
                  </button>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  required
                />
              </div>

              {/* Giá gốc, Giảm giá, Giá bán */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Giá gốc</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full border rounded px-3 py-2 pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">đ</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Giảm giá (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) })}
                      className="w-full border rounded px-3 py-2 pr-8"
                      min="0"
                      max="100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Giá bán</label>
                  <input
                    type="text"
                    value={(() => {
                      const price = parseFloat(formData.price) || 0;
                      const discount = parseFloat(formData.discountPercentage.toString()) || 0;
                      const finalPrice = price * (1 - discount / 100);
                      return finalPrice.toLocaleString() + 'đ';
                    })()}
                    className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700 font-semibold"
                    disabled
                    readOnly
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

              {/* Size Management */}
              {(isClothingCategory() || isShoesCategory()) && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">
                      {isClothingCategory() ? 'Kích cỡ (Size)' : 'Số giày'}
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                    >
                      + Thêm {isClothingCategory() ? 'size' : 'số'}
                    </button>
                  </div>

                  {formData.sizes.length === 0 ? (
                    <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded">
                      Chưa có {isClothingCategory() ? 'size' : 'số giày'} nào. Nhấn "Thêm {isClothingCategory() ? 'size' : 'số'}" để thêm.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.sizes.map((sizeItem, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          {isClothingCategory() ? (
                            <select
                              value={sizeItem.size}
                              onChange={(e) => handleUpdateSize(index, 'size', e.target.value)}
                              className="border rounded px-3 py-2 flex-1"
                            >
                              <option value="XS">XS</option>
                              <option value="S">S</option>
                              <option value="M">M</option>
                              <option value="L">L</option>
                              <option value="XL">XL</option>
                              <option value="XXL">XXL</option>
                              <option value="XXXL">XXXL</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={sizeItem.size}
                              onChange={(e) => handleUpdateSize(index, 'size', e.target.value)}
                              placeholder="VD: 38, 39, 40..."
                              className="border rounded px-3 py-2 flex-1"
                            />
                          )}
                          <input
                            type="number"
                            value={sizeItem.stock}
                            onChange={(e) => handleUpdateSize(index, 'stock', e.target.value)}
                            placeholder="Số lượng"
                            className="border rounded px-3 py-2 w-32"
                            min="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(index)}
                            className="text-red-600 hover:text-red-800 px-3 py-2"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.sizes.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Tổng số lượng: {formData.sizes.reduce((sum, item) => sum + (item.stock || 0), 0)}
                    </div>
                  )}
                </div>
              )}

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





