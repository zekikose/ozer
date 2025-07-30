import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  AlertTriangle, 
  Banknote,
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  Eye
} from 'lucide-react';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'normal'>('all');

  const { data: dashboardData, isLoading, error } = useQuery('dashboard', async () => {
    const response = await axios.get('/api/dashboard/overview');
    return response.data;
  });

  const { data: products } = useQuery('products', async () => {
    const response = await axios.get('/api/products');
    return response.data.products;
  });

  // Filter products based on search and stock filter
  const filteredProducts = products?.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStockFilter = true;
    switch (stockFilter) {
      case 'low':
        matchesStockFilter = product.current_stock <= product.min_stock_level && product.current_stock > 0;
        break;
      case 'out':
        matchesStockFilter = product.current_stock === 0;
        break;
      case 'normal':
        matchesStockFilter = product.current_stock > product.min_stock_level;
        break;
      default:
        matchesStockFilter = true;
    }
    
    return matchesSearch && matchesStockFilter;
  }) || [];

  const getStockStatus = (product: any) => {
    if (product.current_stock === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    if (product.current_stock <= product.min_stock_level) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { status: 'normal', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  };

  const getStockPercentage = (product: any) => {
    if (product.max_stock_level === 0) return 0;
    return Math.min((product.current_stock / product.max_stock_level) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard verileri yüklenirken hata oluştu.</h3>
          <p className="text-gray-600">Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stok Yönetimi</h1>
          <p className="text-gray-600 mt-1">Tüm ürünlerin stok durumunu takip edin</p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Ürün</p>
                <p className="text-xl font-bold text-gray-900">{dashboardData?.overview?.total_products || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Düşük Stok</p>
                <p className="text-xl font-bold text-gray-900">{dashboardData?.overview?.low_stock_products || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Değer</p>
                <p className="text-xl font-bold text-gray-900">₺{(dashboardData?.overview?.total_stock_value || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ürün adı veya SKU ile arayın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Stock Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stockFilter === 'all' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStockFilter('normal')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stockFilter === 'normal' 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stockFilter === 'low' 
                  ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Düşük
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stockFilter === 'out' 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tükendi
            </button>
          </div>
        </div>
      </div>
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/stock-in')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Stok Girişi
          </button>
          
          <button
            onClick={() => navigate('/stock-out')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowDown className="h-4 w-4" />
            Stok Çıkışı
          </button>
          
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Package className="h-4 w-4" />
            Ürün Yönetimi
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok Durumu
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Birim Fiyat
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toplam Değer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product: any) => {
                const stockStatus = getStockStatus(product);
                const stockPercentage = getStockPercentage(product);
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                          <Package className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.category?.name || 'Kategori Yok'}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 font-mono">{product.sku}</span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color} ${stockStatus.border}`}>
                            {stockStatus.status === 'out' ? 'Tükendi' : 
                             stockStatus.status === 'low' ? 'Düşük' : 'Normal'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {product.current_stock}
                          </span>
                        </div>
                        
                        {/* Stock Progress Bar */}
                        <div className="flex-1 max-w-24">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                stockStatus.status === 'out' ? 'bg-red-500' :
                                stockStatus.status === 'low' ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${stockPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        Min: {product.min_stock_level} | Max: {product.max_stock_level}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">₺{(parseFloat(product.unit_price) || 0).toFixed(2)}</span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        ₺{((product.current_stock || 0) * (parseFloat(product.unit_price) || 0)).toFixed(2)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate('/stock-in', { 
                            state: { selectedProduct: product }
                          })}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                        >
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Giriş
                        </button>
                        
                        <button
                          onClick={() => navigate('/stock-out', { 
                            state: { selectedProduct: product }
                          })}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                          <ArrowDown className="h-3 w-3 mr-1" />
                          Çıkış
                        </button>
                        
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Detay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ürün bulunamadı</h3>
            <p className="text-gray-500">Arama kriterlerinize uygun ürün bulunmuyor.</p>
          </div>
        )}
      </div>


    </div>
  );
};

export default Dashboard; 