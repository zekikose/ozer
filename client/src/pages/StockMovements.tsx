import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Filter, ArrowUp, ArrowDown, AlertTriangle, Search, Calendar, Package, RefreshCw } from 'lucide-react';
import axios from 'axios';
import SelectBox2 from '../components/SelectBox2';

const StockMovements: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    product_id: '',
    movement_type: '',
    start_date: '',
    end_date: '',
    search: ''
  });

  const { data: movementsData, isLoading, refetch } = useQuery(
    ['stockMovements', currentPage, filters],
    async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.product_id && { product_id: filters.product_id }),
        ...(filters.movement_type && { movement_type: filters.movement_type }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
        ...(filters.search && { search: filters.search }),
      });
      
      const response = await axios.get(`/api/stock/movements?${params}`);
      return response.data;
    }
  );

  const { data: products } = useQuery('products', async () => {
    const response = await axios.get('/api/products?limit=1000');
    return response.data.products;
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'out':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'adjustment':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in':
        return { label: 'Giriş', color: 'bg-green-100 text-green-800' };
      case 'out':
        return { label: 'Çıkış', color: 'bg-red-100 text-red-800' };
      case 'adjustment':
        return { label: 'Düzeltme', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const clearFilters = () => {
    setFilters({
      product_id: '',
      movement_type: '',
      start_date: '',
      end_date: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  return (
    <div className="space-y-6 overflow-visible">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stok Hareketleri</h1>
            <p className="text-gray-600">Stok giriş, çıkış ve düzeltme işlemleri</p>
          </div>
          <div className="flex space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {movementsData?.summary?.total_in || 0}
              </div>
              <div className="text-sm text-gray-600">Toplam Giriş</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {movementsData?.summary?.total_out || 0}
              </div>
              <div className="text-sm text-gray-600">Toplam Çıkış</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {movementsData?.summary?.total_movements || 0}
              </div>
              <div className="text-sm text-gray-600">Toplam Hareket</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Arama ve Filtreleme</h3>
          </div>
        </div>
        
        <div className="p-6 overflow-visible">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                placeholder="Ürün adı, SKU, referans numarası veya notlarda ara..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Ara
                </button>
              </div>
            </div>
          </form>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 overflow-visible">
            {/* Product Filter */}
            <div className="space-y-2 overflow-visible">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <Package className="h-4 w-4 mr-2 text-gray-500" />
                Ürün
              </label>
              <SelectBox2
                options={[
                  { value: '', label: 'Tüm Ürünler' },
                  ...(products?.map((product: any) => ({
                    value: product.id.toString(),
                    label: `${product.name} (${product.sku})`
                  })) || [])
                ]}
                value={filters.product_id}
                onChange={(value) => setFilters({ ...filters, product_id: value.toString() })}
                placeholder="Tüm Ürünler"
              />
            </div>

            {/* Movement Type Filter */}
            <div className="space-y-2 overflow-visible">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <ArrowUp className="h-4 w-4 mr-2 text-gray-500" />
                Hareket Tipi
              </label>
              <SelectBox2
                options={[
                  { value: '', label: 'Tüm Hareketler' },
                  { value: 'in', label: 'Giriş' },
                  { value: 'out', label: 'Çıkış' },
                  { value: 'adjustment', label: 'Düzeltme' }
                ]}
                value={filters.movement_type}
                onChange={(value) => setFilters({ ...filters, movement_type: value.toString() })}
                placeholder="Tüm Hareketler"
              />
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2 overflow-visible">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                placeholder="Başlangıç Tarihi"
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2 overflow-visible">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                placeholder="Bitiş Tarihi"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Filtreleri Temizle
              </button>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Filtrele
              </button>
            </div>
            
            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {movementsData?.pagination?.total_items || 0} sonuç bulundu
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Stok Hareketleri Listesi</h3>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miktar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birim Fiyat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tedarikçi/Müşteri</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notlar</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movementsData?.movements?.map((movement: any) => (
                      <tr key={movement.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(movement.created_at).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(movement.created_at).toLocaleTimeString('tr-TR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{movement.product_name}</div>
                            <div className="text-sm text-gray-500">{movement.sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getMovementIcon(movement.movement_type)}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMovementTypeLabel(movement.movement_type).color}`}>
                              {getMovementTypeLabel(movement.movement_type).label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            movement.movement_type === 'in' 
                              ? 'text-green-600' 
                              : movement.movement_type === 'out' 
                                ? 'text-red-600' 
                                : 'text-yellow-600'
                          }`}>
                            {movement.movement_type === 'in' ? '+' : movement.movement_type === 'out' ? '-' : '±'}
                            {movement.quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₺{parseFloat(movement.unit_price).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            movement.movement_type === 'in' 
                              ? 'text-green-600' 
                              : movement.movement_type === 'out' 
                                ? 'text-red-600' 
                                : 'text-yellow-600'
                          }`}>
                            {movement.movement_type === 'in' ? '+' : movement.movement_type === 'out' ? '-' : '±'}
                            ₺{parseFloat(movement.total_amount).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {movement.movement_type === 'in' ? (
                              <span className="text-blue-600 font-medium">
                                {movement.supplier_name || '-'}
                              </span>
                            ) : (
                              <span className="text-green-600 font-medium">
                                {movement.customer_name || '-'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {movement.user_name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {movement.notes || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {movementsData?.pagination && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Toplam {movementsData.pagination.total_items} hareket
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Önceki
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-md">
                      Sayfa {currentPage} / {movementsData.pagination.total_pages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === movementsData.pagination.total_pages}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}

              {/* Summary Statistics */}
              {movementsData?.movements && movementsData.movements.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Filter className="h-5 w-5 mr-2 text-blue-600" />
                      Filtrelenmiş Sonuçların Özeti
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Movement Counts */}
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Toplam Hareket</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {movementsData.summary?.total_movements || 0}
                            </p>
                          </div>
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Filter className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Giriş İşlemleri</p>
                            <p className="text-2xl font-bold text-green-600">
                              {movementsData.summary?.total_in || 0}
                            </p>
                          </div>
                          <div className="p-2 bg-green-100 rounded-lg">
                            <ArrowUp className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Çıkış İşlemleri</p>
                            <p className="text-2xl font-bold text-red-600">
                              {movementsData.summary?.total_out || 0}
                            </p>
                          </div>
                          <div className="p-2 bg-red-100 rounded-lg">
                            <ArrowDown className="h-6 w-6 text-red-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Düzeltme İşlemleri</p>
                            <p className="text-2xl font-bold text-yellow-600">
                              {movementsData.summary?.total_adjustment || 0}
                            </p>
                          </div>
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-yellow-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Amount and Quantity Totals */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Miktar Toplamları</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Giriş Miktarı:</span>
                            <span className="text-sm font-medium text-green-600">
                              +{movementsData.movements
                                .filter((m: any) => m.movement_type === 'in')
                                .reduce((sum: number, m: any) => sum + parseInt(m.quantity), 0)
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Çıkış Miktarı:</span>
                            <span className="text-sm font-medium text-red-600">
                              -{movementsData.movements
                                .filter((m: any) => m.movement_type === 'out')
                                .reduce((sum: number, m: any) => sum + parseInt(m.quantity), 0)
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Düzeltme Miktarı:</span>
                            <span className="text-sm font-medium text-yellow-600">
                              ±{movementsData.movements
                                .filter((m: any) => m.movement_type === 'adjustment')
                                .reduce((sum: number, m: any) => sum + parseInt(m.quantity), 0)
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Tutar Toplamları</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Giriş Tutarı:</span>
                            <span className="text-sm font-medium text-green-600">
                              +₺{movementsData.movements
                                .filter((m: any) => m.movement_type === 'in')
                                .reduce((sum: number, m: any) => sum + parseFloat(m.total_amount), 0)
                                .toFixed(2)
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Çıkış Tutarı:</span>
                            <span className="text-sm font-medium text-red-600">
                              -₺{movementsData.movements
                                .filter((m: any) => m.movement_type === 'out')
                                .reduce((sum: number, m: any) => sum + parseFloat(m.total_amount), 0)
                                .toFixed(2)
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Düzeltme Tutarı:</span>
                            <span className="text-sm font-medium text-yellow-600">
                              ±₺{movementsData.movements
                                .filter((m: any) => m.movement_type === 'adjustment')
                                .reduce((sum: number, m: any) => sum + parseFloat(m.total_amount), 0)
                                .toFixed(2)
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockMovements; 