import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { ArrowUp, Search, Plus, X, Eye, Calendar, Hash, User, Package } from 'lucide-react';
import SelectBox2 from '../components/SelectBox2';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { generateSKU } from '../utils/skuGenerator';

interface StockInItem {
  product_id: string;
  quantity: string;
  unit_price: string;
  total_amount: number;
}

interface StockInForm {
  supplier_id: string;
  reference_number: string;
  notes: string;
  entry_date: string;
  items: StockInItem[];
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
  const [items, setItems] = useState<StockInItem[]>([]);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<StockInDetail | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

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

  // Stock in mutation
  const stockInMutation = useMutation(
    async (data: StockInForm) => {
      const requestData = {
        ...data,
        supplier_id: data.supplier_id ? parseInt(data.supplier_id) : undefined,
        entry_date: data.entry_date,
        items: data.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          total_amount: item.total_amount
        }))
      };
      console.log('Sending request data:', requestData);
      const response = await axios.post('/api/stock/in', requestData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Stok girişi başarıyla yapıldı!');
        reset();
        setItems([]);
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
        // Add the new product to the first empty item or create a new item
        const emptyItemIndex = items.findIndex(item => !item.product_id);
        if (emptyItemIndex !== -1) {
          updateItem(emptyItemIndex, 'product_id', data.product.id.toString());
        } else {
          addItem();
          setTimeout(() => {
            updateItem(items.length, 'product_id', data.product.id.toString());
          }, 100);
        }
      },
      onError: (error: any) => {
        console.error('Create product error:', error.response?.data);
        toast.error(error.response?.data?.error || 'Ürün oluşturulurken hata oluştu');
      }
    }
  );

  const onSubmit = async (data: StockInForm) => {
    if (items.length === 0) {
      toast.error('En az bir ürün eklemelisiniz');
      return;
    }

    // Validate that all items have required fields
    const invalidItems = items.filter(item => 
      !item.product_id || !item.quantity || !item.unit_price
    );
    
    if (invalidItems.length > 0) {
      console.log('Invalid items:', invalidItems);
      toast.error('Lütfen tüm ürünler için gerekli alanları doldurun');
      return;
    }

    // Additional validation for product_id
    const itemsWithEmptyProductId = items.filter(item => 
      item.product_id === '' || item.product_id === null || item.product_id === undefined
    );
    
    if (itemsWithEmptyProductId.length > 0) {
      console.log('Items with empty product_id:', itemsWithEmptyProductId);
      toast.error('Lütfen tüm ürünler için ürün seçimi yapın');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formData = {
        ...data,
        items: items
      };
      console.log('Submitting form data:', formData);
      await stockInMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const addItem = () => {
    const newItem: StockInItem = {
      product_id: '',
      quantity: '',
      unit_price: '',
      total_amount: 0
    };
    console.log('Adding new item:', newItem);
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof StockInItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate total amount
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? parseFloat(value.toString()) : parseFloat(updatedItems[index].quantity);
      const unitPrice = field === 'unit_price' ? parseFloat(value.toString()) : parseFloat(updatedItems[index].unit_price);
      updatedItems[index].total_amount = quantity * unitPrice;
    }
    
    // Log the update for debugging
    console.log(`Updating item ${index}, field ${field}, value:`, value);
    console.log('Updated item:', updatedItems[index]);
    
    setItems(updatedItems);
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.total_amount, 0);
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

  // Load selected product from location state
  useEffect(() => {
    const selectedProduct = location.state?.selectedProduct;
    if (selectedProduct) {
      const newItem: StockInItem = {
        product_id: selectedProduct.id.toString(),
        quantity: '',
        unit_price: selectedProduct.unit_price?.toString() || '',
        total_amount: 0
      };
      setItems([newItem]);
      toast.success(`${selectedProduct.name} ürünü eklendi!`);
    }
  }, [location.state]);

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
      </div>

      {/* Stock In Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Stok Giriş Yap</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Supplier and General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tedarikçi
              </label>
              <SelectBox2
                options={suppliers?.map((supplier: any) => ({
                  value: supplier.id.toString(),
                  label: supplier.name
                })) || []}
                value={watch('supplier_id') || ''}
                onChange={(value) => setValue('supplier_id', value.toString())}
                placeholder="Tedarikçi seçin"
              />
            </div>

            {/* Entry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giriş Tarihi *
              </label>
              <input
                type="datetime-local"
                {...register('entry_date', { required: 'Giriş tarihi gereklidir' })}
                defaultValue={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.entry_date && (
                <p className="mt-1 text-sm text-red-600">{errors.entry_date.message}</p>
              )}
            </div>
          </div>

          {/* Reference Number and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referans Numarası
              </label>
              <input
                type="text"
                {...register('reference_number')}
                placeholder="Referans numarası"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlar
              </label>
              <input
                type="text"
                {...register('notes')}
                placeholder="Notlar"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Products Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Ürünler</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Ürün
                </button>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Ürün Ekle
                </button>
              </div>
            </div>

            {/* Products List */}
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Henüz ürün eklenmemiş. Ürün eklemek için "Ürün Ekle" butonuna tıklayın.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const selectedProduct = products?.find((p: any) => p.id.toString() === item.product_id);
                  return (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Ürün #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Kaldır
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Product Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ürün *
                          </label>
                          <SelectBox2
                            options={products?.map((product: any) => ({
                              value: product.id.toString(),
                              label: `${product.name} (SKU: ${product.sku} | Stok: ${product.current_stock})`
                            })) || []}
                            value={item.product_id}
                            onChange={(value) => {
                              console.log('Product selected:', value);
                              if (value && value.toString().trim() !== '') {
                                updateItem(index, 'product_id', value.toString());
                              } else {
                                console.log('Empty product value selected');
                              }
                            }}
                            placeholder="Ürün seçin"
                            required
                          />
                          {selectedProduct && (
                            <div className="mt-2 p-2 bg-white rounded-md text-xs text-gray-600">
                              Mevcut Stok: <span className="font-medium">{selectedProduct.current_stock}</span>
                            </div>
                          )}
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Miktar *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Miktar"
                            required
                          />
                        </div>

                        {/* Unit Price */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Birim Fiyat (₺) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            required
                          />
                        </div>

                        {/* Total Amount */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Toplam Tutar
                          </label>
                          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 font-medium">
                            ₺{item.total_amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Amount */}
            {items.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">Toplam Tutar:</span>
                  <span className="text-2xl font-bold text-blue-600">₺{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUp className="h-4 w-4" />
              <span>{isSubmitting ? 'İşleniyor...' : 'Stok Girişi Yap'}</span>
            </button>
          </div>
        </form>
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