import { useState, useEffect } from 'react';
import shippingApi from '@/api/shippingApi';

/**
 * Component chọn địa chỉ giao hàng và tính phí vận chuyển
 */
function ShippingAddressSelector({ onAddressChange, onFeeCalculated }) {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);

    const [shippingFee, setShippingFee] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load danh sách tỉnh/thành khi component mount
    useEffect(() => {
        loadProvinces();
    }, []);

    // Load danh sách quận/huyện khi chọn tỉnh
    useEffect(() => {
        if (selectedProvince) {
            loadDistricts(selectedProvince.ProvinceID);
            setDistricts([]);
            setWards([]);
            setSelectedDistrict(null);
            setSelectedWard(null);
        }
    }, [selectedProvince]);

    // Load danh sách phường/xã khi chọn quận
    useEffect(() => {
        if (selectedDistrict) {
            loadWards(selectedDistrict.DistrictID);
            setWards([]);
            setSelectedWard(null);
        }
    }, [selectedDistrict]);

    // Tính phí vận chuyển khi chọn đủ địa chỉ
    useEffect(() => {
        if (selectedDistrict && selectedWard) {
            calculateShippingFee();
        }
    }, [selectedDistrict, selectedWard]);

    const loadProvinces = async () => {
        try {
            setLoading(true);
            const response = await shippingApi.getProvinces();
            setProvinces(response.data.data || []);
            setError('');
        } catch (err) {
            setError('Không thể tải danh sách tỉnh/thành phố');
            console.error('Error loading provinces:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadDistricts = async (provinceId) => {
        try {
            setLoading(true);
            const response = await shippingApi.getDistricts(provinceId);
            setDistricts(response.data.data || []);
            setError('');
        } catch (err) {
            setError('Không thể tải danh sách quận/huyện');
            console.error('Error loading districts:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadWards = async (districtId) => {
        try {
            setLoading(true);
            const response = await shippingApi.getWards(districtId);
            setWards(response.data.data || []);
            setError('');
        } catch (err) {
            setError('Không thể tải danh sách phường/xã');
            console.error('Error loading wards:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateShippingFee = async () => {
        try {
            setLoading(true);
            const response = await shippingApi.calculateFee({
                toDistrictId: selectedDistrict.DistrictID,
                toWardCode: selectedWard.WardCode,
                province: selectedProvince.ProvinceName,
                district: selectedDistrict.DistrictName,
                ward: selectedWard.WardName,
                weight: 1000, // Mặc định 1kg
                insuranceValue: 0,
            });

            const fee = response.data.fee || 0;
            setShippingFee(fee);

            // Callback để parent component biết phí ship
            if (onFeeCalculated) {
                onFeeCalculated(fee);
            }

            setError('');
        } catch (err) {
            setError('Không thể tính phí vận chuyển');
            console.error('Error calculating fee:', err);
            setShippingFee(0);
        } finally {
            setLoading(false);
        }
    };

    const handleProvinceChange = (e) => {
        const province = provinces.find(p => p.ProvinceID === parseInt(e.target.value));
        setSelectedProvince(province);

        if (onAddressChange) {
            onAddressChange({
                province,
                district: null,
                ward: null,
            });
        }
    };

    const handleDistrictChange = (e) => {
        const district = districts.find(d => d.DistrictID === parseInt(e.target.value));
        setSelectedDistrict(district);

        if (onAddressChange) {
            onAddressChange({
                province: selectedProvince,
                district,
                ward: null,
            });
        }
    };

    const handleWardChange = (e) => {
        const ward = wards.find(w => w.WardCode === e.target.value);
        setSelectedWard(ward);

        if (onAddressChange) {
            onAddressChange({
                province: selectedProvince,
                district: selectedDistrict,
                ward,
            });
        }
    };

    return (
        <div className="shipping-address-selector">
            <h3 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h3>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {/* Tỉnh/Thành phố */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedProvince?.ProvinceID || ''}
                        onChange={handleProvinceChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Chọn Tỉnh/Thành phố</option>
                        {provinces.map(province => (
                            <option key={province.ProvinceID} value={province.ProvinceID}>
                                {province.ProvinceName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Quận/Huyện */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Quận/Huyện <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedDistrict?.DistrictID || ''}
                        onChange={handleDistrictChange}
                        disabled={!selectedProvince || loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">Chọn Quận/Huyện</option>
                        {districts.map(district => (
                            <option key={district.DistrictID} value={district.DistrictID}>
                                {district.DistrictName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Phường/Xã */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedWard?.WardCode || ''}
                        onChange={handleWardChange}
                        disabled={!selectedDistrict || loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">Chọn Phường/Xã</option>
                        {wards.map(ward => (
                            <option key={ward.WardCode} value={ward.WardCode}>
                                {ward.WardName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Hiển thị phí vận chuyển */}
                {shippingFee > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                                Phí vận chuyển:
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                                {shippingFee.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="text-center text-gray-500">
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Đang tải...
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShippingAddressSelector;
