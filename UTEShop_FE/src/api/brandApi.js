import api from "./axiosConfig";

// Lấy tất cả brands
export const getAllBrands = async () => {
  try {
    const response = await api.get("/brands");
    return response.data;
  } catch (error) {
    console.error("Error fetching brands:", error);
    throw error;
  }
};

// Lấy brand theo ID
export const getBrandById = async (id) => {
  try {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching brand:", error);
    throw error;
  }
};

export default {
  getAllBrands,
  getBrandById,
};

