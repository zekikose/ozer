import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Filter, Edit, Trash2, Eye, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import SelectBox2 from '../components/SelectBox2';
import { useAuth } from '../contexts/AuthContext';
import { generateSKU } from '../utils/skuGenerator';

interface ProductForm {
  name: string;
  description: string;
  sku: string;
  category_id: string;
  supplier_id: string;
  warehouse_id: string;
  unit: string;
  price: number;
  min_stock: number;
  initial_stock: number;
}

const Products: React.FC = () => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductForm>();

  // Fetch products
  const { data: productsData, isLoading } = useQuery(
    ['products', currentPage, searchTerm, selectedCategory, selectedSupplier, selectedWarehouse, showLowStock],
    async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        ...(selectedCategory && { category_id: selectedCategory }),
        ...(selectedSupplier && { supplier_id: selectedSupplier }),
        ...(selectedWarehouse && { warehouse_id: selectedWarehouse }),
        ...(showLowStock && { low_stock: 'true' }),
      });
      
      const response = await axios.get(`/api/products?${params}`);
      return response.data;
    }
  );

  // Fetch categories for filter
  const { data: categories } = useQuery('categories', async () => {
    const response = await axios.get('/api/categories');
    return response.data.categories;
  });

  // Fetch suppliers for filter
  const { data: suppliers } = useQuery('suppliers', async () => {
    const response = await axios.get('/api/suppliers');
    return response.data.suppliers;
  });

  // Fetch warehouses for filter
  const { data: warehouses } = useQuery('warehouses', async () => {
    const response = await axios.get('/api/warehouses');
    return response.data.warehouses;
  });

  // Add product mutation
  const addProductMutation = useMutation(
    async (productData: ProductForm) => {
      const response = await axios.post('/api/products', productData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Ürün başarıyla eklendi');
        setShowModal(false);
        reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Ürün eklenirken hata oluştu');
      },
    }
  );

  // Delete product mutation
  const deleteMutation = useMutation(
    async (productId: number) => {
      await axios.delete(`/api/products/${productId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Ürün başarıyla silindi');
      },
      onError: () => {
        toast.error('Ürün silinirken hata oluştu');
      },
    }
  );

  // Update product mutation
  const updateProductMutation = useMutation(
    async (productData: ProductForm & { id: number }) => {
      const response = await axios.put(`/api/products/${productData.id}`, productData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Ürün başarıyla güncellendi');
        setShowModal(false);
        setEditingProduct(null);
        reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Ürün güncellenirken hata oluştu');
      },
    }
  );

  const onSubmit = async (data: ProductForm) => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ ...data, id: editingProduct.id });
      } else {
        await addProductMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ürün adını izle ve SKU'yu otomatik oluştur
  const watchedProductName = watch('name');
  
  useEffect(() => {
    if (watchedProductName && watchedProductName.length > 2) {
      const autoSKU = generateSKU(watchedProductName);
      setValue('sku', autoSKU);
    }
  }, [watchedProductName, setValue]);

  const openModal = () => {
    setShowModal(true);
    setEditingProduct(null);
    const autoSKU = generateSKU();
    reset({
      sku: autoSKU,
      unit: 'adet' // Varsayılan birim
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    reset();
  };

  const handleDelete = (productId: number) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(productId);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      category_id: product.category_id?.toString() || '',
      supplier_id: product.supplier_id?.toString() || '',
      warehouse_id: product.warehouse_id?.toString() || '',
      unit: product.unit || 'adet',
      price: product.unit_price || 0,
      min_stock: product.min_stock_level || 0,
      initial_stock: product.current_stock || 0
    });
    setShowModal(true);
  };

  const handleView = (product: any) => {
    setViewingProduct(product);
  };

  const closeViewModal = () => {
    setViewingProduct(null);
  };

  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) return { status: 'out-of-stock', label: 'Stokta Yok', color: 'text-red-600 bg-red-100' };
    if (currentStock <= minStock) return { status: 'low-stock', label: 'Düşük Stok', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'in-stock', label: 'Stokta', color: 'text-green-600 bg-green-100' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-gray-600">Stok yönetimi için ürün listesi</p>
        </div>
        {hasPermission('products:create') && (
          <button onClick={openModal} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ürün
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Category Filter */}
            <SelectBox2
              options={[
                { value: '', label: 'Tüm Kategoriler' },
                ...(categories?.map((category: any) => ({
                  value: category.id.toString(),
                  label: category.name
                })) || [])
              ]}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value.toString())}
              placeholder="Tüm Kategoriler"
            />

            {/* Supplier Filter */}
            <SelectBox2
              options={[
                { value: '', label: 'Tüm Tedarikçiler' },
                ...(suppliers?.map((supplier: any) => ({
                  value: supplier.id.toString(),
                  label: supplier.name
                })) || [])
              ]}
              value={selectedSupplier}
              onChange={(value) => setSelectedSupplier(value.toString())}
              placeholder="Tüm Tedarikçiler"
            />

            {/* Warehouse Filter */}
            <SelectBox2
              options={[
                { value: '', label: 'Tüm Depolar' },
                ...(warehouses?.map((warehouse: any) => ({
                  value: warehouse.id.toString(),
                  label: warehouse.name
                })) || [])
              ]}
              value={selectedWarehouse}
              onChange={(value) => setSelectedWarehouse(value.toString())}
              placeholder="Tüm Depolar"
            />

            {/* Low Stock Filter */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Sadece Düşük Stok</span>
            </label>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedSupplier('');
                setSelectedWarehouse('');
                setShowLowStock(false);
                setCurrentPage(1);
              }}
              className="btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Ürün</th>
                      <th className="table-header-cell">SKU</th>
                      <th className="table-header-cell">Kategori</th>
                      <th className="table-header-cell">Tedarikçi</th>
                      <th className="table-header-cell">Depo</th>
                      <th className="table-header-cell">Stok</th>
                      <th className="table-header-cell">Fiyat</th>
                      <th className="table-header-cell">Durum</th>
                      <th className="table-header-cell">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {productsData?.products?.map((product: any) => {
                      const stockStatus = getStockStatus(product.current_stock, product.min_stock_level);
                      return (
                        <tr key={product.id}>
                          <td className="table-cell">
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              {product.barcode && (
                                <div className="text-sm text-gray-500">Barkod: {product.barcode}</div>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="font-mono text-sm">{product.sku}</span>
                          </td>
                          <td className="table-cell">
                            {product.category_name || '-'}
                          </td>
                          <td className="table-cell">
                            {product.supplier_name || '-'}
                          </td>
                          <td className="table-cell">
                            {product.warehouse_name || '-'}
                          </td>
                          <td className="table-cell">
                            <div>
                              <span className="font-medium">{product.current_stock}</span>
                              <span className="text-gray-500"> / {product.max_stock_level}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {product.min_stock_level}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="font-medium">₺{product.unit_price}</div>
                            <div className="text-xs text-gray-500">
                              Maliyet: ₺{product.cost_price}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${stockStatus.color}`}>
                              {stockStatus.label}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleView(product)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Görüntüle"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {hasPermission('products:update') && (
                                <button 
                                  onClick={() => handleEdit(product)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Düzenle"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {hasPermission('products:delete') && (
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Sil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {productsData?.pagination && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Toplam {productsData.pagination.total_items} ürün
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Önceki
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Sayfa {currentPage} / {productsData.pagination.total_pages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === productsData.pagination.total_pages}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Adı *
                  </label>
                  <input
                    {...register('name', { required: 'Ürün adı gerekli' })}
                    type="text"
                    className="input"
                    placeholder="Ürün adını girin"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      {...register('sku', { required: 'SKU gerekli' })}
                      type="text"
                      className="input flex-1"
                      placeholder="SKU otomatik oluşturulacak"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSKU = generateSKU();
                        reset({ ...watch(), sku: newSKU });
                      }}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300"
                    >
                      Yenile
                    </button>
                  </div>
                  {errors.sku && (
                    <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <SelectBox2
                    options={categories?.map((category: any) => ({
                      value: category.id.toString(),
                      label: category.name
                    })) || []}
                    value={watch('category_id') || ''}
                    onChange={(value) => setValue('category_id', value.toString())}
                    placeholder="Kategori seçin"
                    required
                    error={!!errors.category_id}
                  />
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                  )}
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tedarikçi *
                  </label>
                  <SelectBox2
                    options={suppliers?.map((supplier: any) => ({
                      value: supplier.id.toString(),
                      label: supplier.name
                    })) || []}
                    value={watch('supplier_id') || ''}
                    onChange={(value) => setValue('supplier_id', value.toString())}
                    placeholder="Tedarikçi seçin"
                    required
                    error={!!errors.supplier_id}
                  />
                  {errors.supplier_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.supplier_id.message}</p>
                  )}
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depo *
                  </label>
                  <SelectBox2
                    options={warehouses?.map((warehouse: any) => ({
                      value: warehouse.id.toString(),
                      label: warehouse.name
                    })) || []}
                    value={watch('warehouse_id') || ''}
                    onChange={(value) => setValue('warehouse_id', value.toString())}
                    placeholder="Depo seçin"
                    required
                    error={!!errors.warehouse_id}
                  />
                  {errors.warehouse_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.warehouse_id.message}</p>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birim *
                  </label>
                  <SelectBox2
                    options={[
                      { value: 'adet', label: 'Adet' },
                      { value: 'metre', label: 'Metre' },
                      { value: 'kilo', label: 'Kilo' },
                      { value: 'litre', label: 'Litre' },
                      { value: 'paket', label: 'Paket' },
                      { value: 'kutu', label: 'Kutu' },
                      { value: 'gram', label: 'Gram' },
                      { value: 'ton', label: 'Ton' },
                      { value: 'metrekare', label: 'Metrekare' },
                      { value: 'metrekup', label: 'Metreküp' }
                    ]}
                    value={watch('unit') || ''}
                    onChange={(value) => setValue('unit', value.toString())}
                    placeholder="Birim seçin"
                    required
                    error={!!errors.unit}
                  />
                  {errors.unit && (
                    <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birim Fiyat (₺) *
                  </label>
                  <input
                    {...register('price', { 
                      required: 'Fiyat gerekli',
                      min: { value: 0, message: 'Fiyat 0\'dan büyük olmalı' }
                    })}
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                {/* Min Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stok *
                  </label>
                  <input
                    {...register('min_stock', { 
                      required: 'Minimum stok gerekli',
                      min: { value: 0, message: 'Minimum stok 0\'dan büyük olmalı' }
                    })}
                    type="number"
                    className="input"
                    placeholder="0"
                  />
                  {errors.min_stock && (
                    <p className="mt-1 text-sm text-red-600">{errors.min_stock.message}</p>
                  )}
                </div>

                {/* Initial Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Stoku *
                  </label>
                  <input
                    {...register('initial_stock', { 
                      required: 'Başlangıç stoku gerekli',
                      min: { value: 0, message: 'Başlangıç stoku 0\'dan büyük olmalı' }
                    })}
                    type="number"
                    className="input"
                    placeholder="0"
                  />
                  {errors.initial_stock && (
                    <p className="mt-1 text-sm text-red-600">{errors.initial_stock.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input"
                  placeholder="Ürün açıklaması..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingProduct ? 'Güncelleniyor...' : 'Ekleniyor...'}
                    </div>
                  ) : (
                    editingProduct ? 'Ürünü Güncelle' : 'Ürün Ekle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Ürün Detayları</h2>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ürün Adı</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingProduct.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SKU</label>
                      <p className="mt-1 text-sm font-mono text-gray-900">{viewingProduct.sku}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Kategori</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingProduct.category_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tedarikçi</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingProduct.supplier_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Depo</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingProduct.warehouse_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Birim</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingProduct.unit || 'adet'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Stok ve Fiyat Bilgileri</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mevcut Stok</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingProduct.current_stock}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Minimum Stok</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingProduct.min_stock_level}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Maksimum Stok</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingProduct.max_stock_level}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Birim Fiyat</label>
                      <p className="mt-1 text-sm text-gray-900">₺{viewingProduct.unit_price}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Maliyet Fiyatı</label>
                      <p className="mt-1 text-sm text-gray-900">₺{viewingProduct.cost_price}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stok Durumu</label>
                      <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full ${getStockStatus(viewingProduct.current_stock, viewingProduct.min_stock_level).color}`}>
                        {getStockStatus(viewingProduct.current_stock, viewingProduct.min_stock_level).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingProduct.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Açıklama</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {viewingProduct.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="btn-secondary"
                >
                  Kapat
                </button>
                {hasPermission('products:update') && (
                  <button
                    type="button"
                    onClick={() => {
                      closeViewModal();
                      handleEdit(viewingProduct);
                    }}
                    className="btn-primary"
                  >
                    Düzenle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products; 