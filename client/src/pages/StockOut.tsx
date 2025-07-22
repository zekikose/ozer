import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { ArrowDown, Package, Calendar, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import SelectBox2 from '../components/SelectBox2';

interface StockOutForm {
  product_id: string;
  quantity: string;
  unit_price: string;
  customer_id: string;
  reference_number: string;
  notes: string;
  movement_date: string;
}

const StockOut: React.FC = () => {
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StockOutForm>();

  const selectedProductId = watch('product_id');
  const selectedQuantity = watch('quantity') || 0;
  const selectedUnitPrice = watch('unit_price') || 0;

  // Fetch products
  const { data: products } = useQuery('products', async () => {
    const response = await axios.get('/api/products?limit=1000');
    return response.data.products;
  });

  // Fetch customers
  const { data: customers } = useQuery('customers', async () => {
    const response = await axios.get('/api/customers');
    return response.data.customers;
  });

  // Stock out mutation
  const stockOutMutation = useMutation(
    async (data: StockOutForm) => {
      const response = await axios.post('/api/stock/out', {
        ...data,
        product_id: parseInt(data.product_id),
        customer_id: parseInt(data.customer_id),
        quantity: parseInt(data.quantity),
        unit_price: parseFloat(data.unit_price)
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        queryClient.invalidateQueries('stockMovements');
        toast.success('Stok çıkışı başarıyla kaydedildi');
        reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Stok çıkışı başarısız');
      },
    }
  );

  const onSubmit = async (data: StockOutForm) => {
    setIsSubmitting(true);
    try {
      await stockOutMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products?.find((p: any) => p.id.toString() === selectedProductId);
  const totalAmount = (selectedQuantity && selectedUnitPrice) 
    ? parseFloat(selectedQuantity.toString()) * parseFloat(selectedUnitPrice.toString())
    : 0;

  // Filter products based on search
  const filteredProducts = products?.filter((product: any) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  // Load selected product from location state
  useEffect(() => {
    const selectedProduct = location.state?.selectedProduct;
    if (selectedProduct) {
      setValue('product_id', selectedProduct.id.toString());
      setProductSearch(selectedProduct.name);
      toast.success(`${selectedProduct.name} ürünü seçildi!`);
    }
  }, [location.state, setValue, setProductSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stok Çıkışı</h1>
        <p className="text-gray-600">Müşteriye stok çıkış işlemi</p>
      </div>

      {/* Stock Out Form */}
      <div className="card">
        <div className="card-body">
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
                    className="input pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                
                {/* Product Dropdown */}
                {showProductDropdown && productSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
                            SKU: {product.sku} | Stok: {product.current_stock}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">Ürün bulunamadı</div>
                    )}
                  </div>
                )}
                
                {/* Hidden select for form validation */}
                <select
                  {...register('product_id', { required: 'Ürün seçin' })}
                  className="hidden"
                >
                  <option value="">Ürün seçin</option>
                  {products?.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                
                {errors.product_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.product_id.message}</p>
                )}
                
                {selectedProduct && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Mevcut Stok: <span className="font-medium">{selectedProduct.current_stock}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri *
                </label>
                <SelectBox2
                  options={customers?.map((customer: any) => ({
                    value: customer.id.toString(),
                    label: customer.name
                  })) || []}
                  value={watch('customer_id') || ''}
                  onChange={(value) => setValue('customer_id', value.toString())}
                  placeholder="Müşteri seçin"
                  required
                  error={!!errors.customer_id}
                />
                {errors.customer_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer_id.message}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miktar *
                </label>
                <input
                  {...register('quantity', { 
                    required: 'Miktar gerekli',
                    min: { value: 1, message: 'Miktar en az 1 olmalı' },
                    validate: (value) => {
                      if (selectedProduct && parseInt(value) > selectedProduct.current_stock) {
                        return 'Miktar mevcut stoktan fazla olamaz';
                      }
                      return true;
                    }
                  })}
                  type="number"
                  min="1"
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
                  Birim Fiyat (₺) *
                </label>
                <input
                  {...register('unit_price', { 
                    required: 'Birim fiyat gerekli',
                    min: { value: 0, message: 'Birim fiyat 0\'dan küçük olamaz' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  placeholder="0.00"
                />
                {errors.unit_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.unit_price.message}</p>
                )}
              </div>

              {/* Movement Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İşlem Tarihi
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    {...register('movement_date')}
                    type="date"
                    className="input pl-10"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referans Numarası
                </label>
                <input
                  {...register('reference_number')}
                  type="text"
                  className="input"
                  placeholder="Fatura/İrsaliye no"
                />
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
                placeholder="İşlem notları..."
              />
            </div>

            {/* Total Amount Display */}
            {totalAmount > 0 && (
              <div className="p-4 bg-blue-50 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Toplam Tutar:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ₺{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center space-x-2"
              >
                <ArrowDown className="h-4 w-4" />
                <span>{isSubmitting ? 'İşleniyor...' : 'Stok Çıkışı Yap'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockOut; 