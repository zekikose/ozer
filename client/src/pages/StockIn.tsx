import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { ArrowUp, Search, Plus, X, Eye, Calendar, Hash, User } from 'lucide-react';
import SelectBox2 from '../components/SelectBox2';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { generateSKU } from '../utils/skuGenerator';

interface StockInForm {
  product_id: string;
  quantity: string;
  unit_price: string;
  supplier_id: string;
  reference_number: string;
  notes: string;
  entry_date: string;
}

interface NewProductForm {
  name: string;
  sku: string;
  description: string;
  category_id: string;
  supplier_id: string;
  price: string;
  min_stock: string;
  initial_stock: string;
  unit: string;
  warehouse_id: string;
}

interface StockInTransaction {
  reference_number: string;
  created_at: string;
  notes: string;
  supplier_name: string;
  supplier_phone: string;
  user_name: string;
  items_count: number;
  total_quantity: string;
  total_amount: string;
}

interface StockInDetail {
  header: {
    reference_number: string;
    transaction_type: string;
    created_at: string;
    notes: string;
    supplier_name: string;
    supplier_phone: string;
    supplier_email: string;
    user_name: string;
    items_count: number;
    total_quantity: string;
    total_amount: string;
  };
  items: Array<{
    id: number;
    product_name: string;
    product_sku: string;
    quantity: string;
    unit_price: string;
    total_amount: string;
    item_notes: string;
  }>;
}

