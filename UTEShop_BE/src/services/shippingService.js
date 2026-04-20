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

    hasRequiredShippingAddressIds({ toDistrictId, toWardCode } = {}) {
        return Boolean(toDistrictId && toWardCode);
    }

    assertRequiredShippingAddressIds(payload = {}, context = 'shipping request') {
        if (!this.hasRequiredShippingAddressIds(payload)) {
            throw new Error(`Missing required address IDs (${context}): toDistrictId and toWardCode`);
        }
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
            if (error.provider === 'GHTK') {
                console.error('📋 GHTK provider error details:', {
                    code: error.code,
                    logId: error.logId,
                    message: error.message,
                });
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

    normalizeAddressName(name) {
        if (!name) return name;

        return name
            .replace(/^(Tỉnh|Thành phố|TP\.?)\s+/i, '')
            .replace(/^(Huyện|Quận|Thị xã|Thành phố)\s+/i, '')
            .replace(/^(Xã|Phường|Thị trấn)\s+/i, '')
            .trim();
    }

    async resolveAddressNames(
        { province, district, ward, toDistrictId, toWardCode },
        { keepMissingDistrict = false } = {}
    ) {
        const provinceName = typeof province === 'string' ? province.trim() : province;
        const districtName = typeof district === 'string' ? district.trim() : district;
        const wardName = typeof ward === 'string' ? ward.trim() : ward;

        if (provinceName && districtName && wardName) {
            return {
                provinceName,
                districtName,
                wardName,
            };
        }

        // Với một số địa bàn mới, dữ liệu suy diễn quận/huyện từ API công khai
        // có thể không tương thích với bảng địa chỉ nội bộ của GHTK.
        // Nếu FE đã có tỉnh + phường/xã nhưng thiếu quận/huyện, giữ nguyên dữ liệu gốc.
        if (keepMissingDistrict && provinceName && wardName && !districtName) {
            return {
                provinceName,
                districtName,
                wardName,
            };
        }

        if (!this.hasRequiredShippingAddressIds({ toDistrictId, toWardCode })) {
            return {
                provinceName,
                districtName,
                wardName,
            };
        }

        try {
            const addressInfo = await getAddressInfo(null, toDistrictId, toWardCode);

            return {
                provinceName: provinceName || addressInfo.provinceName,
                districtName: districtName || addressInfo.districtName,
                wardName: wardName || addressInfo.wardName,
            };
        } catch (error) {
            console.warn('⚠️ resolveAddressNames fallback used because address lookup failed:', {
                toDistrictId,
                toWardCode,
                reason: error.message,
            });

            return {
                provinceName,
                districtName,
                wardName,
            };
        }
    }

    async calculateGHTKFee(params) {
        const { pickAddress, address, province, district, ward, weight, value, toDistrictId, toWardCode } = params;

        this.assertRequiredShippingAddressIds({ toDistrictId, toWardCode }, 'calculateGHTKFee');

        console.log('🔍 calculateGHTKFee received params:', { province, district, ward, toDistrictId, toWardCode });

        // Ưu tiên dùng text nếu có, không cần convert
        const resolvedAddress = await this.resolveAddressNames(
            {
                province,
                district,
                ward,
                toDistrictId,
                toWardCode,
            },
            { keepMissingDistrict: false }
        );
        const provinceName = resolvedAddress.provinceName;
        const districtName = resolvedAddress.districtName;
        const wardName = resolvedAddress.wardName;
        const fallbackDistrictName = typeof process.env.GHTK_FALLBACK_DISTRICT === 'string'
            ? process.env.GHTK_FALLBACK_DISTRICT.trim()
            : '';
        const effectiveDistrictName = districtName || fallbackDistrictName;

        if (!provinceName || !effectiveDistrictName || !wardName) {
            throw new Error('Không thể xác định đầy đủ địa chỉ giao hàng từ dữ liệu hiện có');
        }

        if (!districtName && fallbackDistrictName) {
            console.warn('⚠️ Using GHTK_FALLBACK_DISTRICT for fee calculation:', fallbackDistrictName);
        }

        console.log('✅ Resolved address names:', {
            provinceName,
            districtName: effectiveDistrictName,
            wardName,
        });

        console.log('📦 GHTK Fee Request:', {
            pick_address: pickAddress || process.env.GHTK_PICK_ADDRESS,
            address: address || 'default',
            province: provinceName,
            district: effectiveDistrictName,
            ward: wardName,
            weight: weight || 1000,
            value: value || 0,
        });

        const normalizedProvince = this.normalizeAddressName(provinceName);
        const normalizedDistrict = this.normalizeAddressName(effectiveDistrictName);
        const normalizedWard = this.normalizeAddressName(wardName);

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

        this.assertRequiredShippingAddressIds({ toDistrictId, toWardCode }, 'createGHTKOrder');

        // Nếu có province text thì dùng, không cần convert
        const resolvedAddress = await this.resolveAddressNames(
            {
                province,
                district,
                ward,
                toDistrictId,
                toWardCode,
            },
            { keepMissingDistrict: true }
        );
        const provinceName = resolvedAddress.provinceName;
        const districtName = resolvedAddress.districtName;
        const wardName = resolvedAddress.wardName;

        if (!provinceName || !wardName) {
            throw new Error('Không thể xác định đầy đủ địa chỉ để tạo vận đơn GHTK');
        }

        // GHTK yêu cầu giá trị hàng hóa (order.value) trong khoảng 1..50,000,000 VND.
        // Đơn có tổng thanh toán 0đ do dùng điểm/voucher vẫn cần khai báo giá trị hàng hợp lệ.
        const declaredGoodsValue = this.calculateGHTKDeclaredGoodsValue(items, totalPrice);
        console.log('📦 GHTK request financials:', {
            orderId,
            codAmount: codAmount || 0,
            declaredGoodsValue,
            payableTotal: totalPrice,
        });

        const response = await axios.post(
            `${this.ghtkConfig.apiUrl}/shipment/order`,
            {
                products: items.map(item => ({
                    name: item.name,
                    // GHTK create-order expects product weight in kg.
                    weight: this.normalizeWeightForGHTKProduct(item.weight),
                    quantity: item.quantity,
                    price: item.price,
                    ...(item.length ? { length: item.length } : {}),
                    ...(item.width ? { width: item.width } : {}),
                    ...(item.height ? { height: item.height } : {}),
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
                    province: provinceName,
                    district: districtName || '',
                    ward: wardName,
                    hamlet: 'Khác', // GHTK yêu cầu bắt buộc, dùng "Khác" nếu không có thông tin cụ thể
                    is_freeship: codAmount > 0 ? '0' : '1',
                    pick_money: codAmount || 0,
                    note: note || '',
                    value: declaredGoodsValue,
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

        if (!response.data?.success || !response.data?.order) {
            const ghtkError = new Error(response.data?.message || 'GHTK create order failed');
            ghtkError.provider = 'GHTK';
            ghtkError.code = response.data?.error_code;
            ghtkError.logId = response.data?.log_id;
            ghtkError.raw = response.data;
            throw ghtkError;
        }

        return {
            success: response.data.success,
            provider: 'GHTK',
            trackingCode: response.data.order.label,
            status: String(response.data.order.status || '1'),
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

        const rawOrder = response.data.order || {};
        const normalizedStatus = String(rawOrder.status ?? '');
        const logs = this.extractTrackingLogs(rawOrder, 'GHTK');

        return {
            success: response.data.success,
            provider: 'GHTK',
            trackingCode,
            status: normalizedStatus,
            statusText: this.mapGHTKStatus(normalizedStatus),
            logs,
            lastUpdatedAt: this.resolveTrackingTimestamp(rawOrder) || logs[0]?.time || null,
            data: rawOrder,
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

    isDeliveredShippingStatus(provider, status) {
        const providerName = (provider || '').toUpperCase();
        const normalizedStatus = String(status ?? '');

        if (providerName === 'GHTK') {
            return ['7', '11', '12', '45'].includes(normalizedStatus);
        }

        if (providerName === 'GHN') {
            return ['delivered', 'DELIVERED'].includes(normalizedStatus);
        }

        return normalizedStatus.toLowerCase() === 'delivered';
    }

    resolveTrackingTimestamp(payload = {}) {
        const candidates = [
            payload.updated_at,
            payload.updatedAt,
            payload.action_time,
            payload.time,
            payload.timestamp,
            payload.created,
            payload.created_at,
            payload.createdAt,
            payload.date,
        ];

        const resolved = candidates.find(Boolean);
        return resolved ? new Date(resolved).toISOString() : null;
    }

    extractTrackingLogs(rawOrder = {}, provider = '') {
        const logCollections = [
            rawOrder.logs,
            rawOrder.log,
            rawOrder.status_logs,
            rawOrder.statusLogs,
            rawOrder.timeline,
            rawOrder.histories,
            rawOrder.history,
            rawOrder.journeys,
        ];

        const sourceLogs = logCollections.find(Array.isArray) || [];

        const normalizedLogs = sourceLogs
            .map((entry) => this.normalizeTrackingLog(entry, provider))
            .filter(Boolean)
            .sort((a, b) => {
                const timeA = a.time ? new Date(a.time).getTime() : 0;
                const timeB = b.time ? new Date(b.time).getTime() : 0;
                return timeB - timeA;
            });

        if (normalizedLogs.length > 0) {
            return normalizedLogs;
        }

        const fallbackStatus = String(rawOrder.status ?? '');
        const fallbackTime = this.resolveTrackingTimestamp(rawOrder);

        if (!fallbackStatus && !fallbackTime) {
            return [];
        }

        return [
            {
                status: fallbackStatus,
                message: provider.toUpperCase() === 'GHTK'
                    ? this.mapGHTKStatus(fallbackStatus)
                    : fallbackStatus,
                time: fallbackTime,
                location: rawOrder.current_warehouse || rawOrder.currentWarehouse || rawOrder.location || '',
            },
        ];
    }

    normalizeTrackingLog(entry = {}, provider = '') {
        const status = String(
            entry.status ??
            entry.state ??
            entry.action_code ??
            entry.code ??
            ''
        );

        const message = entry.message ||
            entry.description ||
            entry.reason ||
            entry.action ||
            entry.status_text ||
            entry.status_name ||
            (provider.toUpperCase() === 'GHTK' ? this.mapGHTKStatus(status) : status);

        const time = this.resolveTrackingTimestamp(entry);
        const location = entry.location ||
            entry.area ||
            entry.hub_name ||
            entry.hub ||
            entry.warehouse ||
            entry.address ||
            '';

        if (!status && !message && !time) {
            return null;
        }

        return {
            status,
            message: message || 'Cập nhật trạng thái vận chuyển',
            time,
            location,
        };
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
            const itemWeight = this.normalizeWeightToGram(item.weight);
            return total + (itemWeight * item.quantity);
        }, 0);
    }

    normalizeWeightToGram(weight) {
        const numericWeight = Number(weight);
        if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
            return 500;
        }

        // Nếu nhập theo kg (ví dụ 0.5, 1, 2.3) thì quy về gram.
        if (numericWeight > 0 && numericWeight <= 50) {
            return Math.round(numericWeight * 1000);
        }

        return Math.round(numericWeight);
    }

    normalizeWeightForGHTKProduct(weight) {
        const numericWeight = Number(weight);
        if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
            return 0.5;
        }

        // Quy ước nội bộ: nếu > 50 thì đang là gram, chuyển sang kg.
        if (numericWeight > 50) {
            return Number((numericWeight / 1000).toFixed(3));
        }

        // Nếu <= 50 thì coi là kg.
        return Number(numericWeight.toFixed(3));
    }

    calculateGHTKDeclaredGoodsValue(items = [], orderTotal = 0) {
        const productsValue = items.reduce((sum, item) => {
            const unitPrice = Number(item?.price || 0);
            const quantity = Number(item?.quantity || 0);
            if (!Number.isFinite(unitPrice) || !Number.isFinite(quantity)) {
                return sum;
            }
            return sum + (unitPrice * quantity);
        }, 0);

        const fallbackValue = Number(orderTotal || 0);
        const rawValue = productsValue > 0 ? productsValue : fallbackValue;

        // Range hợp lệ theo thông báo lỗi từ GHTK: 1 đ <= GTHH <= 50,000,000 đ
        if (rawValue <= 0) {
            return 1;
        }

        return Math.min(50000000, Math.round(rawValue));
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
