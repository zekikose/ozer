import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { ArrowUp, Package } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import SelectBox2 from '../components/SelectBox2';

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

const StockIn: React.FC = () => {
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<StockInItem[]>([]);
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
        queryClient.invalidateQueries('products');
        queryClient.invalidateQueries('stockMovements');
        toast.success('Stok girişi başarıyla kaydedildi');
        reset();
        setItems([]);
      },
      onError: (error: any) => {
        console.error('Stock in error:', error.response?.data);
        const errorMessage = error.response?.data?.error || 'Stok girişi başarısız';
        toast.error(errorMessage);
      },
    }
  );

  const onSubmit = async (data: StockInForm) => {
    console.log('onSubmit called with data:', data);
    console.log('Current items state:', items);
    console.log('Items length:', items.length);
    
    if (items.length === 0) {
      console.log('No items found, showing error');
      toast.error('En az bir ürün eklemelisiniz');
      return;
    }

    // Validate that all items have required fields
    const invalidItems = items.filter(item => 
      !item.product_id || !item.quantity || !item.unit_price
    );
    
    console.log('Invalid items found:', invalidItems);
    
    if (invalidItems.length > 0) {
      console.log('Invalid items:', invalidItems);
      toast.error('Lütfen tüm ürünler için gerekli alanları doldurun');
      return;
    }

    // Additional validation for product_id
    const itemsWithEmptyProductId = items.filter(item => 
      item.product_id === '' || item.product_id === null || item.product_id === undefined
    );
    
    console.log('Items with empty product_id:', itemsWithEmptyProductId);
    
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
      console.log('Items being sent:', formData.items);
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
    console.log('Current items before adding:', items);
    setItems([newItem, ...items]);
    console.log('Items after adding:', [newItem, ...items]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof StockInItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate total amount
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? parseFloat(value.toString()) || 0 : parseFloat(updatedItems[index].quantity) || 0;
      const unitPrice = field === 'unit_price' ? parseFloat(value.toString()) || 0 : parseFloat(updatedItems[index].unit_price) || 0;
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
      setItems(prevItems => [newItem, ...prevItems]);
      toast.success(`${selectedProduct.name} ürünü eklendi!`);
    }
  }, [location.state]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stok Girişi</h1>
        <p className="text-gray-600">Tedarikçiden stok giriş işlemi</p>
      </div>

      {/* Stock In Form */}
      <div className="card">
        <div className="card-body">
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
                  placeholder="Tedarikçi seçin (isteğe bağlı)"
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
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Ürün Ekle
                </button>
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
      </div>
    </div>
  );
};

export default StockIn;