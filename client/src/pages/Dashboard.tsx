import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Tag,
  Truck,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Eye,
  ShoppingCart,
  Warehouse,
  X
} from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const { data: dashboardData, isLoading, error } = useQuery('dashboard', async () => {
    const response = await axios.get('/api/dashboard/overview');
    return response.data;
  });

  const { data: products } = useQuery('products', async () => {
    const response = await axios.get('/api/products');
    return response.data.products;
  });

  const { data: alerts } = useQuery('alerts', async () => {
    const response = await axios.get('/api/dashboard/alerts');
    return response.data;
  });

  const { data: stockMovements } = useQuery('stockMovements', async () => {
    const response = await axios.get('/api/dashboard/charts/stock-movements');
    return response.data;
  });

  const handleQuickAction = (action: 'in' | 'out', product?: any) => {
    if (product) {
      setSelectedProduct(product);
      setShowQuickActions(true);
    } else {
      navigate(action === 'in' ? '/stock-in' : '/stock-out');
    }
  };

  const handleQuickStockIn = () => {
    if (selectedProduct) {
      navigate('/stock-in', { 
        state: { 
          selectedProduct: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            sku: selectedProduct.sku,
            current_stock: selectedProduct.current_stock
          }
        }
      });
    }
    setShowQuickActions(false);
    setSelectedProduct(null);
  };

  const handleQuickStockOut = () => {
    if (selectedProduct) {
      navigate('/stock-out', { 
        state: { 
          selectedProduct: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            sku: selectedProduct.sku,
            current_stock: selectedProduct.current_stock
          }
        }
      });
    }
    setShowQuickActions(false);
    setSelectedProduct(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Dashboard verileri yüklenirken hata oluştu.</p>
      </div>
    );
  }

  const stats = [
    {
      name: 'Toplam Ürün',
      value: dashboardData?.overview?.total_products || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Düşük Stok',
      value: dashboardData?.overview?.low_stock_products || 0,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Stok Değeri',
      value: `₺${(dashboardData?.overview?.total_stock_value || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Kategoriler',
      value: dashboardData?.overview?.total_categories || 0,
      icon: Tag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Stok yönetimi sisteminizin genel durumu</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stock In */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">Hızlı Stok Girişi</h3>
                <p className="text-sm text-green-600 mt-1">Ürün stok girişi yapın</p>
              </div>
              <div className="bg-green-500 rounded-full p-3">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => handleQuickAction('in')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Stok Girişi Yap
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stock Out */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-800">Hızlı Stok Çıkışı</h3>
                <p className="text-sm text-red-600 mt-1">Ürün stok çıkışı yapın</p>
              </div>
              <div className="bg-red-500 rounded-full p-3">
                <Minus className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => handleQuickAction('out')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Minus className="h-4 w-4 mr-2" />
                Stok Çıkışı Yap
              </button>
            </div>
          </div>
        </div>

        {/* View Products */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Ürünleri Görüntüle</h3>
                <p className="text-sm text-blue-600 mt-1">Tüm ürünleri listele</p>
              </div>
              <div className="bg-blue-500 rounded-full p-3">
                <Eye className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => navigate('/products')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ürünleri Görüntüle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Stock Levels */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Güncel Stok Miktarları</h3>
            <button
              onClick={() => navigate('/products')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <Eye className="h-4 w-4 mr-1" />
              Tümünü Görüntüle
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products?.slice(0, 6).map((product: any) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleQuickAction('in', product)}
                      className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                      title="Stok Girişi"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleQuickAction('out', product)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Stok Çıkışı"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Mevcut Stok</p>
                    <p className={`text-lg font-semibold ${
                      product.current_stock <= product.min_stock_level 
                        ? 'text-red-600' 
                        : product.current_stock <= product.min_stock_level * 1.5 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                    }`}>
                      {product.current_stock} {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Min. Stok</p>
                    <p className="text-sm font-medium text-gray-900">{product.min_stock_level} {product.unit}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        product.current_stock <= product.min_stock_level 
                          ? 'bg-red-500' 
                          : product.current_stock <= product.min_stock_level * 1.5 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((product.current_stock / product.max_stock_level) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {products && products.length > 6 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/products')}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                +{products.length - 6} ürün daha görüntüle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Movements Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Stok Hareketleri (Son 30 Gün)</h3>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockMovements?.movements_by_date || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_quantity" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Movement Types Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Hareket Türleri</h3>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData?.movements_by_type || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {dashboardData?.movements_by_type?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Düşük Stok Uyarıları</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {alerts?.low_stock?.slice(0, 5).map((product: any) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-800">
                      {product.current_stock} / {product.min_stock_level}
                    </p>
                    <p className="text-xs text-yellow-600">
                      Eksik: {product.shortage}
                    </p>
                  </div>
                </div>
              ))}
              {(!alerts?.low_stock || alerts.low_stock.length === 0) && (
                <p className="text-gray-500 text-center py-4">Düşük stok uyarısı yok</p>
              )}
            </div>
          </div>
        </div>

        {/* Out of Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Stokta Olmayan Ürünler</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {alerts?.out_of_stock?.slice(0, 5).map((product: any) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-800">Stok: 0</p>
                    <p className="text-xs text-red-600">Tedarik gerekli</p>
                  </div>
                </div>
              ))}
              {(!alerts?.out_of_stock || alerts.out_of_stock.length === 0) && (
                <p className="text-gray-500 text-center py-4">Stokta olmayan ürün yok</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Son Aktiviteler</h3>
        </div>
        <div className="card-body">
          <div className="flow-root">
            <ul className="-mb-8">
              {dashboardData?.recent_movements?.slice(0, 10).map((movement: any, index: number) => (
                <li key={movement.id}>
                  <div className="relative pb-8">
                    {index !== dashboardData.recent_movements.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          movement.movement_type === 'in' ? 'bg-green-500' : 
                          movement.movement_type === 'out' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}>
                          {movement.movement_type === 'in' ? (
                            <ArrowUp className="h-4 w-4 text-white" />
                          ) : movement.movement_type === 'out' ? (
                            <ArrowDown className="h-4 w-4 text-white" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-white" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">{movement.product_name}</span>
                            {' '}için {movement.quantity} adet {movement.movement_type === 'in' ? 'giriş' : 
                            movement.movement_type === 'out' ? 'çıkış' : 'düzeltme'} yapıldı
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {new Date(movement.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions Modal */}
      {showQuickActions && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowQuickActions(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Hızlı İşlem</h3>
                  <button onClick={() => setShowQuickActions(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                        <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                        <p className="text-sm text-gray-500">Mevcut Stok: {selectedProduct.current_stock} {selectedProduct.unit}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleQuickStockIn}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Stok Girişi Yap
                  </button>
                  <button
                    onClick={handleQuickStockOut}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <Minus className="h-5 w-5 mr-2" />
                    Stok Çıkışı Yap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 