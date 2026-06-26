import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { SocketProvider } from "./context/SocketContext";
import { AuthModalProvider } from "./context/AuthModalContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import store from "./redux/store";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/Register";
import VerifyOtpPage from "./pages/VerifyOtp";
import CompleteRegistrationPage from "./pages/CompleteRegistration";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyResetOtpPage from "./pages/VerifyResetOtp";
import ResetPasswordPage from "./pages/ResetPassword";
import UserProfile from "./pages/Profile/Profile";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";

import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import FavoritesPage from "./pages/FavoritesPage";
import ViewedProductsPage from "./pages/ViewedProductsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { OrderTracking } from "./pages/Profile/orderTracking";
import { PurchaseHistory } from "./pages/Profile/purchaseHistory";
import OrderDetail from "./pages/OrderDetail";

// Admin components
import PrivateRoute from "./components/utils/PrivateRoute";
import VouchersPage from "./pages/VouchersPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";

function App() {
  return (
    <Provider store={store}>
      <SocketProvider>
        <AuthModalProvider>
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
              <Route path="verify-otp" element={<VerifyOtpPage />} />
              <Route path="complete-registration" element={<CompleteRegistrationPage />} />
              <Route path="forgot" element={<ForgotPassword />} />
              <Route path="verify-reset-otp" element={<VerifyResetOtpPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="products" element={<ProductListPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />

              <Route path="payment/success" element={<PaymentSuccessPage />} />
              <Route path="payment/failure" element={<PaymentFailurePage />} />

              <Route
                path="orders-tracking"
                element={
                  <PrivateRoute>
                    <OrderTracking />
                  </PrivateRoute>
                }
              />
              <Route
                path="orders/:orderId"
                element={
                  <PrivateRoute>
                    <OrderDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="purchase-history"
                element={
                  <PrivateRoute>
                    <PurchaseHistory />
                  </PrivateRoute>
                }
              />
              <Route path="vouchers" element={<VouchersPage />} />

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

              {/* Public route - Privacy Policy (required by Facebook) */}
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

          </Routes>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
        </AuthModalProvider>
      </SocketProvider>
    </Provider>
  );
}

export default App;
