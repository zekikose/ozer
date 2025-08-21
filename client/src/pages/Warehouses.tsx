import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface WarehouseForm {
  name: string;
  location: string;
  description: string;
}

const Warehouses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseForm>();

  // Fetch warehouses
  const { data: warehouses, isLoading } = useQuery('warehouses', async () => {
    const response = await axios.get('/api/warehouses');
    return response.data.warehouses;
  }, {
    onError: (error: any) => {
      console.error('Warehouse fetch error:', error);
      if (error.response) {
        toast.error('Depo verileri yüklenirken hata oluştu');
      } else if (error.request) {
        toast.error('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        toast.error('Beklenmeyen bir hata oluştu.');
      }
    }
  });

  // Add/Edit warehouse mutation
  const warehouseMutation = useMutation(
    async (warehouseData: WarehouseForm) => {
      if (editingWarehouse) {
        const response = await axios.put(`/api/warehouses/${editingWarehouse.id}`, warehouseData);
        return response.data;
      } else {
        const response = await axios.post('/api/warehouses', warehouseData);
        return response.data;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('warehouses');
        toast.success(editingWarehouse ? 'Depo başarıyla güncellendi' : 'Depo başarıyla eklendi');
        setShowModal(false);
        reset();
        setEditingWarehouse(null);
      },
      onError: (error: any) => {
        console.error('Warehouse mutation error:', error);
        if (error.response) {
          // Server responded with error
          toast.error(error.response.data?.error || 'Depo işlemi başarısız');
        } else if (error.request) {
          // Network error
          toast.error('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
        } else {
          // Other error
          toast.error('Beklenmeyen bir hata oluştu.');
        }
      },
    }
  );

  // Delete warehouse mutation
  const deleteMutation = useMutation(
    async (warehouseId: number) => {
      await axios.delete(`/api/warehouses/${warehouseId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('warehouses');
        toast.success('Depo başarıyla silindi');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Depo silinirken hata oluştu');
      },
    }
  );

  const onSubmit = async (data: WarehouseForm) => {
    setIsSubmitting(true);
    try {
      await warehouseMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (warehouse?: any) => {
    setShowModal(true);
    if (warehouse) {
      setEditingWarehouse(warehouse);
      reset({
        name: warehouse.name,
        location: warehouse.location || '',
        description: warehouse.description || ''
      });
    } else {
      setEditingWarehouse(null);
      reset();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWarehouse(null);
    reset();
  };

  const handleDelete = (warehouseId: number) => {
    if (window.confirm('Bu depoyu silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(warehouseId);
    }
  };

  const filteredWarehouses = warehouses?.filter((warehouse: any) =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (warehouse.location && warehouse.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Depolar</h1>
          <p className="text-gray-600">Depo yönetimi</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Depo
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Depo ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warehouses Table */}
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Depo Adı</th>
                      <th className="table-header-cell">Konum</th>
                      <th className="table-header-cell">Açıklama</th>
                      <th className="table-header-cell">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredWarehouses?.map((warehouse: any) => (
                      <tr key={warehouse.id}>
                        <td className="table-cell">
                          <div className="font-medium text-gray-900">{warehouse.name}</div>
                        </td>
                        <td className="table-cell">
                          {warehouse.location || '-'}
                        </td>
                        <td className="table-cell">
                          {warehouse.description || '-'}
                        </td>
                        <td className="table-cell">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(warehouse)}
                              className="btn-icon btn-icon-primary"
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(warehouse.id)}
                              className="btn-icon btn-icon-danger"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredWarehouses?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Henüz depo bulunmuyor.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingWarehouse ? 'Depo Düzenle' : 'Yeni Depo Ekle'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Depo Adı *
                </label>
                <input
                  {...register('name', { required: 'Depo adı gerekli' })}
                  type="text"
                  className="input"
                  placeholder="Depo adını girin"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konum
                </label>
                <input
                  {...register('location')}
                  type="text"
                  className="input"
                  placeholder="Depo konumunu girin"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input"
                  placeholder="Depo açıklamasını girin"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? 'Kaydediliyor...' : (editingWarehouse ? 'Güncelle' : 'Ekle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouses; 