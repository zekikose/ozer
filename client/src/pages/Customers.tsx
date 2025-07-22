import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Edit, Trash2, X, User } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>();

  // Fetch customers
  const { data: customers, isLoading } = useQuery('customers', async () => {
    const response = await axios.get('/api/customers');
    return response.data.customers;
  });

  // Add/Edit customer mutation
  const customerMutation = useMutation(
    async (customerData: CustomerForm) => {
      if (editingCustomer) {
        const response = await axios.put(`/api/customers/${editingCustomer.id}`, customerData);
        return response.data;
      } else {
        const response = await axios.post('/api/customers', customerData);
        return response.data;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        toast.success(editingCustomer ? 'Müşteri başarıyla güncellendi' : 'Müşteri başarıyla eklendi');
        setShowModal(false);
        reset();
        setEditingCustomer(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Müşteri işlemi başarısız');
      },
    }
  );

  // Delete customer mutation
  const deleteMutation = useMutation(
    async (customerId: number) => {
      await axios.delete(`/api/customers/${customerId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        toast.success('Müşteri başarıyla silindi');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Müşteri silinirken hata oluştu');
      },
    }
  );

  const onSubmit = async (data: CustomerForm) => {
    setIsSubmitting(true);
    try {
      await customerMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (customer?: any) => {
    setShowModal(true);
    if (customer) {
      setEditingCustomer(customer);
      reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || ''
      });
    } else {
      setEditingCustomer(null);
      reset();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    reset();
  };

  const handleDelete = (customerId: number) => {
    if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(customerId);
    }
  };

  const filteredCustomers = customers?.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
          <p className="text-gray-600">Müşteri yönetimi</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Müşteri
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
                  placeholder="Müşteri ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
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
                      <th className="table-header-cell">Müşteri</th>
                      <th className="table-header-cell">İletişim</th>
                      <th className="table-header-cell">Adres</th>
                      <th className="table-header-cell">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredCustomers?.map((customer: any) => (
                      <tr key={customer.id}>
                        <td className="table-cell">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                              <User className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">ID: {customer.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="text-sm">
                                <span className="text-gray-500">E-posta:</span> {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="text-sm">
                                <span className="text-gray-500">Telefon:</span> {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {customer.address || '-'}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(customer)}
                              className="btn-icon btn-icon-primary"
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(customer.id)}
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

              {filteredCustomers?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Henüz müşteri bulunmuyor.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri Adı *
                </label>
                <input
                  {...register('name', { required: 'Müşteri adı gerekli' })}
                  type="text"
                  className="input"
                  placeholder="Müşteri adını girin"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                <input
                  {...register('email', { 
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Geçerli bir e-posta adresi girin'
                    }
                  })}
                  type="email"
                  className="input"
                  placeholder="E-posta adresini girin"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input"
                  placeholder="Telefon numarasını girin"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres
                </label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="input"
                  placeholder="Adres bilgisini girin"
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
                  {isSubmitting ? 'Kaydediliyor...' : (editingCustomer ? 'Güncelle' : 'Ekle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers; 