import axios from 'axios';
import api from './axiosConfig';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

/**
 * Search products by image
 * @param {File|string} image - Image file or base64 string
 * @param {number} topK - Number of results to return (default: 10)
 * @returns {Promise} API response with search results
 */
export const searchByImage = async (image, topK = 10) => {
  try {
    // If image is a File object - use raw axios to avoid Content-Type override
    if (image instanceof File) {
      const formData = new FormData();
      formData.append('image', image);

      // Get token for auth
      const token = sessionStorage.getItem('token');

      // Use raw axios to properly send multipart/form-data
      const response = await axios.post(
        `${API_URL}/image-search/search?top_k=${topK}`,
        formData,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 60000,
        }
      );

      return response.data;
    }
    // If image is a base64 string
    else if (typeof image === 'string') {
      const response = await api.post(`/image-search/search?top_k=${topK}`, {
        image_base64: image,
      });

      return response.data;
    }
    else {
      throw new Error('Invalid image format. Expected File or base64 string.');
    }
  } catch (error) {
    console.error('Image search error:', error);
    throw error;
  }
};

/**
 * Health check for image search service
 */
export const checkImageSearchHealth = async () => {
  try {
    const response = await api.get('/image-search/health');
    return response.data;
  } catch (error) {
    console.error('Image search health check error:', error);
    throw error;
  }
};

/**
 * Update embeddings for all products (admin only)
 */
export const updateEmbeddings = async () => {
  try {
    const response = await api.post('/image-search/update-embeddings');
    return response.data;
  } catch (error) {
    console.error('Update embeddings error:', error);
    throw error;
  }
};

