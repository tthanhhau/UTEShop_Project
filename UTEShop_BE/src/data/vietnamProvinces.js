import axios from 'axios';

const VIETNAM_API_BASE_URL = 'https://provinces.open-api.vn/api';
const VIETNAM_API_VERSION = process.env.VIETNAM_PROVINCES_API_VERSION || 'v2';
const CURRENT_API_URL = `${VIETNAM_API_BASE_URL}/${VIETNAM_API_VERSION}`;
const LEGACY_API_URL = `${VIETNAM_API_BASE_URL}/v1`;
const PROVINCE_LEVEL_DISTRICT_PREFIX = 'province:';
const PROVINCE_LEVEL_DISTRICT_NAME = 'Toàn tỉnh/thành phố';

const provinceWardsCache = new Map();

function buildProvinceLevelDistrictId(provinceCode) {
    return `${PROVINCE_LEVEL_DISTRICT_PREFIX}${provinceCode}`;
}

function parseProvinceLevelDistrictId(districtId) {
    const value = String(districtId || '');
    if (!value.startsWith(PROVINCE_LEVEL_DISTRICT_PREFIX)) {
        return null;
    }

    return value.replace(PROVINCE_LEVEL_DISTRICT_PREFIX, '');
}

async function fetchProvinceDetails(apiUrl, provinceCode, depth = 2) {
    const response = await axios.get(`${apiUrl}/p/${provinceCode}?depth=${depth}`);
    return response.data;
}

async function fetchLegacyWardDetails(wardCode) {
    const response = await axios.get(`${LEGACY_API_URL}/w/${wardCode}?depth=3`);
    return response.data;
}

async function fetchLegacyDistrictDetails(districtCode) {
    const response = await axios.get(`${LEGACY_API_URL}/d/${districtCode}`);
    return response.data;
}

async function fetchCurrentWardDetails(wardCode) {
    const response = await axios.get(`${CURRENT_API_URL}/w/${wardCode}?depth=3`);
    return response.data;
}

async function fetchCurrentProvinceName(provinceCode) {
    const province = await fetchProvinceDetails(CURRENT_API_URL, provinceCode, 1);
    return province.name;
}

export async function getProvincesFromPublicAPI() {
    try {
        const response = await axios.get(`${CURRENT_API_URL}/p/`);

        return response.data.map((province) => ({
            ProvinceID: province.code,
            ProvinceName: province.name,
            Code: province.code.toString(),
        }));
    } catch (error) {
        console.error('Error fetching provinces from public API:', error);
        throw error;
    }
}

export async function getDistrictsFromPublicAPI(provinceCode) {
    try {
        const provinceData = await fetchProvinceDetails(CURRENT_API_URL, provinceCode, 2);

        if (Array.isArray(provinceData.districts)) {
            return provinceData.districts.map((district) => ({
                DistrictID: district.code.toString(),
                DistrictName: district.name,
                ProvinceID: provinceCode.toString(),
                Code: district.code.toString(),
            }));
        }

        const wards = Array.isArray(provinceData.wards) ? provinceData.wards : [];
        const provinceLevelDistrictId = buildProvinceLevelDistrictId(provinceCode);

        provinceWardsCache.set(
            provinceLevelDistrictId,
            wards.map((ward) => ({
                WardCode: ward.code.toString(),
                WardName: ward.name,
                DistrictID: provinceLevelDistrictId,
            }))
        );

        return [
            {
                DistrictID: provinceLevelDistrictId,
                DistrictName: PROVINCE_LEVEL_DISTRICT_NAME,
                ProvinceID: provinceCode.toString(),
                Code: provinceLevelDistrictId,
                IsProvinceLevel: true,
            },
        ];
    } catch (error) {
        console.error('Error fetching districts from public API:', error);
        throw error;
    }
}

export async function getWardsFromPublicAPI(districtCode) {
    try {
        const provinceCode = parseProvinceLevelDistrictId(districtCode);
        if (provinceCode) {
            const provinceLevelDistrictId = buildProvinceLevelDistrictId(provinceCode);
            const cachedWards = provinceWardsCache.get(provinceLevelDistrictId);

            if (cachedWards) {
                return cachedWards;
            }

            const provinceData = await fetchProvinceDetails(CURRENT_API_URL, provinceCode, 2);
            const wards = Array.isArray(provinceData.wards) ? provinceData.wards : [];
            const mappedWards = wards.map((ward) => ({
                WardCode: ward.code.toString(),
                WardName: ward.name,
                DistrictID: provinceLevelDistrictId,
            }));

            provinceWardsCache.set(provinceLevelDistrictId, mappedWards);
            return mappedWards;
        }

        const response = await axios.get(`${CURRENT_API_URL}/d/${districtCode}?depth=2`);
        const wards = Array.isArray(response.data.wards) ? response.data.wards : [];

        return wards.map((ward) => ({
            WardCode: ward.code.toString(),
            WardName: ward.name,
            DistrictID: districtCode.toString(),
        }));
    } catch (error) {
        console.error('Error fetching wards from public API:', error);
        throw error;
    }
}

export async function getAddressInfo(provinceCode, districtCode, wardCode) {
    try {
        const currentWard = await fetchCurrentWardDetails(wardCode);

        if (currentWard?.district?.province?.name && currentWard?.district?.name) {
            return {
                provinceName: currentWard.district.province.name,
                districtName: currentWard.district.name,
                wardName: currentWard.name,
            };
        }

        const legacyWard = await fetchLegacyWardDetails(wardCode);
        const legacyDistrict = legacyWard?.district_code
            ? await fetchLegacyDistrictDetails(legacyWard.district_code)
            : null;
        const currentProvinceName = currentWard?.province_code
            ? await fetchCurrentProvinceName(currentWard.province_code)
            : legacyDistrict?.province_code
                ? await fetchCurrentProvinceName(legacyDistrict.province_code)
                : undefined;

        return {
            provinceName: currentProvinceName,
            districtName: legacyDistrict?.name,
            wardName: currentWard?.name || legacyWard?.name,
        };
    } catch (error) {
        console.error('Error fetching address info from public API:', error);
        throw error;
    }
}
