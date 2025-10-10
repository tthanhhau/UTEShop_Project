import React from 'react';
import { useSelector } from 'react-redux';
import AdminLogin from '../../pages/Admin/AdminLogin';

const AdminRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

  // Nếu chưa đăng nhập hoặc không phải admin, hiển thị trang đăng nhập admin
  if (!token || !user || user.role !== 'admin') {
    return <AdminLogin />;
  }

  // Nếu đã đăng nhập và là admin, hiển thị component con
  return children;
};

export default AdminRoute;
