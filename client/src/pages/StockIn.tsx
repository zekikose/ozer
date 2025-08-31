import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { ArrowUp, Package, Plus, Trash2, Calendar, DollarSign, Hash } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import SelectBox2 from '../components/SelectBox2';

interface StockInItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  supplier_id: string;
  supplier_name: string;
  quantity: string;
  unit_price: string;
  total_amount: number;
}

interface StockInForm {
  entry_date: string;
  notes: string;
  items: StockInItem[];
}

const StockIn: React.FC = () => {
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<StockInItem[]>([]);
  const [currentItem, setCurrentItem] = useState<StockInItem>({
    product_id: '',
    product_name: '',
    product_sku: '',
    supplier_id: '',
    supplier_name: '',
    quantity: '',
    unit_price: '0',
    total_amount: 0
  });
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StockInForm>();

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

  // Stock in mutation
  const stockInMutation = useMutation(
    async (data: StockInForm) => {
      const requestData = {
        entry_date: data.entry_date,
        notes: data.notes,
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
        queryClient.invalidateQueries('products');
        queryClient.invalidateQueries('stockMovements');
        toast.success('Stok girişi başarıyla kaydedildi');
        reset();
        setItems([]);
        setCurrentItem({
          product_id: '',
          product_name: '',
          product_sku: '',
          supplier_id: '',
          supplier_name: '',
          quantity: '',
          unit_price: '0',
          total_amount: 0
        });
      },
      onError: (error: any) => {
        console.error('Stock in error:', error.response?.data);
        const errorMessage = error.response?.data?.error || 'Stok girişi başarısız';
        toast.error(errorMessage);
      },
    }
  );

  const onSubmit = async (data: StockInForm) => {
    if (items.length === 0) {
      toast.error('En az bir ürün eklemelisiniz');
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

  // Add item to list
  const addItemToList = () => {
    if (!currentItem.product_id || !currentItem.supplier_id || !currentItem.quantity) {
      toast.error('Lütfen ürün, tedarikçi ve miktar bilgilerini doldurun');
      return;
    }

    const newItem: StockInItem = {
      ...currentItem,
      total_amount: parseFloat(currentItem.quantity) * parseFloat(currentItem.unit_price)
    };

    setItems([...items, newItem]);
    
    // Reset current item
    setCurrentItem({
      product_id: '',
      product_name: '',
      product_sku: '',
      supplier_id: '',
      supplier_name: '',
      quantity: '',
      unit_price: '0',
      total_amount: 0
    });

    toast.success('Ürün listeye eklendi');
  };

  // Remove item from list
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Ürün listeden kaldırıldı');
  };

  // Update current item
  const updateCurrentItem = (field: keyof StockInItem, value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate total amount
  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.total_amount, 0);
  };

  // Load selected product from location state
  useEffect(() => {
    const selectedProduct = location.state?.selectedProduct;
    if (selectedProduct) {
      setCurrentItem(prev => ({
        ...prev,
        product_id: selectedProduct.id.toString(),
        product_name: selectedProduct.name,
        product_sku: selectedProduct.sku
      }));
      toast.success(`${selectedProduct.name} ürünü seçildi!`);
    }
  }, [location.state]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-3 rounded-lg">
            <ArrowUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Stok Girişi</h1>
            <p className="text-blue-100">Tedarikçiden stok giriş işlemi</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection Panel */}
        <div className="lg:col-span-1">
          <div className="card bg-white shadow-lg border-0">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Ürün Seçimi
              </h3>

              <div className="space-y-4">
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
                    value={currentItem.product_id}
                    onChange={(value) => {
                      const selectedProduct = products?.find((p: any) => p.id.toString() === value);
                      updateCurrentItem('product_id', value.toString());
                      updateCurrentItem('product_name', selectedProduct?.name || '');
                      updateCurrentItem('product_sku', selectedProduct?.sku || '');
                    }}
                    placeholder="Ürün seçin"
                  />
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
                    value={currentItem.supplier_id}
                    onChange={(value) => {
                      const selectedSupplier = suppliers?.find((s: any) => s.id.toString() === value);
                      updateCurrentItem('supplier_id', value.toString());
                      updateCurrentItem('supplier_name', selectedSupplier?.name || '');
                    }}
                    placeholder="Tedarikçi seçin"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miktar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => updateCurrentItem('quantity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Miktar"
                  />
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birim Fiyat (₺)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentItem.unit_price}
                      onChange={(e) => updateCurrentItem('unit_price', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Add to List Button */}
                <button
                  type="button"
                  onClick={addItemToList}
                  disabled={!currentItem.product_id || !currentItem.supplier_id || !currentItem.quantity}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Listeye Ekle</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Items List and Form */}
        <div className="lg:col-span-2">
          <div className="card bg-white shadow-lg border-0">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Hash className="h-5 w-5 mr-2 text-blue-600" />
                Stok Giriş Fişi
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Date and Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giriş Tarihi *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="datetime-local"
                        {...register('entry_date', { required: 'Giriş tarihi gereklidir' })}
                        defaultValue={new Date().toISOString().slice(0, 16)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {errors.entry_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.entry_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notlar
                    </label>
                    <input
                      type="text"
                      {...register('notes')}
                      placeholder="Notlar (isteğe bağlı)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Eklenen Ürünler</h4>
                    <span className="text-sm text-gray-500">{items.length} ürün</span>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Henüz ürün eklenmemiş</p>
                      <p className="text-sm">Sol panelden ürün seçip listeye ekleyin</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <Package className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900">{item.product_name}</h5>
                                  <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                                  <p className="text-sm text-gray-500">Tedarikçi: {item.supplier_name}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {item.quantity} adet × ₺{parseFloat(item.unit_price).toFixed(2)}
                              </p>
                              <p className="font-semibold text-gray-900">
                                ₺{item.total_amount.toFixed(2)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Amount */}
                  {items.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span>{isSubmitting ? 'İşleniyor...' : 'Stok Girişi Yap'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockIn;