import axios from 'axios';
import GhnMapping from '../models/GhnMapping.js';

function getGhnConfig() {
    let rawGhnUrl = process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api';
    if (rawGhnUrl.endsWith('/v2')) {
        rawGhnUrl = rawGhnUrl.substring(0, rawGhnUrl.length - 3);
    }
    return {
        apiUrl: rawGhnUrl,
        token: process.env.GHN_TOKEN
    };
}

function normalizeName(name) {
    if (!name) return "";
    return name
        .toLowerCase()
        .replace(/^(tỉnh|thành phố|tp\.?|quận|huyện|thị xã|thị trấn|phường|xã|đặc khu)\s+/gi, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

async function callGhnMasterData(endpoint, data = {}) {
    const config = getGhnConfig();
    if (!config.token) {
        throw new Error("GHN_TOKEN is missing in environment variables");
    }
    const response = await axios.post(
        `${config.apiUrl}/master-data/${endpoint}`,
        data,
        {
            headers: {
                'Token': config.token,
                'Content-Type': 'application/json',
            },
            timeout: 15000
        }
    );
    if (response.data.code !== 200) {
        throw new Error(response.data.message || `GHN API returned code ${response.data.code}`);
    }
    return response.data.data;
}

const PROVINCE_OVERRIDES = {
    'thanhphohue': 'thuathienhue',
    'hue': 'thuathienhue',
    'thanhphodanang': 'danang',
    'thanhphohanoi': 'hanoi',
    'thanhphohochiminh': 'hochiminh',
    'thanhphocantho': 'cantho',
    'thanhphohaiphong': 'haiphong',
};

export async function seedGhnMapping() {
    try {
        // Check if mapping already exists
        const count = await GhnMapping.countDocuments();
        if (count > 0) {
            console.log(`ℹ️ GHN Address Mapping already has ${count} records. Skipping seed.`);
            return;
        }

        console.log("🌱 Starting GHN Address Mapping Seed (Province Open API v2 to GHN ID)...");

        // 1. Fetch v2 Provinces
        const v2ProvincesRes = await axios.get('https://provinces.open-api.vn/api/v2/p/');
        const v2Provinces = v2ProvincesRes.data;

        // 2. Fetch GHN Provinces
        const ghnProvinces = await callGhnMasterData('province');

        const provinceMappings = [];
        const bulkOps = [];

        // Map provinces
        for (const v2P of v2Provinces) {
            const v2PNorm = normalizeName(v2P.name);
            const overrideName = PROVINCE_OVERRIDES[v2PNorm];
            
            const ghnP = ghnProvinces.find(gp => {
                const gpNorm = normalizeName(gp.ProvinceName);
                return gpNorm === v2PNorm || (overrideName && gpNorm === overrideName);
            });

            if (ghnP) {
                const mapping = {
                    type: 'province',
                    gsoCode: v2P.code.toString(),
                    gsoName: v2P.name,
                    ghnProvinceId: ghnP.ProvinceID,
                    ghnName: ghnP.ProvinceName
                };
                provinceMappings.push(mapping);
                bulkOps.push(mapping);
            } else {
                console.warn(`⚠️ Unmatched v2 province: ${v2P.name}`);
            }
        }

        console.log(`Mapped ${provinceMappings.length}/${v2Provinces.length} provinces.`);

        // Process wards for each province
        for (const provMap of provinceMappings) {
            console.log(`Mapping wards for province: ${provMap.gsoName}...`);
            
            // Get v2 Wards
            const v2WardsRes = await axios.get(`https://provinces.open-api.vn/api/v2/w/?province=${provMap.gsoCode}`);
            const v2Wards = v2WardsRes.data;

            // Get GHN districts
            const ghnDistricts = await callGhnMasterData('district', { province_id: provMap.ghnProvinceId });
            
            // Get GHN wards for all districts
            const ghnWards = [];
            for (const dist of ghnDistricts) {
                try {
                    const wards = await callGhnMasterData('ward', { district_id: dist.DistrictID });
                    for (const w of wards) {
                        ghnWards.push({
                            ...w,
                            DistrictID: dist.DistrictID,
                            DistrictName: dist.DistrictName
                        });
                    }
                } catch (e) {
                    // Ignore failures for specific districts
                }
            }

            // Map each v2 ward
            for (const v2W of v2Wards) {
                const v2WNorm = normalizeName(v2W.name);
                let matched = false;

                // 1. Try exact ward name match in province
                let match = ghnWards.find(gw => normalizeName(gw.WardName) === v2WNorm);
                if (match) {
                    bulkOps.push({
                        type: 'ward',
                        gsoCode: v2W.code.toString(),
                        gsoName: v2W.name,
                        ghnDistrictId: match.DistrictID,
                        ghnWardCode: match.WardCode,
                        ghnName: `${match.WardName}, ${match.DistrictName}`
                    });
                    continue;
                }

                // 2. Try matching GSO ward name to GHN district name (e.g. "Phường Ba Đình" -> "Quận Ba Đình")
                const matchDist = ghnDistricts.find(gd => normalizeName(gd.DistrictName) === v2WNorm);
                if (matchDist) {
                    const distWards = ghnWards.filter(gw => gw.DistrictID === matchDist.DistrictID);
                    if (distWards.length > 0) {
                        const firstWard = distWards[0];
                        bulkOps.push({
                            type: 'ward',
                            gsoCode: v2W.code.toString(),
                            gsoName: v2W.name,
                            ghnDistrictId: firstWard.DistrictID,
                            ghnWardCode: firstWard.WardCode,
                            ghnName: `${firstWard.WardName}, ${firstWard.DistrictName} (District Center)`
                        });
                        continue;
                    }
                }

                // 3. Fallback: map to first ward of first district in GHN province
                if (ghnWards.length > 0) {
                    const fallback = ghnWards[0];
                    bulkOps.push({
                        type: 'ward',
                        gsoCode: v2W.code.toString(),
                        gsoName: v2W.name,
                        ghnDistrictId: fallback.DistrictID,
                        ghnWardCode: fallback.WardCode,
                        ghnName: `${fallback.WardName}, ${fallback.DistrictName} (Fallback)`
                    });
                } else {
                    console.warn(`❌ No fallback possible for ward: ${v2W.name}`);
                }
            }
        }

        console.log(`Saving ${bulkOps.length} mapping records to MongoDB...`);
        // Bulk insert to MongoDB
        await GhnMapping.insertMany(bulkOps);
        console.log("✅ GHN Address Mapping successfully seeded!");

    } catch (e) {
        console.error("❌ Failed to seed GHN Address Mapping:", e.message);
    }
}
