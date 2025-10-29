import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "../utils/formatPrice";
import api from "../api/axiosConfig";

const VouchersPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Computed vouchers với phân trang
  const vouchers = userProfile?.voucherClaims
    ? userProfile.voucherClaims.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await api.get("/user/profile");
        setUserProfile(response.data);

        // Tính toán tổng số trang
        const totalVouchers = response.data.voucherClaims?.length || 0;
        setTotal(totalVouchers);
        setTotalPages(Math.ceil(totalVouchers / itemsPerPage));
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Có lỗi xảy ra khi tải thông tin voucher"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Handle page change and update vouchers display
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Tính toán thông tin phân trang
  const totalItems = total;
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-semibold mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-4">
            Bạn cần đăng nhập để xem voucher của bạn
          </p>
          <Link
            to="/login"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Voucher của bạn</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Có lỗi xảy ra: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Voucher của bạn</h1>
        <div className="text-gray-600">
          {total > 0 ? (
            <span>
              Hiển thị {startItem}-{endItem} trong tổng số {total} voucher
            </span>
          ) : (
            <span>0 voucher</span>
          )}
        </div>
      </div>

      {vouchers.length === 0 ? (
        <div className="text-center py-12">
          <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold mb-2">
            Bạn chưa có voucher nào
          </h2>
          <p className="text-gray-600 mb-6">
            Hãy tích điểm hoặc viết đánh giá để nhận voucher
          </p>
          <Link
            to="/products"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Xem sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((voucher) => (
            <div
              key={voucher.voucherCode}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 overflow-hidden"
            >
              <div className="p-4 border-b border-dashed border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    {voucher.source === "REVIEW" && "Voucher từ đánh giá"}
                    {voucher.source === "ADMIN_GIFT" && "Voucher quà tặng"}
                    {voucher.source === "PROMOTION" && "Voucher khuyến mãi"}
                    {voucher.source === "LOYALTY" && "Voucher thành viên"}
                    {voucher.source === "OTHER" && "Voucher khác"}
                  </span>
                  <Ticket className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {voucher.voucherCode}
                </h3>
                <div className="text-sm text-gray-600">
                  Số lần sử dụng: {voucher.claimCount}
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Lần cuối sử dụng:{" "}
                  {new Date(voucher.lastClaimed).toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Trước
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-2 border rounded-lg transition-colors ${
                  pageNum === currentPage
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            )
          )}

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Sau
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VouchersPage;