const StockIn: React.FC = () => {
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<StockInDetail | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StockInForm>();

  const {
    register: registerNewProduct,
    handleSubmit: handleSubmitNewProduct,
    reset: resetNewProduct,
    watch: watchNewProduct,
    setValue: setValueNewProduct,
    formState: { errors: newProductErrors },
  } = useForm<NewProductForm>();

  const selectedProductId = watch('product_id');
  const selectedQuantity = watch('quantity');
  const selectedUnitPrice = watch('unit_price');

  // Fetch products
  const { data: products } = useQuery('products', async () => {
    const response = await axios.get('/api/products?limit=1000');
    return response.data.products;
  });

  // Fetch suppliers
  const { data: suppliers } = useQuery('suppliers', async () => {
    const response = await axios.get('/api/suppliers');
    return response.data.suppliers;
  });

  // Fetch categories
  const { data: categories } = useQuery('categories', async () => {
    const response = await axios.get('/api/categories');
    return response.data.categories;
  });

  // Fetch warehouses
  const { data: warehouses } = useQuery('warehouses', async () => {
    const response = await axios.get('/api/warehouses');
    return response.data.warehouses;
  });

  // Fetch stock in transactions
  const { data: stockInData, isLoading: isLoadingStockIn } = useQuery(
    ['stock-in-transactions', currentPage, searchTerm],
    async () => {
      const response = await axios.get(`/api/stock/transactions?transaction_type=in&page=${currentPage}&limit=10&search=${searchTerm}`);
      return response.data;
    }
  );

  const selectedProduct = products?.find((p: any) => p.id.toString() === selectedProductId);
  const totalAmount = (selectedQuantity && selectedUnitPrice) 
    ? parseFloat(selectedQuantity.toString()) * parseFloat(selectedUnitPrice.toString())
    : 0;

  // Filter products based on search
  const filteredProducts = products?.filter((product: any) =>
    !productSearch || 
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  // Load selected product from location state
  useEffect(() => {
    const selectedProduct = location.state?.selectedProduct;
    if (selectedProduct) {
      setValue('product_id', selectedProduct.id.toString());
      toast.success(`${selectedProduct.name} ürünü seçildi!`);
    }
  }, [location.state, setValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stock in mutation
  const stockInMutation = useMutation(
    async (data: StockInForm) => {
      const requestData = {
        ...data,
        product_id: parseInt(data.product_id),
        supplier_id: data.supplier_id ? parseInt(data.supplier_id) : undefined,
        quantity: parseInt(data.quantity),
        unit_price: parseFloat(data.unit_price),
        entry_date: data.entry_date
      };
      const response = await axios.post('/api/stock/in', requestData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Stok girişi başarıyla yapıldı!');
        reset();
        setShowStockInModal(false);
        queryClient.invalidateQueries('products');
        queryClient.invalidateQueries('stock-movements');
        queryClient.invalidateQueries('stock-in-transactions');
      },
      onError: (error: any) => {
        console.error('Stock in error:', error.response?.data);
        toast.error(error.response?.data?.error || 'Stok girişi yapılırken hata oluştu');
      }
    }
  );

  // Create new product mutation
  const createProductMutation = useMutation(
    async (data: NewProductForm) => {
      const requestData = {
        ...data,
        category_id: parseInt(data.category_id),
        supplier_id: parseInt(data.supplier_id),
        warehouse_id: parseInt(data.warehouse_id),
        price: parseFloat(data.price),
        min_stock: parseInt(data.min_stock),
        initial_stock: parseInt(data.initial_stock)
      };
      const response = await axios.post('/api/products', requestData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Yeni ürün başarıyla oluşturuldu!');
        resetNewProduct();
        setShowNewProductModal(false);
        queryClient.invalidateQueries('products');
        setValue('product_id', data.product.id.toString());
        setProductSearch(data.product.name);
      },
      onError: (error: any) => {
        console.error('Create product error:', error.response?.data);
        toast.error(error.response?.data?.error || 'Ürün oluşturulurken hata oluştu');
      }
    }
  );

  const onSubmit = async (data: StockInForm) => {
    setIsSubmitting(true);
    try {
      await stockInMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View transaction detail
  const viewTransactionDetail = async (referenceNumber: string, createdAt: string) => {
    try {
      const response = await axios.get(`/api/stock/transactions/${referenceNumber}?created_at=${createdAt.split('T')[0]}`);
      setSelectedTransaction(response.data.transaction);
      setShowDetailModal(true);
    } catch (error: any) {
      toast.error('İşlem detayları yüklenirken hata oluştu');
    }
  };

  // Ürün adını izle ve SKU'yu otomatik oluştur
  const watchedProductName = watchNewProduct('name');
  
  useEffect(() => {
    if (watchedProductName) {
      const sku = generateSKU(watchedProductName);
      setValueNewProduct('sku', sku);
    }
  }, [watchedProductName, setValueNewProduct]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(parseFloat(amount));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stok Giriş Yönetimi</h1>
        <button
          onClick={() => setShowStockInModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Stok Giriş Yap
        </button>
      </div>

      {/* Stock In List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Stok Giriş Listesi</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {isLoadingStockIn ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Yükleniyor...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok Giriş No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tedarikçi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Toplam Tutar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockInData?.transactions?.map((transaction: StockInTransaction) => (
                    <tr key={`${transaction.reference_number}-${transaction.created_at}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Hash className="text-gray-400 mr-2" size={16} />
                          <span className="text-sm font-medium text-gray-900">
                            {transaction.reference_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="text-gray-400 mr-2" size={16} />
                          <span className="text-sm text-gray-900">
                            {transaction.supplier_name || 'Belirtilmemiş'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="text-gray-400 mr-2" size={16} />
                          <span className="text-sm text-gray-900">
                            {formatDate(transaction.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(transaction.total_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => viewTransactionDetail(transaction.reference_number, transaction.created_at)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye size={16} />
                          Detay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {stockInData?.pagination && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-700">
                  Toplam {stockInData.pagination.total_items} kayıt
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Sayfa {currentPage} / {stockInData.pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(stockInData.pagination.total_pages, prev + 1))}
                    disabled={currentPage === stockInData.pagination.total_pages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stock In Modal */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Stok Giriş Yap</h2>
              <button
                onClick={() => setShowStockInModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Seçimi
                </label>
                <div className="relative" ref={dropdownRef}>
                  <input
                    type="text"
                    placeholder="Ürün ara..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  {showProductDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={() => setShowNewProductModal(true)}
                          className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Yeni Ürün Ekle
                        </button>
                      </div>
                      {filteredProducts.map((product: any) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setValue('product_id', product.id.toString());
                            setProductSearch(product.name);
                            setShowProductDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 border-t border-gray-100"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedProduct && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium">{selectedProduct.name}</div>
                    <div className="text-sm text-gray-600">SKU: {selectedProduct.sku}</div>
                    <div className="text-sm text-gray-600">Mevcut Stok: {selectedProduct.stock_quantity || 0}</div>
                  </div>
                )}
              </div>

              {/* Quantity and Unit Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miktar
                  </label>
                  <input
                    type="number"
                    {...register('quantity', { required: 'Miktar gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birim Fiyat
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('unit_price', { required: 'Birim fiyat gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  {errors.unit_price && (
                    <p className="text-red-500 text-sm mt-1">{errors.unit_price.message}</p>
                  )}
                </div>
              </div>

              {/* Total Amount */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Toplam Tutar:</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(totalAmount.toString())}
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tedarikçi
                </label>
                <select
                  {...register('supplier_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tedarikçi seçin</option>
                  {suppliers?.map((supplier: any) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referans Numarası
                </label>
                <input
                  type="text"
                  {...register('reference_number', { required: 'Referans numarası gerekli' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="STK-2024-001"
                />
                {errors.reference_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.reference_number.message}</p>
                )}
              </div>

              {/* Entry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giriş Tarihi
                </label>
                <input
                  type="date"
                  {...register('entry_date', { required: 'Giriş tarihi gerekli' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.entry_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.entry_date.message}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Stok girişi hakkında notlar..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <ArrowUp size={16} />
                      Stok Girişi Yap
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Stok Giriş Detayı - {selectedTransaction.header.reference_number}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Header Information */}
            <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">İşlem Bilgileri</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Referans No:</span> {selectedTransaction.header.reference_number}</div>
                  <div><span className="font-medium">Tarih:</span> {formatDate(selectedTransaction.header.created_at)}</div>
                  <div><span className="font-medium">Toplam Tutar:</span> {formatCurrency(selectedTransaction.header.total_amount)}</div>
                  <div><span className="font-medium">Toplam Miktar:</span> {selectedTransaction.header.total_quantity}</div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Tedarikçi Bilgileri</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Tedarikçi:</span> {selectedTransaction.header.supplier_name || 'Belirtilmemiş'}</div>
                  <div><span className="font-medium">Telefon:</span> {selectedTransaction.header.supplier_phone || 'Belirtilmemiş'}</div>
                  <div><span className="font-medium">E-posta:</span> {selectedTransaction.header.supplier_email || 'Belirtilmemiş'}</div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Ürün Detayları</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miktar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birim Fiyat</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedTransaction.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.product_sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(item.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {selectedTransaction.header.notes && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Notlar</h3>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  {selectedTransaction.header.notes}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Yeni Ürün Ekle</h2>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitNewProduct((data) => createProductMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Adı</label>
                  <input
                    type="text"
                    {...registerNewProduct('name', { required: 'Ürün adı gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {newProductErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{newProductErrors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input
                    type="text"
                    {...registerNewProduct('sku', { required: 'SKU gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {newProductErrors.sku && (
                    <p className="text-red-500 text-sm mt-1">{newProductErrors.sku.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  {...registerNewProduct('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <select
                    {...registerNewProduct('category_id', { required: 'Kategori gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Kategori seçin</option>
                    {categories?.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {newProductErrors.category_id && (
                    <p className="text-red-500 text-sm mt-1">{newProductErrors.category_id.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tedarikçi</label>
                  <select
                    {...registerNewProduct('supplier_id', { required: 'Tedarikçi gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tedarikçi seçin</option>
                    {suppliers?.map((supplier: any) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {newProductErrors.supplier_id && (
                    <p className="text-red-500 text-sm mt-1">{newProductErrors.supplier_id.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depo</label>
                  <select
                    {...registerNewProduct('warehouse_id', { required: 'Depo gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Depo seçin</option>
                    {warehouses?.map((warehouse: any) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {newProductErrors.warehouse_id && (
                    <p className="text-red-500 text-sm mt-1">{newProductErrors.warehouse_id.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat</label>
                  <input
                    type="number"
                    step="0.01"
                    {...registerNewProduct('price', { required: 'Fiyat gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {newProductErrors.price && (
                    <p className="text-red-500 text-sm mt-1">{newProductErrors.price.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min. Stok</label>
                  <input
                    type="number"
                    {...registerNewProduct('min_stock', { required: 'Min. stok gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {newProductErrors.min_stock && (
                    <p className="text-red-500 text-sm mt-1">{newProductErrors.min_stock.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Stok</label>
                  <input
                    type="number"
                    {...registerNewProduct('initial_stock', { required: 'Başlangıç stok gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {newProductErrors.initial_stock && (
                    <p className="text-red-500 text-sm mt-1">{newProductErrors.initial_stock.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Birim</label>
                  <input
                    type="text"
                    {...registerNewProduct('unit', { required: 'Birim gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Adet, Kg, Lt..."
                  />
                  {newProductErrors.unit && (
                    <p className="text-red-500 text-sm mt-1">{newProductErrors.unit.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingProduct ? 'Oluşturuluyor...' : 'Ürün Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockIn; 