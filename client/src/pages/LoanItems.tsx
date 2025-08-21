import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowUpDown,
  CheckCircle,
  Clock,
  Package,
  User,
  FileText
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface LoanItem {
  id: number;
  product_name: string;
  product_sku: string;
  customer_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  reference_number: string;
  notes: string;
  exit_date: string;
  return_date: string | null;
  status: 'active' | 'returned';
  created_at: string;
}

const LoanItems: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    customer_id: '',
    product_id: '',
    search: ''
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch loan items
  const { data: loansData, isLoading, refetch } = useQuery(
    ['loanItems', currentPage, filters],
    async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.status && { status: filters.status }),
        ...(filters.customer_id && { customer_id: filters.customer_id }),
        ...(filters.product_id && { product_id: filters.product_id }),
        ...(filters.search && { search: filters.search })
      });
      const response = await axios.get(`/api/stock/loans?${params}`);
      return response.data;
    }
  );

  // Return loan item mutation
  const returnLoanMutation = useMutation(
    async ({ id, return_date, notes }: { id: number; return_date: string; notes: string }) => {
      const response = await axios.post(`/api/stock/loans/${id}/return`, {
        return_date,
        notes
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loanItems');
        queryClient.invalidateQueries('products');
        queryClient.invalidateQueries('stockMovements');
        toast.success('Emanet iade edildi');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'İade işlemi başarısız');
      },
    }
  );

  const clearFilters = () => {
    setFilters({
      status: '',
      customer_id: '',
      product_id: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleReturn = (loan: LoanItem) => {
    const return_date = new Date().toISOString().slice(0, 16);
    const notes = prompt('İade notu (opsiyonel):') || '';
    
    if (window.confirm(`${loan.product_name} ürününü iade etmek istediğinizden emin misiniz?`)) {
      returnLoanMutation.mutate({
        id: loan.id,
        return_date,
        notes
      });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Aktif
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          İade Edildi
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emanet Listesi</h1>
          <p className="text-gray-600 mt-1">Emanet verilen ürünleri takip edin</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            Filtreler
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <Search className="h-4 w-4 mr-2 text-gray-500" />
              Arama
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
              placeholder="Ürün, müşteri, referans..."
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <ArrowUpDown className="h-4 w-4 mr-2 text-gray-500" />
              Durum
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
            >
              <option value="">Tümü</option>
              <option value="active">Aktif</option>
              <option value="returned">İade Edildi</option>
            </select>
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
            {loansData?.pagination?.total || 0} emanet bulundu
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Emanet Listesi</h3>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miktar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emanet Tarihi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loansData?.loans?.map((loan: LoanItem) => (
                      <tr key={loan.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              <Package className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{loan.product_name}</div>
                              <div className="text-sm text-gray-500">{loan.product_sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                              <User className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="text-sm font-medium text-gray-900">{loan.customer_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{loan.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">₺{parseFloat(loan.total_amount?.toString() || '0').toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(loan.exit_date).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(loan.exit_date).toLocaleTimeString('tr-TR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(loan.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                                                                                     <button
                              onClick={() => {
                                // Navigate to receipt page
                                navigate(`/loan-receipt/${loan.id}`);
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                              title="Tutanak Görüntüle"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Tutanak
                            </button>
                            
                            {loan.status === 'active' && (
                              <button
                                onClick={() => handleReturn(loan)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                                title="İade Et"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                İade Et
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {loansData?.pagination && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Toplam {loansData.pagination.total} emanet
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Önceki
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Sayfa {currentPage} / {loansData.pagination.total_pages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === loansData.pagination.total_pages}
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
      </div>
    </div>
  );
};

export default LoanItems;
