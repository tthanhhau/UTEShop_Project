import axios from 'axios';

const VIETNAM_API_BASE_URL = 'https://provinces.open-api.vn/api';
const VIETNAM_API_VERSION = process.env.VIETNAM_PROVINCES_API_VERSION || 'v2';
const CURRENT_API_URL = `${VIETNAM_API_BASE_URL}/${VIETNAM_API_VERSION}`;
const LEGACY_API_URL = `${VIETNAM_API_BASE_URL}/v1`;
const PROVINCE_LEVEL_DISTRICT_PREFIX = 'province:';
const PROVINCE_LEVEL_DISTRICT_NAME = 'Toàn tỉnh/thành phố';

const API_TIMEOUT_MS = 10000; // 10s timeout cho external API calls
const CACHE_TTL_MS = 30 * 60 * 1000; // Cache 30 phút

const provinceWardsCache = new Map();
const provinceFullDataCache = new Map(); // Cache cho getProvinceFullData

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

// Cache danh sách tỉnh thành Việt Nam
let cachedProvinces = null;

export async function getProvincesFromPublicAPI() {
    // 1. Trả về cache nếu có để tránh gọi API nhiều lần
    if (cachedProvinces && cachedProvinces.length > 0) {
        return cachedProvinces;
    }

    try {
        console.log("🌐 Fetching provinces list from public API...");
        const response = await axios.get(`${CURRENT_API_URL}/p/`, { timeout: 10000 });

        cachedProvinces = response.data.map((province) => ({
            ProvinceID: province.code,
            ProvinceName: province.name,
            Code: province.code.toString(),
        }));
        
        console.log(`✅ Loaded ${cachedProvinces.length} provinces from API.`);
        return cachedProvinces;
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

/**
 * Lấy toàn bộ districts + wards của 1 tỉnh trong 1 lần gọi API duy nhất.
 * Có in-memory cache để tránh gọi lại external API.
 * Dùng cho endpoint /shipping/province-address để FE chỉ cần 1 request.
 */
export async function getProvinceFullData(provinceCode) {
    try {
        // Kiểm tra cache
        const cacheKey = String(provinceCode);
        const cached = provinceFullDataCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            console.log(`📋 Cache hit for province ${provinceCode}`);
            return cached.data;
        }

        console.log(`🌐 Fetching full data for province ${provinceCode} from API...`);

        // Gọi API 1 lần duy nhất với depth=2
        const provinceData = await axios.get(
            `${CURRENT_API_URL}/p/${provinceCode}?depth=2`,
            { timeout: API_TIMEOUT_MS }
        ).then(res => res.data);

        let districts = [];
        let wards = [];

        if (Array.isArray(provinceData.districts) && provinceData.districts.length > 0) {
            // Tỉnh CÓ cấp quận/huyện: extract districts + wards từ mỗi district
            districts = provinceData.districts.map((district) => ({
                DistrictID: district.code.toString(),
                DistrictName: district.name,
                ProvinceID: provinceCode.toString(),
                Code: district.code.toString(),
            }));

            wards = provinceData.districts.flatMap((district) => {
                const districtWards = Array.isArray(district.wards) ? district.wards : [];
                return districtWards.map((ward) => ({
                    WardCode: ward.code.toString(),
                    WardName: ward.name,
                    DistrictID: district.code.toString(),
                    DistrictName: district.name,
                }));
            });
        } else {
            // Tỉnh KHÔNG CÓ cấp quận/huyện (đã sáp nhập): wards trực tiếp
            const provinceLevelDistrictId = buildProvinceLevelDistrictId(provinceCode);
            const rawWards = Array.isArray(provinceData.wards) ? provinceData.wards : [];

            districts = [
                {
                    DistrictID: provinceLevelDistrictId,
                    DistrictName: PROVINCE_LEVEL_DISTRICT_NAME,
                    ProvinceID: provinceCode.toString(),
                    Code: provinceLevelDistrictId,
                    IsProvinceLevel: true,
                },
            ];

            wards = rawWards.map((ward) => ({
                WardCode: ward.code.toString(),
                WardName: ward.name,
                DistrictID: provinceLevelDistrictId,
            }));
        }

        const result = { districts, wards };

        // Lưu cache
        provinceFullDataCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
        });

        console.log(`✅ Province ${provinceCode}: ${districts.length} districts, ${wards.length} wards`);
        return result;
    } catch (error) {
        console.error('Error fetching province full data from public API:', error.message);
        throw error;
    }
}
