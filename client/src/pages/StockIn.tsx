import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { ArrowUp, Search, Plus, X } from 'lucide-react';
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

const StockIn: React.FC = () => {
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
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
        queryClient.invalidateQueries('products');
        queryClient.invalidateQueries('stock-movements');
      },
      onError: (error: any) => {
        console.error('Stock in error:', error.response?.data); // Debug log
        console.error('Error status:', error.response?.status); // Debug log
        console.error('Error message:', error.message); // Debug log
        console.error('Full error:', error); // Debug log
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
        // Otomatik olarak yeni ürünü seç
        setValue('product_id', data.product.id.toString());
        setProductSearch(data.product.name);
      },
      onError: (error: any) => {
        console.error('Create product error:', error.response?.data); // Debug log
        console.error('Error status:', error.response?.status); // Debug log
        console.error('Full error:', error); // Debug log
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

  // Ürün adını izle ve SKU'yu otomatik oluştur
  const watchedProductName = watchNewProduct('name');
  
  useEffect(() => {
    if (watchedProductName && watchedProductName.length > 2) {
      const autoSKU = generateSKU(watchedProductName);
      setValueNewProduct('sku', autoSKU);
    }
  }, [watchedProductName, setValueNewProduct]);



  const onSubmitNewProduct = async (data: NewProductForm) => {
    setIsCreatingProduct(true);
    try {
      await createProductMutation.mutateAsync(data);
      setShowNewProductModal(false);
      resetNewProduct();
    } finally {
      setIsCreatingProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Girişi</h1>
          <p className="text-gray-600">Yeni ürün girişi yapın</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewProductModal(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Ürün Tanımla
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Selection */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ürün adı veya SKU ile arayın..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  className="input w-full pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              
              {showProductDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product: any) => (
                      <div
                        key={product.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                        onClick={() => {
                          setValue('product_id', product.id.toString());
                          setProductSearch(product.name);
                          setShowProductDropdown(false);
                        }}
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          SKU: {product.sku} | Mevcut Stok: {product.current_stock}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 text-sm">
                      Ürün bulunamadı
                    </div>
                  )}
                </div>
              )}
              
              <input
                type="hidden"
                {...register('product_id', { required: 'Ürün seçin' })}
              />
              {errors.product_id && (
                <p className="mt-1 text-sm text-red-600">{errors.product_id.message}</p>
              )}
              {selectedProduct && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <div className="text-sm text-blue-800">
                    <strong>Seçili Ürün:</strong> {selectedProduct.name}
                  </div>
                  <div className="text-sm text-blue-600">
                    SKU: {selectedProduct.sku} | Mevcut Stok: {selectedProduct.current_stock}
                  </div>
                </div>
              )}
            </div>

            {/* Supplier Selection */}
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
              {!watch('supplier_id') && (
                <p className="mt-1 text-sm text-red-600">Tedarikçi seçimi zorunludur</p>
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
                {...register('quantity', { 
                  required: 'Miktar gerekli',
                  min: { value: 1, message: 'Miktar en az 1 olmalı' }
                })}
                className="input"
                placeholder="Miktar girin"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birim Fiyat *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('unit_price', { 
                  required: 'Birim fiyat gerekli',
                  min: { value: 0, message: 'Birim fiyat 0\'dan büyük olmalı' }
                })}
                className="input"
                placeholder="0.00"
              />
              {errors.unit_price && (
                <p className="mt-1 text-sm text-red-600">{errors.unit_price.message}</p>
              )}
            </div>



            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referans Numarası
              </label>
              <input
                type="text"
                {...register('reference_number')}
                className="input"
                placeholder="Fatura/İrsaliye no"
              />
            </div>

            {/* Entry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giriş Tarihi *
              </label>
              <input
                {...register('entry_date', { 
                  required: 'Giriş tarihi gerekli'
                })}
                type="datetime-local"
                className="input"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
              {errors.entry_date && (
                <p className="mt-1 text-sm text-red-600">{errors.entry_date.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notlar
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input"
              placeholder="Ek notlar..."
            />
          </div>

          {/* Total Amount Display */}
          {selectedQuantity && selectedUnitPrice && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-lg font-semibold text-gray-900">
                Toplam Tutar: ₺{totalAmount.toFixed(2)}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !watch('supplier_id') || !watch('product_id')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isSubmitting || !watch('supplier_id') || !watch('product_id')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transform hover:scale-105'
              }`}
            >
              <ArrowUp className="h-4 w-4" />
              <span>
                {isSubmitting 
                  ? 'İşleniyor...' 
                  : !watch('supplier_id') 
                    ? 'Tedarikçi Seçin'
                    : !watch('product_id')
                      ? 'Ürün Seçin'
                      : 'Stok Girişi Yap'
                }
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* New Product Modal */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Yeni Ürün Tanımla</h2>
                  <p className="text-sm text-gray-600">Yeni ürün bilgilerini girin</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewProduct(onSubmitNewProduct)} className="p-6 space-y-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    {...registerNewProduct('name', { required: 'Ürün adı gerekli' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="Ürün adı girin"
                  />
                  {newProductErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{newProductErrors.name.message}</p>
                  )}
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      {...registerNewProduct('sku', { required: 'SKU gerekli' })}
                      className="input flex-1"
                      placeholder="SKU otomatik oluşturulacak"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSKU = generateSKU(watchedProductName);
                        setValueNewProduct('sku', newSKU);
                      }}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors duration-200"
                    >
                      Yenile
                    </button>
                  </div>
                  {newProductErrors.sku && (
                    <p className="mt-1 text-sm text-red-600">{newProductErrors.sku.message}</p>
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
                    value={watchNewProduct('category_id') || ''}
                    onChange={(value) => setValueNewProduct('category_id', value.toString())}
                    placeholder="Kategori seçin"
                    required
                    error={!!newProductErrors.category_id}
                  />
                  {newProductErrors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{newProductErrors.category_id.message}</p>
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
                    value={watchNewProduct('supplier_id') || ''}
                    onChange={(value) => setValueNewProduct('supplier_id', value.toString())}
                    placeholder="Tedarikçi seçin"
                    required
                    error={!!newProductErrors.supplier_id}
                  />
                  {newProductErrors.supplier_id && (
                    <p className="mt-1 text-sm text-red-600">{newProductErrors.supplier_id.message}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birim Fiyat *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...registerNewProduct('price', { 
                      required: 'Birim fiyat gerekli',
                      min: { value: 0, message: 'Birim fiyat 0\'dan büyük olmalı' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="0.00"
                  />
                  {newProductErrors.price && (
                    <p className="mt-1 text-sm text-red-600">{newProductErrors.price.message}</p>
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
                      { value: 'metrekare', label: 'Metrekare' },
                      { value: 'metreküp', label: 'Metreküp' }
                    ]}
                    value={watchNewProduct('unit') || ''}
                    onChange={(value) => setValueNewProduct('unit', value.toString())}
                    placeholder="Birim seçin"
                    required
                    error={!!newProductErrors.unit}
                  />
                  {newProductErrors.unit && (
                    <p className="mt-1 text-sm text-red-600">{newProductErrors.unit.message}</p>
                  )}
                </div>

                {/* Min Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stok *
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...registerNewProduct('min_stock', { 
                      required: 'Minimum stok gerekli',
                      min: { value: 0, message: 'Minimum stok 0\'dan büyük olmalı' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="0"
                  />
                  {newProductErrors.min_stock && (
                    <p className="mt-1 text-sm text-red-600">{newProductErrors.min_stock.message}</p>
                  )}
                </div>

                {/* Initial Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Stoku *
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...registerNewProduct('initial_stock', { 
                      required: 'Başlangıç stoku gerekli',
                      min: { value: 0, message: 'Başlangıç stoku 0\'dan büyük olmalı' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="0"
                  />
                  {newProductErrors.initial_stock && (
                    <p className="mt-1 text-sm text-red-600">{newProductErrors.initial_stock.message}</p>
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
                    value={watchNewProduct('warehouse_id') || ''}
                    onChange={(value) => setValueNewProduct('warehouse_id', value.toString())}
                    placeholder="Depo seçin"
                    required
                    error={!!newProductErrors.warehouse_id}
                  />
                  {newProductErrors.warehouse_id && (
                    <p className="mt-1 text-sm text-red-600">{newProductErrors.warehouse_id.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  {...registerNewProduct('description')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white resize-none"
                  placeholder="Ürün açıklaması..."
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isCreatingProduct ? 'Oluşturuluyor...' : 'Ürün Oluştur'}</span>
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