import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  FolderOpen, 
  Truck, 
  Warehouse,
  Users,
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Bell,
  Search,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboardActive = location.pathname === '/dashboard';

  const navigation = [
    { name: 'Kategoriler', href: '/categories', icon: FolderOpen, permission: 'categories:read' },
    { name: 'Tedarikçiler', href: '/suppliers', icon: Truck, permission: 'suppliers:read' },
    { name: 'Müşteriler', href: '/customers', icon: Users, permission: 'customers:read' },
    { name: 'Depolar', href: '/warehouses', icon: Warehouse, permission: 'warehouses:read' },
    { name: 'Stok Hareketleri', href: '/stock-movements', icon: BarChart3, permission: 'stock:read' },
    { name: 'Raporlar', href: '/reports', icon: BarChart3, permission: 'reports:read' },
  ];

  const productsSubMenu = [
    { name: 'Ürün Listesi', href: '/products', icon: Package, permission: 'products:read' },
    { name: 'Stok Girişi', href: '/stock-in', icon: ArrowUp, permission: 'stock:in' },
    { name: 'Stok Çıkışı', href: '/stock-out', icon: ArrowDown, permission: 'stock:out' },
  ];

  const settingsSubMenu = [
    { name: 'Sistem Ayarları', href: '/settings', icon: Settings, permission: 'settings:read' },
    { name: 'Kullanıcı Yönetimi', href: '/user-management', icon: Shield, permission: 'users:read' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isProductsActive = location.pathname === '/products' || 
                          location.pathname === '/stock-in' || 
                          location.pathname === '/stock-out';
  
  const isSettingsActive = location.pathname === '/settings' || 
                          location.pathname === '/user-management';
  
  

  const renderNavigationItem = (item: any) => {
    // Yetki kontrolü
    if (!hasPermission(item.permission)) {
      return null;
    }

    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.name}
        to={item.href}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          isActive
            ? 'bg-primary-100 text-primary-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className="mr-3 h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  const renderProductsMenu = () => {
    return (
      <div className="space-y-1">
        {/* Products Main Menu Item */}
        <button
          onClick={() => setProductsMenuOpen(!productsMenuOpen)}
          className={`group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md ${
            isProductsActive
              ? 'bg-primary-100 text-primary-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center">
            <Package className="mr-3 h-5 w-5" />
            Ürünler
          </div>
          {productsMenuOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Products Submenu */}
        {productsMenuOpen && (
          <div className="ml-4 space-y-1">
            {productsSubMenu.map((item) => {
              // Yetki kontrolü
              if (!hasPermission(item.permission)) {
                return null;
              }

              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSettingsMenu = () => {
    return (
      <div className="space-y-1">
        {/* Settings Main Menu Item */}
        <button
          onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
          className={`group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md ${
            isSettingsActive
              ? 'bg-primary-100 text-primary-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center">
            <Settings className="mr-3 h-5 w-5" />
            Ayarlar
          </div>
          {settingsMenuOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Settings Submenu */}
        {settingsMenuOpen && (
          <div className="ml-4 space-y-1">
            {settingsSubMenu.map((item) => {
              // Yetki kontrolü
              if (!hasPermission(item.permission)) {
                return null;
              }

              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/dashboard" className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors">
              SMSTK
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* Dashboard - En üstte ayrı */}
            {hasPermission('dashboard:read') && (
              <Link
                to="/dashboard"
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/dashboard'
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            )}
            
            {renderProductsMenu()}
            {navigation.map(renderNavigationItem)}
            {renderSettingsMenu()}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <Link to="/dashboard" className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors">
              SMSTK
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* Dashboard - En üstte ayrı */}
            {hasPermission('dashboard:read') && (
              <Link
                to="/dashboard"
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/dashboard'
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            )}
            
            {renderProductsMenu()}
            {navigation.map(renderNavigationItem)}
            {renderSettingsMenu()}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Ara..."
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
              <Bell className="h-6 w-6" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <div className="flex items-center gap-x-3">
                <div className="flex items-center gap-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-x-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:block">Çıkış</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 