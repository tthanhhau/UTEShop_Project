import { useEffect, useState } from 'react';
import shippingApi from '@/api/shippingApi';

function ShippingAddressSelector({ onAddressChange, onFeeCalculated }) {
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);

    const [shippingFee, setShippingFee] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProvinces();
    }, []);

    useEffect(() => {
        if (!selectedProvince) {
            return;
        }

        setWards([]);
        setSelectedWard(null);
        loadWards(selectedProvince);
    }, [selectedProvince]);

    useEffect(() => {
        if (selectedWard) {
            calculateShippingFee();
        }
    }, [selectedWard]);

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

    const loadWards = async (province) => {
        try {
            setLoading(true);
            const response = await shippingApi.getProvinceAddress(province.ProvinceID);
            const { wards: allWards = [] } = response.data.data || {};

            setError('');

            if (!allWards.length) {
                setError('Không tìm thấy địa giới giao hàng cho tỉnh/thành phố này');
                return;
            }

            const sortedWards = allWards.sort((left, right) =>
                String(left.WardName).localeCompare(String(right.WardName), 'vi')
            );

            setWards(sortedWards);

            if (onAddressChange) {
                onAddressChange({
                    province,
                    district: null,
                    ward: null,
                });
            }
        } catch (err) {
            setError('Không thể tải danh sách phường/xã theo tỉnh/thành phố');
            console.error('Error loading province address data:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateShippingFee = async () => {
        try {
            setLoading(true);
            const response = await shippingApi.calculateFee({
                toDistrictId: null,
                toWardCode: selectedWard.WardCode,
                province: selectedProvince.ProvinceName,
                district: '',
                ward: selectedWard.WardName,
                weight: 1000,
                insuranceValue: 0,
                provider: 'GHN', // Default to GHN as requested
            });

            const fee = response.data.fee || 0;
            setShippingFee(fee);

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
        const province = provinces.find((item) => item.ProvinceID === parseInt(e.target.value, 10));
        setSelectedProvince(province);

        if (onAddressChange) {
            onAddressChange({
                province,
                district: null,
                ward: null,
            });
        }
    };

    const handleWardChange = (e) => {
        const wardValue = e.target.value;
        const ward = wards.find((item) => item.WardCode === wardValue);

        setSelectedWard(ward);

        if (onAddressChange) {
            onAddressChange({
                province: selectedProvince,
                district: null,
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
                        {provinces.map((province) => (
                            <option key={province.ProvinceID} value={province.ProvinceID}>
                                {province.ProvinceName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedWard?.WardCode || ''}
                        onChange={handleWardChange}
                        disabled={!selectedProvince || loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">Chọn Phường/Xã</option>
                        {wards.map((ward) => (
                            <option key={ward.WardCode} value={ward.WardCode}>
                                {ward.WardName}
                            </option>
                        ))}
                    </select>
                </div>

                {shippingFee > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Phí vận chuyển:</span>
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
