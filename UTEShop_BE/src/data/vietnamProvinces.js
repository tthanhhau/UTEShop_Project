import axios from 'axios';

// Chuẩn hóa GHN_API_URL: Cắt bỏ "/v2" ở cuối nếu có để trỏ đúng vào master-data API
let rawGhnUrl = process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api';
if (rawGhnUrl.endsWith('/v2')) {
    rawGhnUrl = rawGhnUrl.substring(0, rawGhnUrl.length - 3);
}
const GHN_API_URL = rawGhnUrl;
const GHN_TOKEN = process.env.GHN_TOKEN;

const API_TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 30 * 60 * 1000; // Cache 30 phút

const provinceFullDataCache = new Map();
let cachedProvinces = null;

// Danh sách tĩnh 63 Tỉnh/Thành phố dự phòng (nếu GHN API lỗi hoặc chạy ở local không cấu hình token)
const FALLBACK_PROVINCES = [
  { ProvinceID: 1, ProvinceName: "Thành phố Hà Nội", Code: "1" },
  { ProvinceID: 2, ProvinceName: "Tỉnh Hà Giang", Code: "2" },
  { ProvinceID: 4, ProvinceName: "Tỉnh Cao Bằng", Code: "4" },
  { ProvinceID: 6, ProvinceName: "Tỉnh Bắc Kạn", Code: "6" },
  { ProvinceID: 8, ProvinceName: "Tỉnh Tuyên Quang", Code: "8" },
  { ProvinceID: 10, ProvinceName: "Tỉnh Lào Cai", Code: "10" },
  { ProvinceID: 11, ProvinceName: "Tỉnh Điện Biên", Code: "11" },
  { ProvinceID: 12, ProvinceName: "Tỉnh Lai Châu", Code: "12" },
  { ProvinceID: 14, ProvinceName: "Tỉnh Sơn La", Code: "14" },
  { ProvinceID: 15, ProvinceName: "Tỉnh Yên Bái", Code: "15" },
  { ProvinceID: 17, ProvinceName: "Tỉnh Hoà Bình", Code: "17" },
  { ProvinceID: 19, ProvinceName: "Tỉnh Thái Nguyên", Code: "19" },
  { ProvinceID: 20, ProvinceName: "Tỉnh Lạng Sơn", Code: "20" },
  { ProvinceID: 22, ProvinceName: "Tỉnh Quảng Ninh", Code: "22" },
  { ProvinceID: 24, ProvinceName: "Tỉnh Bắc Giang", Code: "24" },
  { ProvinceID: 25, ProvinceName: "Tỉnh Phú Thọ", Code: "25" },
  { ProvinceID: 26, ProvinceName: "Tỉnh Vĩnh Phúc", Code: "26" },
  { ProvinceID: 27, ProvinceName: "Tỉnh Bắc Ninh", Code: "27" },
  { ProvinceID: 30, ProvinceName: "Tỉnh Hải Dương", Code: "30" },
  { ProvinceID: 31, ProvinceName: "Thành phố Hải Phòng", Code: "31" },
  { ProvinceID: 33, ProvinceName: "Tỉnh Hưng Yên", Code: "33" },
  { ProvinceID: 34, ProvinceName: "Tỉnh Thái Bình", Code: "34" },
  { ProvinceID: 35, ProvinceName: "Tỉnh Hà Nam", Code: "35" },
  { ProvinceID: 36, ProvinceName: "Tỉnh Nam Định", Code: "36" },
  { ProvinceID: 37, ProvinceName: "Tỉnh Ninh Bình", Code: "37" },
  { ProvinceID: 38, ProvinceName: "Tỉnh Thanh Hoá", Code: "38" },
  { ProvinceID: 40, ProvinceName: "Tỉnh Nghệ An", Code: "40" },
  { ProvinceID: 42, ProvinceName: "Tỉnh Hà Tĩnh", Code: "42" },
  { ProvinceID: 44, ProvinceName: "Tỉnh Quảng Trị", Code: "44" },
  { ProvinceID: 46, ProvinceName: "Tỉnh Thừa Thiên Huế", Code: "46" },
  { ProvinceID: 48, ProvinceName: "Thành phố Đà Nẵng", Code: "48" },
  { ProvinceID: 49, ProvinceName: "Tỉnh Quảng Nam", Code: "49" },
  { ProvinceID: 51, ProvinceName: "Tỉnh Quảng Ngãi", Code: "51" },
  { ProvinceID: 52, ProvinceName: "Tỉnh Gia Lai", Code: "52" },
  { ProvinceID: 54, ProvinceName: "Tỉnh Kon Tum", Code: "54" },
  { ProvinceID: 56, ProvinceName: "Tỉnh Khánh Hòa", Code: "56" },
  { ProvinceID: 58, ProvinceName: "Tỉnh Ninh Thuận", Code: "58" },
  { ProvinceID: 60, ProvinceName: "Tỉnh Bình Thuận", Code: "60" },
  { ProvinceID: 62, ProvinceName: "Tỉnh Đắk Nông", Code: "62" },
  { ProvinceID: 64, ProvinceName: "Tỉnh Lâm Đồng", Code: "64" },
  { ProvinceID: 66, ProvinceName: "Tỉnh Đắk Lắk", Code: "66" },
  { ProvinceID: 67, ProvinceName: "Tỉnh Bình Phước", Code: "67" },
  { ProvinceID: 68, ProvinceName: "Tỉnh Tây Ninh", Code: "68" },
  { ProvinceID: 70, ProvinceName: "Tỉnh Bình Dương", Code: "70" },
  { ProvinceID: 72, ProvinceName: "Tỉnh Đồng Nai", Code: "72" },
  { ProvinceID: 74, ProvinceName: "Tỉnh Bà Rịa - Vũng Tàu", Code: "74" },
  { ProvinceID: 75, ProvinceName: "Tỉnh Long An", Code: "75" },
  { ProvinceID: 77, ProvinceName: "Tỉnh Tiền Giang", Code: "77" },
  { ProvinceID: 79, ProvinceName: "Thành phố Hồ Chí Minh", Code: "79" },
  { ProvinceID: 80, ProvinceName: "Tỉnh Bến Tre", Code: "80" },
  { ProvinceID: 82, ProvinceName: "Tỉnh Trà Vinh", Code: "82" },
  { ProvinceID: 83, ProvinceName: "Tỉnh Vĩnh Long", Code: "83" },
  { ProvinceID: 84, ProvinceName: "Tỉnh Đồng Tháp", Code: "84" },
  { ProvinceID: 86, ProvinceName: "Tỉnh An Giang", Code: "86" },
  { ProvinceID: 87, ProvinceName: "Tỉnh Kiên Giang", Code: "87" },
  { ProvinceID: 89, ProvinceName: "Thành phố Cần Thơ", Code: "89" },
  { ProvinceID: 91, ProvinceName: "Tỉnh Hậu Giang", Code: "91" },
  { ProvinceID: 92, ProvinceName: "Tỉnh Sóc Trăng", Code: "92" },
  { ProvinceID: 93, ProvinceName: "Tỉnh Bạc Liêu", Code: "93" },
  { ProvinceID: 94, ProvinceName: "Tỉnh Cà Mau", Code: "94" }
];

