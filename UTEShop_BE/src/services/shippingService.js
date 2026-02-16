import axios from 'axios';
import {
    getProvincesFromPublicAPI,
    getDistrictsFromPublicAPI,
    getWardsFromPublicAPI,
    getAddressInfo
} from '../data/vietnamProvinces.js';

/**
 * Service tích hợp API giao hàng từ bên thứ 3
 * Hỗ trợ: GHN (Giao Hàng Nhanh), GHTK (Giao Hàng Tiết Kiệm), Viettel Post
 */
class ShippingService {
    constructor() {
        // Cấu hình cho GHN (Giao Hàng Nhanh)
        this.ghnConfig = {
            apiUrl: process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api',
            token: process.env.GHN_TOKEN,
            shopId: process.env.GHN_SHOP_ID,
        };

        // Cấu hình cho GHTK (Giao Hàng Tiết Kiệm)
        this.ghtkConfig = {
            apiUrl: process.env.GHTK_API_URL || 'https://services.giaohangtietkiem.vn/services',
            token: process.env.GHTK_TOKEN,
        };

        // Cấu hình cho Viettel Post
        this.viettelConfig = {
            apiUrl: process.env.VIETTEL_API_URL || 'https://partner.viettelpost.vn/v2',
            username: process.env.VIETTEL_USERNAME,
            password: process.env.VIETTEL_PASSWORD,
        };

        // Provider mặc định
        this.defaultProvider = process.env.SHIPPING_PROVIDER || 'GHN';
    }

    /**
     * Tính phí vận chuyển
     * @param {Object} params - Thông tin tính phí
     * @param {string} provider - Đơn vị vận chuyển (GHN, GHTK, VIETTEL)
     */
    async calculateShippingFee(params, provider = this.defaultProvider) {
        try {
            switch (provider.toUpperCase()) {
                case 'GHN':
                    return await this.calculateGHNFee(params);
                case 'GHTK':
                    return await this.calculateGHTKFee(params);
                case 'VIETTEL':
                    return await this.calculateViettelFee(params);
                default:
                    throw new Error(`Unsupported shipping provider: ${provider}`);
            }
        } catch (error) {
            console.error(`Error calculating shipping fee with ${provider}:`, error.message);
            throw error;
        }
    }

