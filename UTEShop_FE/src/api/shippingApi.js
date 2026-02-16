import axiosInstance from './axiosConfig';

/**
 * API cho tích hợp giao hàng
 */
const shippingApi = {
    /**
     * Lấy danh sách tỉnh/thành phố
     * @param {string} provider - Đơn vị vận chuyển (GHN, GHTK, VIETTEL)
     */
    getProvinces: (provider = 'GHN') => {
        return axiosInstance.get(`/shipping/provinces?provider=${provider}`);
    },

    /**
     * Lấy danh sách quận/huyện
     * @param {string} provinceId - ID tỉnh/thành phố
     * @param {string} provider - Đơn vị vận chuyển
     */
    getDistricts: (provinceId, provider = 'GHN') => {
        return axiosInstance.get(`/shipping/districts?provinceId=${provinceId}&provider=${provider}`);
    },

    /**
     * Lấy danh sách phường/xã
     * @param {string} districtId - ID quận/huyện
     * @param {string} provider - Đơn vị vận chuyển
     */
    getWards: (districtId, provider = 'GHN') => {
        return axiosInstance.get(`/shipping/wards?districtId=${districtId}&provider=${provider}`);
    },

    /**
     * Tính phí vận chuyển
     * @param {Object} data - Thông tin tính phí
     * @param {string} data.toDistrictId - ID quận/huyện đích
     * @param {string} data.toWardCode - Mã phường/xã đích
     * @param {number} data.weight - Trọng lượng (gram)
     * @param {number} data.insuranceValue - Giá trị bảo hiểm
     * @param {string} data.provider - Đơn vị vận chuyển
     */
    calculateFee: (data) => {
        return axiosInstance.post('/shipping/calculate-fee', data);
    },

    /**
     * Tạo đơn giao hàng (Admin)
     * @param {Object} data - Thông tin đơn hàng
     * @param {string} data.orderId - ID đơn hàng
     * @param {string} data.toDistrictId - ID quận/huyện đích
     * @param {string} data.toWardCode - Mã phường/xã đích
     * @param {string} data.note - Ghi chú
     * @param {string} data.provider - Đơn vị vận chuyển
     */
    createShippingOrder: (data) => {
        return axiosInstance.post('/shipping/create', data);
    },

    /**
     * Tra cứu trạng thái vận đơn theo mã vận đơn
     * @param {string} trackingCode - Mã vận đơn
     * @param {string} provider - Đơn vị vận chuyển
     */
    trackByCode: (trackingCode, provider = 'GHN') => {
        return axiosInstance.get(`/shipping/track?trackingCode=${trackingCode}&provider=${provider}`);
    },

    /**
     * Tra cứu trạng thái vận đơn theo Order ID
     * @param {string} orderId - ID đơn hàng
     */
    trackByOrderId: (orderId) => {
        return axiosInstance.get(`/shipping/track/${orderId}`);
    },

    /**
     * Hủy đơn giao hàng (Admin)
     * @param {string} orderId - ID đơn hàng
     */
    cancelShippingOrder: (orderId) => {
        return axiosInstance.post(`/shipping/cancel/${orderId}`);
    },
};

export default shippingApi;
