import api from "./axiosConfig";

// Tạo yêu cầu hoàn trả
export const createReturnRequest = async (orderId, reason, customReason = "") => {
    const response = await api.post("/returns", {
        orderId,
        reason,
        customReason,
    });
    return response.data;
};

// Lấy danh sách yêu cầu hoàn trả của user
export const getUserReturnRequests = async () => {
    const response = await api.get("/returns/my-requests");
    return response.data;
};

// Kiểm tra đơn hàng có thể hoàn trả không
export const checkReturnEligibility = async (orderId) => {
    const response = await api.get(`/returns/check/${orderId}`);
    return response.data;
};

// Các lý do hoàn trả
export const RETURN_REASONS = [
    { value: "wrong_item", label: "Giao sai sản phẩm" },
    { value: "damaged", label: "Sản phẩm bị hư hỏng" },
    { value: "not_as_described", label: "Không đúng mô tả" },
    { value: "size_not_fit", label: "Size không vừa" },
    { value: "quality_issue", label: "Chất lượng không tốt" },
    { value: "changed_mind", label: "Đổi ý không muốn mua" },
    { value: "other", label: "Lý do khác" },
];