    /**
     * Tạo đơn giao hàng
     * @param {Object} orderData - Thông tin đơn hàng
     * @param {string} provider - Đơn vị vận chuyển
     */
    async createShippingOrder(orderData, provider = this.defaultProvider) {
        try {
            console.log('📦 Creating shipping order with provider:', provider);
            console.log('📦 Order data:', JSON.stringify(orderData, null, 2));

            switch (provider.toUpperCase()) {
                case 'GHN':
                    return await this.createGHNOrder(orderData);
                case 'GHTK':
                    return await this.createGHTKOrder(orderData);
                case 'VIETTEL':
                    return await this.createViettelOrder(orderData);
                default:
                    throw new Error(`Unsupported shipping provider: ${provider}`);
            }
        } catch (error) {
            console.error(`❌ Error creating shipping order with ${provider}:`, error.response?.data || error.message);
            if (error.response?.data) {
                console.error('📋 Full error response:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    /**
     * Tra cứu trạng thái đơn hàng
     * @param {string} trackingCode - Mã vận đơn
     * @param {string} provider - Đơn vị vận chuyển
     */
    async trackOrder(trackingCode, provider = this.defaultProvider) {
        try {
            switch (provider.toUpperCase()) {
                case 'GHN':
                    return await this.trackGHNOrder(trackingCode);
                case 'GHTK':
                    return await this.trackGHTKOrder(trackingCode);
                case 'VIETTEL':
                    return await this.trackViettelOrder(trackingCode);
                default:
                    throw new Error(`Unsupported shipping provider: ${provider}`);
            }
        } catch (error) {
            console.error(`Error tracking order with ${provider}:`, error.message);
            throw error;
        }
    }

    /**
     * Hủy đơn giao hàng
     * @param {string} trackingCode - Mã vận đơn
     * @param {string} provider - Đơn vị vận chuyển
     */
    async cancelShippingOrder(trackingCode, provider = this.defaultProvider) {
        try {
            switch (provider.toUpperCase()) {
                case 'GHN':
                    return await this.cancelGHNOrder(trackingCode);
                case 'GHTK':
                    return await this.cancelGHTKOrder(trackingCode);
                case 'VIETTEL':
                    return await this.cancelViettelOrder(trackingCode);
                default:
                    throw new Error(`Unsupported shipping provider: ${provider}`);
            }
        } catch (error) {
            console.error(`Error cancelling order with ${provider}:`, error.message);
            throw error;
        }
    }

    // ==================== GHN (Giao Hàng Nhanh) ====================

    async calculateGHNFee(params) {
        const { toDistrictId, toWardCode, weight, length, width, height, insuranceValue } = params;

        const response = await axios.post(
            `${this.ghnConfig.apiUrl}/v2/shipping-order/fee`,
            {
                service_type_id: 2, // 2: E-commerce Delivery
                from_district_id: parseInt(process.env.GHN_FROM_DISTRICT_ID),
                to_district_id: parseInt(toDistrictId),
                to_ward_code: toWardCode,
                weight: weight || 1000, // gram
                length: length || 20, // cm
                width: width || 20,
                height: height || 10,
                insurance_value: insuranceValue || 0,
            },
            {
                headers: {
                    'Token': this.ghnConfig.token,
                    'ShopId': this.ghnConfig.shopId,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            success: true,
            provider: 'GHN',
            fee: response.data.data.total,
            serviceFee: response.data.data.service_fee,
            insuranceFee: response.data.data.insurance_fee,
            expectedDeliveryTime: response.data.data.expected_delivery_time,
        };
    }

    async createGHNOrder(orderData) {
        const {
            orderId,
            customerName,
            customerPhone,
            shippingAddress,
            toDistrictId,
            toWardCode,
            items,
            totalPrice,
            codAmount,
            note,
        } = orderData;

        const response = await axios.post(
            `${this.ghnConfig.apiUrl}/v2/shipping-order/create`,
            {
                payment_type_id: codAmount > 0 ? 2 : 1, // 1: Người gửi trả, 2: Người nhận trả (COD)
                note: note || '',
                required_note: 'KHONGCHOXEMHANG', // CHOXEMHANGKHONGTHU, CHOTHUHANG, KHONGCHOXEMHANG
                to_name: customerName,
                to_phone: customerPhone,
                to_address: shippingAddress,
                to_ward_code: toWardCode,
                to_district_id: parseInt(toDistrictId),
                cod_amount: codAmount || 0,
                weight: this.calculateTotalWeight(items),
                length: 20,
                width: 20,
                height: 10,
                insurance_value: totalPrice,
                service_type_id: 2,
                items: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
            },
            {
                headers: {
                    'Token': this.ghnConfig.token,
                    'ShopId': this.ghnConfig.shopId,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            success: true,
            provider: 'GHN',
            trackingCode: response.data.data.order_code,
            expectedDeliveryTime: response.data.data.expected_delivery_time,
            totalFee: response.data.data.total_fee,
            data: response.data.data,
        };
    }

    async trackGHNOrder(trackingCode) {
        const response = await axios.post(
            `${this.ghnConfig.apiUrl}/v2/shipping-order/detail`,
            {
                order_code: trackingCode,
            },
            {
                headers: {
                    'Token': this.ghnConfig.token,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            success: true,
            provider: 'GHN',
            trackingCode,
            status: response.data.data.status,
            statusText: this.mapGHNStatus(response.data.data.status),
            logs: response.data.data.log || [],
            data: response.data.data,
        };
    }

    async cancelGHNOrder(trackingCode) {
        const response = await axios.post(
            `${this.ghnConfig.apiUrl}/v2/switch-status/cancel`,
            {
                order_codes: [trackingCode],
            },
            {
                headers: {
                    'Token': this.ghnConfig.token,
                    'ShopId': this.ghnConfig.shopId,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            success: true,
            provider: 'GHN',
            message: 'Order cancelled successfully',
            data: response.data,
        };
    }

    mapGHNStatus(status) {
        const statusMap = {
            'ready_to_pick': 'Chờ lấy hàng',
            'picking': 'Đang lấy hàng',
            'cancel': 'Đã hủy',
            'money_collect_picking': 'Đang thu tiền người gửi',
            'picked': 'Đã lấy hàng',
            'storing': 'Hàng nhập kho',
            'transporting': 'Đang vận chuyển',
            'sorting': 'Đang phân loại',
            'delivering': 'Đang giao hàng',
            'delivered': 'Đã giao hàng',
            'delivery_fail': 'Giao hàng thất bại',
            'waiting_to_return': 'Chờ trả hàng',
            'return': 'Trả hàng',
            'return_transporting': 'Đang vận chuyển trả',
            'return_sorting': 'Đang phân loại trả',
            'returning': 'Đang trả hàng',
            'return_fail': 'Trả hàng thất bại',
            'returned': 'Đã trả hàng',
            'exception': 'Đơn hàng ngoại lệ',
            'damage': 'Hàng bị hư hỏng',
            'lost': 'Hàng thất lạc',
        };
        return statusMap[status] || status;
    }

    // ==================== GHTK (Giao Hàng Tiết Kiệm) ====================

    async calculateGHTKFee(params) {
        const { pickAddress, address, province, district, ward, weight, value, toDistrictId, toWardCode } = params;

        console.log('🔍 calculateGHTKFee received params:', { province, district, ward, toDistrictId, toWardCode });

        // Ưu tiên dùng text nếu có, không cần convert
        let provinceName = province;
        let districtName = district;
        let wardName = ward;

        // Chỉ convert nếu không có text
        if (!provinceName && toDistrictId && toWardCode) {
            console.log('⚠️ No text provided, attempting to convert from IDs...');
            try {
                // Lấy tên từ API công khai
                const wards = await getWardsFromPublicAPI(toDistrictId);
                const wardData = wards.find(w => w.WardCode === toWardCode.toString());

                if (wardData) {
                    wardName = wardData.WardName;

                    // Lấy district name
                    const districts = await getDistrictsFromPublicAPI(toDistrictId);
                    const districtData = districts.find(d => d.DistrictID === parseInt(toDistrictId));

                    if (districtData) {
                        districtName = districtData.DistrictName;

                        // Lấy province name
                        const provinces = await getProvincesFromPublicAPI();
                        const provinceData = provinces.find(p => p.ProvinceID === districtData.ProvinceID);

                        if (provinceData) {
                            provinceName = provinceData.ProvinceName;
                        }
                    }
                }

                console.log('✅ Converted address:', { provinceName, districtName, wardName });
            } catch (error) {
                console.error('❌ Error converting address:', error.message);
                throw new Error('Không thể chuyển đổi địa chỉ');
            }
        } else {
            console.log('✅ Using provided text names:', { provinceName, districtName, wardName });
        }

        console.log('📦 GHTK Fee Request:', {
            pick_address: pickAddress || process.env.GHTK_PICK_ADDRESS,
            address: address || 'default',
            province: provinceName,
            district: districtName,
            ward: wardName,
            weight: weight || 1000,
            value: value || 0,
        });

        // Chuẩn hóa tên địa chỉ cho GHTK (bỏ "Tỉnh", "Thành phố", "TP", "Huyện", "Xã", "Phường")
        const normalizeAddress = (name) => {
            if (!name) return name;
            return name
                .replace(/^(Tỉnh|Thành phố|TP\.?)\s+/i, '')
                .replace(/^(Huyện|Quận|Thị xã|Thành phố)\s+/i, '')
                .replace(/^(Xã|Phường|Thị trấn)\s+/i, '')
                .trim();
        };

        const normalizedProvince = normalizeAddress(provinceName);
        const normalizedDistrict = normalizeAddress(districtName);
        const normalizedWard = normalizeAddress(wardName);

        console.log('🔄 Normalized address:', {
            province: `${provinceName} -> ${normalizedProvince}`,
            district: `${districtName} -> ${normalizedDistrict}`,
            ward: `${wardName} -> ${normalizedWard}`,
        });

        const response = await axios.get(
            `${this.ghtkConfig.apiUrl}/shipment/fee`,
            {
                params: {
                    pick_address: pickAddress || process.env.GHTK_PICK_ADDRESS,
                    pick_province: process.env.GHTK_PICK_PROVINCE,
                    pick_district: process.env.GHTK_PICK_DISTRICT,
                    pick_ward: process.env.GHTK_PICK_WARD,
                    address: address || 'default',
                    province: normalizedProvince,
                    district: normalizedDistrict,
                    ward: normalizedWard,
                    weight: weight || 1000,
                    value: value || 0,
                },
                headers: {
                    'Token': this.ghtkConfig.token,
                },
            }
        );

        console.log('📦 GHTK Response:', JSON.stringify(response.data, null, 2));

        // Kiểm tra response
        if (!response.data.success) {
            throw new Error(response.data.message || 'GHTK API returned error');
        }

        if (!response.data.fee) {
            throw new Error('GHTK API did not return fee data');
        }

        return {
            success: response.data.success,
            provider: 'GHTK',
            fee: response.data.fee.fee,
            insuranceFee: response.data.fee.insurance_fee,
            deliveryOption: response.data.fee.delivery_option,
        };
    }

    /**
     * Helper: Lấy thông tin ward để convert sang GHTK format
     * Dùng API công khai của Việt Nam
     */
    async getWardInfo(districtId, wardCode) {
        try {
            console.log('🔍 Getting ward info for:', { districtId, wardCode });

            // Dùng API công khai để lấy thông tin địa chỉ
            const addressInfo = await getAddressInfo(null, districtId, wardCode);

            console.log('✅ Ward info retrieved:', addressInfo);
            return addressInfo;
        } catch (error) {
            console.error('❌ Error getting ward info:', error.message);
            throw error;
        }
    }

    async createGHTKOrder(orderData) {
        const {
            orderId,
            customerName,
            customerPhone,
            shippingAddress,
            province,
            district,
            ward,
            toDistrictId,
            toWardCode,
            items,
            totalPrice,
            codAmount,
            note,
        } = orderData;

        // Nếu có province text thì dùng, không cần convert
        let provinceName = province;
        let districtName = district;
        let wardName = ward;

        // Chuẩn hóa tên địa chỉ (bỏ tiền tố)
        const normalizeAddress = (name) => {
            if (!name) return name;
            return name
                .replace(/^(Tỉnh|Thành phố|TP\.?)\s+/i, '')
                .replace(/^(Huyện|Quận|Thị xã|Thành phố)\s+/i, '')
                .replace(/^(Xã|Phường|Thị trấn)\s+/i, '')
                .trim();
        };

        const response = await axios.post(
            `${this.ghtkConfig.apiUrl}/shipment/order`,
            {
                products: items.map(item => ({
                    name: item.name,
                    weight: item.weight || 0.5,
                    quantity: item.quantity,
                    price: item.price,
                })),
                order: {
                    id: orderId,
                    pick_name: process.env.GHTK_PICK_NAME,
                    pick_address: process.env.GHTK_PICK_ADDRESS,
                    pick_province: process.env.GHTK_PICK_PROVINCE,
                    pick_district: process.env.GHTK_PICK_DISTRICT,
                    pick_ward: process.env.GHTK_PICK_WARD,
                    pick_tel: process.env.GHTK_PICK_TEL,
                    tel: customerPhone,
                    name: customerName,
                    address: shippingAddress,
                    province: normalizeAddress(provinceName),
                    district: normalizeAddress(districtName),
                    ward: normalizeAddress(wardName),
                    hamlet: 'Khác', // GHTK yêu cầu bắt buộc, dùng "Khác" nếu không có thông tin cụ thể
                    is_freeship: codAmount > 0 ? '0' : '1',
                    pick_money: codAmount || 0,
                    note: note || '',
                    value: totalPrice,
                },
            },
            {
                headers: {
                    'Token': this.ghtkConfig.token,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('📦 GHTK Create Order Response:', JSON.stringify(response.data, null, 2));

        return {
            success: response.data.success,
            provider: 'GHTK',
            trackingCode: response.data.order.label,
            estimatedPickTime: response.data.order.estimated_pick_time,
            estimatedDeliverTime: response.data.order.estimated_deliver_time,
            fee: response.data.order.fee,
            data: response.data.order,
        };
    }

    async trackGHTKOrder(trackingCode) {
        const response = await axios.get(
            `${this.ghtkConfig.apiUrl}/shipment/v2/${trackingCode}`,
            {
                headers: {
                    'Token': this.ghtkConfig.token,
                },
            }
        );

        return {
            success: response.data.success,
            provider: 'GHTK',
            trackingCode,
            status: response.data.order.status,
            statusText: this.mapGHTKStatus(response.data.order.status),
            data: response.data.order,
        };
    }

    async cancelGHTKOrder(trackingCode) {
        const response = await axios.post(
            `${this.ghtkConfig.apiUrl}/shipment/cancel/${trackingCode}`,
            {},
            {
                headers: {
                    'Token': this.ghtkConfig.token,
                },
            }
        );

        return {
            success: response.data.success,
            provider: 'GHTK',
            message: response.data.message,
        };
    }

    mapGHTKStatus(status) {
        const statusMap = {
            '-1': 'Hủy đơn hàng',
            '1': 'Chưa tiếp nhận',
            '2': 'Đã tiếp nhận',
            '3': 'Đã lấy hàng',
            '4': 'Đã nhập kho',
            '5': 'Đã xuất kho',
            '6': 'Đang giao hàng',
            '7': 'Đã giao hàng',
            '8': 'Đã trả hàng',
            '9': 'Không lấy được hàng',
            '10': 'Delay lấy hàng',
            '11': 'Đã đối soát',
            '12': 'Đã trả tiền',
            '13': 'Đang chuyển hoàn',
            '20': 'Đang chuyển hàng',
            '21': 'Đã nhập kho trả',
            '123': 'Shipper báo đã lấy hàng',
            '127': 'Shipper (nhân viên lấy/giao hàng) báo không lấy được hàng',
            '128': 'Shipper báo delay lấy hàng',
            '45': 'Shipper báo đã giao hàng',
            '49': 'Shipper báo giao hàng thất bại',
        };
        return statusMap[status] || status;
    }

    // ==================== Viettel Post ====================

    async calculateViettelFee(params) {
        // Viettel Post yêu cầu login trước để lấy token
        // Implement theo API docs của Viettel Post
        throw new Error('Viettel Post integration coming soon');
    }

    async createViettelOrder(orderData) {
        throw new Error('Viettel Post integration coming soon');
    }

    async trackViettelOrder(trackingCode) {
        throw new Error('Viettel Post integration coming soon');
    }

    async cancelViettelOrder(trackingCode) {
        throw new Error('Viettel Post integration coming soon');
    }

    // ==================== Helper Methods ====================

    calculateTotalWeight(items) {
        // Tính tổng trọng lượng (gram)
        // Mặc định mỗi sản phẩm 500g nếu không có thông tin
        return items.reduce((total, item) => {
            const itemWeight = item.weight || 500;
            return total + (itemWeight * item.quantity);
        }, 0);
    }

    /**
     * Lấy danh sách tỉnh/thành phố
     * Dùng API công khai của Việt Nam (không cần token)
     */
    async getProvinces() {
        try {
            // Dùng API công khai thay vì GHN
            return await getProvincesFromPublicAPI();
        } catch (error) {
            console.error('Error fetching provinces:', error.message);
            throw new Error('Không thể tải danh sách tỉnh/thành phố');
        }
    }

    /**
     * Lấy danh sách quận/huyện
     * Dùng API công khai của Việt Nam (không cần token)
     */
    async getDistricts(provinceId) {
        try {
            // Dùng API công khai thay vì GHN
            return await getDistrictsFromPublicAPI(provinceId);
        } catch (error) {
            console.error('Error fetching districts:', error.message);
            throw new Error('Không thể tải danh sách quận/huyện');
        }
    }

    /**
     * Lấy danh sách phường/xã
     * Dùng API công khai của Việt Nam (không cần token)
     */
    async getWards(districtId) {
        try {
            // Dùng API công khai thay vì GHN
            return await getWardsFromPublicAPI(districtId);
        } catch (error) {
            console.error('Error fetching wards:', error.message);
            throw new Error('Không thể tải danh sách phường/xã');
        }
    }
}

export default new ShippingService();