// Hàm helper để gửi request tới GHN Master Data
async function callGhnMasterData(endpoint, data = {}) {
    if (!GHN_TOKEN) {
        throw new Error("GHN_TOKEN is missing in environment variables");
    }
    
    const response = await axios.post(
        `${GHN_API_URL}/master-data/${endpoint}`,
        data,
        {
            headers: {
                'Token': GHN_TOKEN,
                'Content-Type': 'application/json',
            },
            timeout: API_TIMEOUT_MS
        }
    );

    if (response.data.code !== 200) {
        throw new Error(response.data.message || `GHN API returned code ${response.data.code}`);
    }

    return response.data.data;
}

export async function getProvincesFromPublicAPI() {
    if (cachedProvinces && cachedProvinces.length > 0) {
        return cachedProvinces;
    }

    try {
        console.log("🌐 Fetching provinces list from GHN API...");
        const data = await callGhnMasterData('province');

        cachedProvinces = data.map((province) => ({
            ProvinceID: province.ProvinceID,
            ProvinceName: province.ProvinceName,
            Code: province.ProvinceID.toString(),
        }));
        
        console.log(`✅ Loaded ${cachedProvinces.length} provinces from GHN API.`);
        return cachedProvinces;
    } catch (error) {
        console.warn('⚠️ GHN API error. Falling back to local static provinces:', error.message);
        cachedProvinces = FALLBACK_PROVINCES;
        return cachedProvinces;
    }
}

