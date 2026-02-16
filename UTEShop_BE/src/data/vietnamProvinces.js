/**
 * Fallback data cho tỉnh/quận/phường Việt Nam
 * Sử dụng khi GHN API không khả dụng
 * 
 * Data source: https://provinces.open-api.vn/api/
 */

import axios from 'axios';

const VIETNAM_API_URL = 'https://provinces.open-api.vn/api';

/**
 * Lấy danh sách tỉnh/thành phố từ API công khai
 */
export async function getProvincesFromPublicAPI() {
    try {
        const response = await axios.get(`${VIETNAM_API_URL}/p/`);

        // Convert sang format giống GHN
        return response.data.map(province => ({
            ProvinceID: province.code,
            ProvinceName: province.name,
            Code: province.code.toString(),
        }));
    } catch (error) {
        console.error('Error fetching provinces from public API:', error);
        throw error;
    }
}

/**
 * Lấy danh sách quận/huyện từ API công khai
 */
export async function getDistrictsFromPublicAPI(provinceCode) {
    try {
        const response = await axios.get(`${VIETNAM_API_URL}/p/${provinceCode}?depth=2`);

        // Convert sang format giống GHN
        return response.data.districts.map(district => ({
            DistrictID: district.code,
            DistrictName: district.name,
            ProvinceID: provinceCode,
            Code: district.code.toString(),
        }));
    } catch (error) {
        console.error('Error fetching districts from public API:', error);
        throw error;
    }
}

/**
 * Lấy danh sách phường/xã từ API công khai
 */
export async function getWardsFromPublicAPI(districtCode) {
    try {
        const response = await axios.get(`${VIETNAM_API_URL}/d/${districtCode}?depth=2`);

        // Convert sang format giống GHN
        return response.data.wards.map(ward => ({
            WardCode: ward.code.toString(),
            WardName: ward.name,
            DistrictID: districtCode,
        }));
    } catch (error) {
        console.error('Error fetching wards from public API:', error);
        throw error;
    }
}

/**
 * Lấy thông tin chi tiết địa chỉ (province, district, ward names)
 */
export async function getAddressInfo(provinceCode, districtCode, wardCode) {
    try {
        const response = await axios.get(`${VIETNAM_API_URL}/w/${wardCode}?depth=3`);

        return {
            provinceName: response.data.district.province.name,
            districtName: response.data.district.name,
            wardName: response.data.name,
        };
    } catch (error) {
        console.error('Error fetching address info from public API:', error);
        throw error;
    }
}
