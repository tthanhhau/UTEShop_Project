'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaChartBar, FaCube, FaShoppingCart, FaUsers, FaTicketAlt,
  FaStar, FaChartLine, FaCog, FaBars, FaSignOutAlt,
  FaChevronLeft, FaChevronRight, FaAngleRight, FaComments
} from 'react-icons/fa';
import NotificationBell from './NotificationBell';

interface MenuItem {
  path?: string;
  icon: any;
  label: string;
  exact?: boolean;
  hasSubmenu?: boolean;
  key?: string;
  submenu?: { path: string; label: string }[];
}

const menuStructure: MenuItem[] = [
  { path: '/admin', icon: FaChartBar, label: 'Bảng điều khiển', exact: true },
  {
    key: 'productManagement',
    icon: FaCube,
    label: 'Quản lý Sản phẩm',
    hasSubmenu: true,
    submenu: [
      { path: '/admin/categories', label: 'Danh mục cấp 1' },
      { path: '/admin/brands', label: 'Thương hiệu' },
      { path: '/admin/products', label: 'Sản phẩm' },
    ],
  },
  { path: '/admin/orders', icon: FaShoppingCart, label: 'Quản lý đơn hàng' },
  { path: '/admin/customers', icon: FaUsers, label: 'Quản lý khách hàng' },
  { path: '/admin/comments', icon: FaComments, label: 'Quản lý Đánh giá' },
  { path: '/admin/vouchers', icon: FaTicketAlt, label: 'Quản lý Voucher' },
  { path: '/admin/points', icon: FaStar, label: 'Quản lý Điểm tích lũy' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    productManagement: false,
  });
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('adminUser');

      // Check if token exists, if not redirect to login
      if (!storedToken) {
        router.push('/login');
        return;
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, []);

  // Listen for storage changes to handle logout from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminToken' && !e.newValue) {
        // Token was removed, redirect to login
        router.push('/login');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [router]);

  // Auto-expand menu when accessing submenu items
  useEffect(() => {
    for (let item of menuStructure) {
      if (item.hasSubmenu && item.submenu) {
        const isInSubmenu = item.submenu.some((subItem) =>
          pathname.startsWith(subItem.path)
        );
        if (isInSubmenu && item.key && !expandedMenus[item.key]) {
          setExpandedMenus((prev) => ({
            ...prev,
            [item.key as string]: true,
          }));
        }
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/login');
  };

  const isActive = (path?: string, exact = false) => {
    if (!path) return false;
    if (exact) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const isMenuItemActive = (item: MenuItem) => {
    if (item.hasSubmenu && item.submenu) {
      return item.submenu.some((subItem) => pathname.startsWith(subItem.path));
    }
    return isActive(item.path, item.exact);
  };

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const getPageTitle = () => {
    for (let item of menuStructure) {
      if (item.hasSubmenu && item.submenu) {
        const subItem = item.submenu.find((sub) => pathname.startsWith(sub.path));
        if (subItem) return subItem.label;
      } else if (item.path && (item.exact ? pathname === item.path : pathname.startsWith(item.path))) {
        return item.label;
      }
    }
    return 'Admin Panel';
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'
          } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-purple-600 to-indigo-600 relative">
          {/* Logo area: Chỉ hiện icon logo khi thu gọn, hiện cả chữ khi mở rộng */}
          {sidebarCollapsed ? (
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg hover:bg-white/30 transition-all duration-200 border border-white/20">
              <FaCube className="text-white text-2xl" />
            </div>
          ) : (
            <h1 className="text-xl font-bold text-white">Fashion Admin</h1>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 p-1 rounded transition-colors duration-200 hidden lg:block"
            title={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {sidebarCollapsed ? <FaChevronRight className="text-sm" /> : <FaChevronLeft className="text-sm" />}
          </button>
        </div>

        {/* Menu dưới header, luôn hiển thị đủ icon các tab khi thu gọn */}
        <nav className="mt-8">
          <div className="px-2 space-y-1">
            {menuStructure.map((item, index) => (
              <div key={item.key || item.path || index}>
                {item.hasSubmenu ? (
                  <button
                    onClick={() => !sidebarCollapsed && item.key && toggleSubmenu(item.key)}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2 py-3 rounded-lg transition-colors duration-200 ${isMenuItemActive(item)
                      ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    title={item.label}
                  >
                    <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
                      <item.icon className={`text-2xl ${sidebarCollapsed ? '' : 'mr-3'} ${isMenuItemActive(item) ? 'text-purple-600' : ''}`} />
                      {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && item.key && (
                      <>
                        {expandedMenus[item.key] ? (
                          <svg className="w-4 h-4 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <FaChevronRight className="text-sm" />
                        )}
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.path || '#'}
                    className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-2 py-3 rounded-lg transition-colors duration-200 ${isActive(item.path, item.exact)
                      ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    title={item.label}
                  >
                    <item.icon className={`text-2xl ${sidebarCollapsed ? '' : 'mr-3'} ${isActive(item.path, item.exact) ? 'text-purple-600' : ''}`} />
                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </Link>
                )}

                {item.hasSubmenu && item.submenu && expandedMenus[item.key as string] && !sidebarCollapsed && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.path}
                        href={subItem.path}
                        className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${isActive(subItem.path)
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        <FaAngleRight className="mr-2 text-xs text-gray-400" />
                        <span className="text-sm">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
      >
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                className="lg:hidden mr-4 p-2 rounded-md hover:bg-gray-100"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <FaBars className="text-gray-600" />
              </button>
              <h2 className="text-2xl font-semibold text-gray-800">{getPageTitle()}</h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <svg
                  className="w-5 h-5 absolute left-3 top-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <NotificationBell />

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  {user?.name?.[0] || 'A'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">Quản trị viên</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 p-2 rounded-full hover:bg-gray-100"
                  title="Đăng xuất"
                >
                  <FaSignOutAlt />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}






