import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { SocketProvider } from "./context/SocketContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Modal from "react-modal";

import store from "./redux/store";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/Register";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ForgotPassword from "./pages/ForgotPassword";
import UserProfile from "./pages/Profile/Profile";
import CartPage from "./pages/CartPage";
import NewArrivalsPage from "./pages/NewArrivalsPage";
import OnSalePage from "./pages/OnSalePage";
import CheckoutPage from "./pages/CheckoutPage";

import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import FavoritesPage from "./pages/FavoritesPage";
import ViewedProductsPage from "./pages/ViewedProductsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { OrderTracking } from "./pages/Profile/orderTracking";
import { PurchaseHistory } from "./pages/Profile/purchaseHistory";

// Admin components
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard";
import VoucherManagement from "./pages/Admin/VoucherManagement";
import PointsManagement from "./pages/Admin/PointsManagement";
import OrderManagement from "./pages/Admin/OrderManagement";
import OrderDetailManagement from "./pages/Admin/OrderDetailManagement";
import CustomerManagement from "./pages/Admin/CustomerManagement";
import CustomerOrderDetail from "./pages/Admin/CustomerOrderDetail";
import CategoryManagement from "./pages/Admin/CategoryManagement";
import BrandManagement from "./pages/Admin/BrandManagement";
import ProductManagement from "./pages/Admin/ProductManagement";

import PrivateRoute from "./components/utils/PrivateRoute";
import AdminRoute from "./components/utils/AdminRoute";
Modal.setAppElement("#root");

function App() {
  return (
    <Provider store={store}>
      <SocketProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={<MainLayout />}
              errorElement={<ErrorBoundary />}
            >
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot" element={<ForgotPassword />} />
              <Route path="products" element={<ProductListPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="new-arrivals" element={<NewArrivalsPage />} />
              <Route path="on-sale" element={<OnSalePage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />

              <Route path="payment/success" element={<PaymentSuccessPage />} />
              <Route path="payment/failure" element={<PaymentFailurePage />} />

              <Route path="orders-tracking" element={<OrderTracking />} />
              <Route path="purchase-history" element={<PurchaseHistory />} />

              {/* Protected routes for favorites and viewed products */}
              <Route
                path="favorites"
                element={
                  <PrivateRoute>
                    <FavoritesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="viewed-products"
                element={
                  <PrivateRoute>
                    <ViewedProductsPage />
                  </PrivateRoute>
                }
              />

              {/* Route Profile được bảo vệ - chỉ đăng nhập mới vào được */}
              <Route
                path="profile"
                element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                }
              />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="orders/:orderId" element={<OrderDetailManagement />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="customers/:customerId/orders" element={<CustomerOrderDetail />} />
              <Route path="vouchers" element={<VoucherManagement />} />
              <Route path="points" element={<PointsManagement />} />

              {/* Category Management Routes */}
              <Route
                path="categories/level-1"
                element={<CategoryManagement />}
              />

              {/* Brand Management Route */}
              <Route path="brands" element={<BrandManagement />} />

              {/* Product Management Route */}
              <Route path="products" element={<ProductManagement />} />
            </Route>
          </Routes>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </SocketProvider>
    </Provider>
  );
}

export default App;
