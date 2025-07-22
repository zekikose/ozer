import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Shield, 
  Mail, 
  Calendar,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import SelectBox2 from '../components/SelectBox2';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'stock_keeper' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface UserForm {
  username: string;
  email: string;
  full_name: string;
  password?: string;
  role: 'admin' | 'manager' | 'stock_keeper' | 'viewer';
}

const UserManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserForm>({
    defaultValues: {
      role: 'viewer' // Varsayılan rol
    },
    mode: 'onChange'
  });

  // Fetch users
  const { data: users, isLoading, refetch } = useQuery('users', async () => {
    const response = await axios.get('/api/users');
    return response.data;
  });

  // Create/Update user mutation
  const createUserMutation = useMutation(
    async (data: UserForm) => {
      if (editingUser) {
        const updateData = { ...data };
        if (!data.password) delete updateData.password;
        return axios.put(`/api/users/${editingUser.id}`, updateData);
      } else {
        return axios.post('/api/users', data);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success(editingUser ? 'Kullanıcı güncellendi!' : 'Kullanıcı oluşturuldu!');
        closeModal();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Bir hata oluştu!');
      }
    }
  );

  // Delete user mutation
  const deleteUserMutation = useMutation(
    async (userId: number) => {
      return axios.delete(`/api/users/${userId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Kullanıcı silindi!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Bir hata oluştu!');
      }
    }
  );

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation(
    async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      return axios.patch(`/api/users/${userId}/status`, { is_active: isActive });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Kullanıcı durumu güncellendi!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Bir hata oluştu!');
      }
    }
  );

  const roleOptions = [
    { value: 'admin', label: 'Admin - Tüm yetkilere sahip' },
    { value: 'manager', label: 'Yönetici - Çoğu işlemi yapabilir' },
    { value: 'stock_keeper', label: 'Stok Görevlisi - Stok işlemleri' },
    { value: 'viewer', label: 'Görüntüleyici - Sadece görüntüleme' }
  ];

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setValue('username', user.username);
      setValue('email', user.email);
      setValue('full_name', user.full_name);
      setValue('role', user.role);
      setValue('password', '');
    } else {
      setEditingUser(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
    setShowPassword(false);
  };

  const onSubmit = (data: UserForm) => {
    if (!data.role) {
      toast.error('Lütfen bir rol seçin');
      return;
    }
    createUserMutation.mutate(data);
  };

  const handleDelete = (userId: number) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const filteredUsers = users?.filter((user: User) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'bg-red-100 text-red-800', label: 'Admin' },
      manager: { color: 'bg-blue-100 text-blue-800', label: 'Yönetici' },
      stock_keeper: { color: 'bg-green-100 text-green-800', label: 'Stok Görevlisi' },
      viewer: { color: 'bg-gray-100 text-gray-800', label: 'Görüntüleyici' }
    };
    const config = roleConfig[role as keyof typeof roleConfig];
    
    // Eğer config undefined ise varsayılan değer kullan
    if (!config) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {role || 'Bilinmeyen'}
        </span>
      );
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Aktif' : 'Pasif'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600">Sistem kullanıcılarını yönetin ve yetkilendirin</p>
        </div>
        {hasPermission('users:create') && (
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kullanıcı
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredUsers.length} kullanıcı bulundu
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Kullanıcı</th>
                <th className="table-header">E-posta</th>
                <th className="table-header">Rol</th>
                <th className="table-header">Durum</th>
                <th className="table-header">Kayıt Tarihi</th>
                <th className="table-header">Son Giriş</th>
                <th className="table-header">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="table-cell">
                    {getStatusBadge(user.is_active)}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-500">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('tr-TR')
                        : 'Hiç giriş yapmamış'
                      }
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {hasPermission('users:read') && (
                        <button className="text-gray-600 hover:text-gray-900">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {hasPermission('users:update') && (
                        <button 
                          onClick={() => openModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {hasPermission('users:delete') && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {hasPermission('users:update') && (
                        <button
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          className={`${
                            user.is_active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {user.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9998] overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-[9999]">
              <div className="bg-white px-4 pt-5 pb-8 sm:p-6 sm:pb-8 overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
                  </h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
                    <input
                      type="text"
                      {...register('username', { required: 'Kullanıcı adı gerekli' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!!editingUser}
                    />
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-posta</label>
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'E-posta gerekli',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Geçerli bir e-posta adresi girin'
                        }
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                    <input
                      type="text"
                      {...register('full_name', { required: 'Ad soyad gerekli' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {editingUser ? 'Yeni Şifre (Boş bırakın değiştirmek istemiyorsanız)' : 'Şifre'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password', { 
                          required: !editingUser ? 'Şifre gerekli' : false,
                          minLength: editingUser ? undefined : { value: 6, message: 'Şifre en az 6 karakter olmalı' },
                          validate: (value) => {
                            if (editingUser && !value) return true; // Boş bırakılabilir
                            if (!editingUser && !value) return 'Şifre gerekli';
                            if (value && value.length < 6) return 'Şifre en az 6 karakter olmalı';
                            return true;
                          }
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <SelectBox2
                      options={roleOptions}
                      value={watch('role') || ''}
                      onChange={(value) => setValue('role', value as any)}
                      placeholder="Kullanıcı rolünü seçin"
                      className="mt-1"
                      required={true}
                      error={!!errors.role}
                    />
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={createUserMutation.isLoading}
                  className="btn-primary sm:ml-3 sm:w-auto"
                >
                  {createUserMutation.isLoading ? 'Kaydediliyor...' : (editingUser ? 'Güncelle' : 'Oluştur')}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary sm:mt-0 sm:w-auto"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 