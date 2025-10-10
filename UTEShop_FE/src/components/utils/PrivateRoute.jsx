import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();

  // Nếu chưa đăng nhập, chuyển hướng đến trang login
  if (!token) {
    return <Navigate 
      to="/login" 
      state={{ from: location }} 
      replace 
    />;
  }

  // Nếu yêu cầu quyền admin nhưng user không phải admin
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate 
      to="/" 
      replace 
    />;
  }

  // Nếu đã đăng nhập (và có quyền admin nếu cần), hiển thị component con
  return children;
};

export default PrivateRoute;
