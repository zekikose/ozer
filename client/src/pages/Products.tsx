import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Filter,
  Download,
  Upload,
  RefreshCw,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
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

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category_id: number;
  supplier_id: number;
  warehouse_id: number;
  unit: string;
  unit_price: string;
  cost_price: string;
  min_stock_level: number;
  max_stock_level: number;
  current_stock: number;
  category_name?: string;
  supplier_name?: string;
  warehouse_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Products: React.FC = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductForm>();

  // Queries
  const { data: productsData, isLoading, refetch } = useQuery(
    ['products', currentPage, searchTerm, selectedCategory, selectedSupplier, selectedWarehouse, showLowStock],
    async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        search: searchTerm,
        ...(selectedCategory && { category_id: selectedCategory }),
        ...(selectedSupplier && { supplier_id: selectedSupplier }),
        ...(selectedWarehouse && { warehouse_id: selectedWarehouse }),
        ...(showLowStock && { low_stock: 'true' }),
      });
      
      const response = await axios.get(`/api/products?${params}`);
      return response.data;
    },
    {
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  const { data: categories } = useQuery('categories', async () => {
    const response = await axios.get('/api/categories');
    return response.data.categories;
  });

  const { data: suppliers } = useQuery('suppliers', async () => {
    const response = await axios.get('/api/suppliers');
    return response.data.suppliers;
  });

  const { data: warehouses } = useQuery('warehouses', async () => {
    const response = await axios.get('/api/warehouses');
    return response.data.warehouses;
  });

  // Mutations
  const addProductMutation = useMutation(
    async (productData: ProductForm) => {
      const response = await axios.post('/api/products', productData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('✅ Ürün başarıyla eklendi');
        setShowModal(false);
        reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || '❌ Ürün eklenirken hata oluştu');
      },
    }
  );

  const deleteMutation = useMutation(
    async (productId: number) => {
      await axios.delete(`/api/products/${productId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('✅ Ürün başarıyla silindi');
      },
      onError: () => {
        toast.error('❌ Ürün silinirken hata oluştu');
      },
    }
  );

  const updateProductMutation = useMutation(
    async (productData: ProductForm & { id: number }) => {
      const response = await axios.put(`/api/products/${productData.id}`, productData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('✅ Ürün başarıyla güncellendi');
        setShowModal(false);
        setEditingProduct(null);
        reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || '❌ Ürün güncellenirken hata oluştu');
      },
    }
  );

  // Form submission
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

  // Auto-generate SKU
  const watchedProductName = watch('name');
  useEffect(() => {
    if (watchedProductName && watchedProductName.length > 2) {
      const autoSKU = generateSKU(watchedProductName);
      setValue('sku', autoSKU);
    }
  }, [watchedProductName, setValue]);

  // Modal handlers
  const openModal = () => {
    setShowModal(true);
    setEditingProduct(null);
    const autoSKU = generateSKU();
    reset({
      sku: autoSKU,
      unit: 'adet'
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    reset();
  };

  // Action handlers
  const handleDelete = (productId: number) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(productId);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      category_id: product.category_id?.toString() || '',
      supplier_id: product.supplier_id?.toString() || '',
      warehouse_id: product.warehouse_id?.toString() || '',
      unit: product.unit || 'adet',
      price: parseFloat(product.unit_price) || 0,
      min_stock: product.min_stock_level || 0,
      initial_stock: product.current_stock || 0
    });
    setShowModal(true);
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
  };

  const closeViewModal = () => {
    setViewingProduct(null);
  };

  // Utility functions
  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) return { 
      status: 'out-of-stock', 
      label: 'Stokta Yok', 
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: XCircle
    };
    if (currentStock <= minStock) return { 
      status: 'low-stock', 
      label: 'Düşük Stok', 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      icon: AlertTriangle
    };
    return { 
      status: 'in-stock', 
      label: 'Stokta', 
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: CheckCircle
    };
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSupplier('');
    setSelectedWarehouse('');
    setShowLowStock(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedSupplier || selectedWarehouse || showLowStock;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
              <p className="mt-1 text-sm text-gray-500">
                Stok yönetimi için ürün listesi ve yönetimi
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </button>
              {hasPermission('products:create') && (
                <button
                  onClick={openModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Ürün
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtreler
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Filtreleri Temizle
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="Kategori"
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
              placeholder="Tedarikçi"
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
              placeholder="Depo"
            />
          </div>

          {/* Additional Filters */}
          <div className="mt-4 flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Sadece düşük stoklu ürünler</span>
            </label>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm text-gray-700">Görünüm:</span>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Package className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <TrendingUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Products Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productsData?.products?.map((product: Product) => {
                  const stockStatus = getStockStatus(product.current_stock, product.min_stock_level);
                  const StatusIcon = stockStatus.icon;
                  
                  return (
                    <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                            <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <StatusIcon className={`h-4 w-4 ${stockStatus.color.split(' ')[0]}`} />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Kategori:</span>
                            <span className="text-gray-900">{product.category_name || '-'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Stok:</span>
                            <span className="font-medium">{product.current_stock} {product.unit}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Fiyat:</span>
                            <span className="font-medium text-green-600">₺{product.unit_price}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {stockStatus.label}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleView(product)}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="Görüntüle"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {hasPermission('products:update') && (
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Düzenle"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {hasPermission('products:delete') && (
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="Sil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ürün
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stok
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fiyat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productsData?.products?.map((product: Product) => {
                        const stockStatus = getStockStatus(product.current_stock, product.min_stock_level);
                        const StatusIcon = stockStatus.icon;
                        
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                {product.barcode && (
                                  <div className="text-sm text-gray-500">Barkod: {product.barcode}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-mono text-gray-900">{product.sku}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{product.category_name || '-'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <span className="text-sm font-medium text-gray-900">{product.current_stock}</span>
                                <div className="text-xs text-gray-500">Min: {product.min_stock_level}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <span className="text-sm font-medium text-green-600">₺{product.unit_price}</span>
                                <div className="text-xs text-gray-500">Maliyet: ₺{product.cost_price}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {stockStatus.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleView(product)}
                                  className="text-gray-400 hover:text-blue-600"
                                  title="Görüntüle"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {hasPermission('products:update') && (
                                  <button
                                    onClick={() => handleEdit(product)}
                                    className="text-gray-400 hover:text-blue-600"
                                    title="Düzenle"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                )}
                                {hasPermission('products:delete') && (
                                  <button
                                    onClick={() => handleDelete(product.id)}
                                    className="text-gray-400 hover:text-red-600"
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
              </div>
            )}

            {/* Pagination */}
            {productsData?.pagination && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Toplam <span className="font-medium">{productsData.pagination.total_items}</span> ürün
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Sayfa {currentPage} / {productsData.pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === productsData.pagination.total_pages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
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

            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Adı *
                  </label>
                  <input
                    {...register('name', { required: 'Ürün adı gerekli' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SKU otomatik oluşturulacak"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSKU = generateSKU();
                        setValue('sku', newSKU);
                      }}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors duration-200"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  {errors.initial_stock && (
                    <p className="mt-1 text-sm text-red-600">{errors.initial_stock.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ürün açıklaması..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Ürün Detayları</h2>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler</h3>
                  <div className="space-y-4">
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

                {/* Stock and Price Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Stok ve Fiyat Bilgileri</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mevcut Stok</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingProduct.current_stock} {viewingProduct.unit}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Minimum Stok</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingProduct.min_stock_level} {viewingProduct.unit}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Birim Fiyat</label>
                      <p className="mt-1 text-sm text-green-600 font-medium">₺{viewingProduct.unit_price}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Maliyet Fiyatı</label>
                      <p className="mt-1 text-sm text-gray-900">₺{viewingProduct.cost_price}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stok Durumu</label>
                      <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatus(viewingProduct.current_stock, viewingProduct.min_stock_level).color}`}>
                        {getStockStatus(viewingProduct.current_stock, viewingProduct.min_stock_level).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingProduct.description && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Açıklama</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {viewingProduct.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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