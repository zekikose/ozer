import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Warehouse, User, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast.success('Giriş başarılı!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Giriş başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Logo ve Marka */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mr-3">
              <Warehouse className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-black">SMSTK</h1>
              <p className="text-sm text-gray-600">Stok Yönetim Sistemi</p>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Kullanıcı Adı */}
          <div>
            <div className="flex items-center mb-2">
              <User className="h-4 w-4 text-black mr-2" />
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Kullanıcı Adı
              </label>
            </div>
            <input
              {...register('username', { required: 'Kullanıcı adı gerekli' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Kullanıcı adınızı girin"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          {/* Şifre */}
          <div>
            <div className="flex items-center mb-2">
              <Lock className="h-4 w-4 text-black mr-2" />
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Şifre
              </label>
            </div>
            <div className="relative">
              <input
                {...register('password', { required: 'Şifre gerekli' })}
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Şifrenizi girin"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Giriş Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-3 px-4 rounded-md font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <span>Giriş Yap</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>

          
        </form>

        {/* Alt Bilgi */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © 2025 SMSTK Stok Yönetim Sistemi. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 