export async function getDistrictsFromPublicAPI(provinceCode) {
    try {
        const districts = await callGhnMasterData('district', {
            province_id: parseInt(provinceCode)
        });

        return districts.map((district) => ({
            DistrictID: district.DistrictID.toString(),
            DistrictName: district.DistrictName,
            ProvinceID: provinceCode.toString(),
            Code: district.DistrictID.toString(),
        }));
    } catch (error) {
        console.error('Error fetching districts from GHN API:', error.message);
        // Trả về mảng rỗng thay vì làm crash ứng dụng
        return [];
    }
}

export async function getWardsFromPublicAPI(districtCode) {
    try {
        const wards = await callGhnMasterData('ward', {
            district_id: parseInt(districtCode)
        });

        return wards.map((ward) => ({
            WardCode: ward.WardCode.toString(),
            WardName: ward.WardName,
            DistrictID: districtCode.toString(),
        }));
    } catch (error) {
        console.error('Error fetching wards from GHN API:', error.message);
        return [];
    }
}

export async function getAddressInfo(provinceCode, districtCode, wardCode) {
    try {
        const wards = await getWardsFromPublicAPI(districtCode);
        const ward = wards.find(w => String(w.WardCode) === String(wardCode));
        
        const provinces = await getProvincesFromPublicAPI();
        const province = provinces.find(p => String(p.ProvinceID) === String(provinceCode));

        const districts = await getDistrictsFromPublicAPI(provinceCode);
        const district = districts.find(d => String(d.DistrictID) === String(districtCode));

        return {
            provinceName: province?.ProvinceName || '',
            districtName: district?.DistrictName || '',
            wardName: ward?.WardName || '',
        };
    } catch (error) {
        console.error('Error fetching address info from GHN API:', error.message);
        return {
            provinceName: '',
            districtName: '',
            wardName: ''
        };
    }
}

/**
 * Lấy toàn bộ districts + wards của 1 tỉnh trong 1 lần gọi.
 * Có in-memory cache để tránh gọi lại API.
 */
export async function getProvinceFullData(provinceCode) {
    try {
        const cacheKey = String(provinceCode);
        const cached = provinceFullDataCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            console.log(`📋 Cache hit for province ${provinceCode}`);
            return cached.data;
        }

        console.log(`🌐 Fetching full data for province ${provinceCode} from GHN API...`);

        // Lấy danh sách quận/huyện của tỉnh
        const districts = await getDistrictsFromPublicAPI(provinceCode);

        // Lấy danh sách ward của tất cả districts trong tỉnh
        const wardResponses = await Promise.all(
            districts.map(async (district) => {
                try {
                    const districtWards = await getWardsFromPublicAPI(district.DistrictID);
                    return districtWards.map(ward => ({
                        ...ward,
                        DistrictName: district.DistrictName
                    }));
                } catch (e) {
                    console.warn(`⚠️ Failed to load wards for district ${district.DistrictID}:`, e.message);
                    return [];
                }
            })
        );

        const wards = wardResponses.flat();
        const result = { districts, wards };

        // Lưu cache
        provinceFullDataCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
        });

        console.log(`✅ Province ${provinceCode}: ${districts.length} districts, ${wards.length} wards`);
        return result;
    } catch (error) {
        console.error('Error fetching province full data from GHN API:', error.message);
        // Trả về dữ liệu trống để tránh crash trang checkout
        return { districts: [], wards: [] };
    }
}
