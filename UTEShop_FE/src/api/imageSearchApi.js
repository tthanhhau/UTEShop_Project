import api from './axiosConfig';

/**
 * Search products by image
 * @param {File|string} image - Image file or base64 string
 * @param {number} topK - Number of results to return (default: 10)
 * @returns {Promise} API response with search results
 */
export const searchByImage = async (image, topK = 10) => {
  try {
    const formData = new FormData();

    // If image is a File object
    if (image instanceof File) {
      formData.append('image', image);

      // DON'T set Content-Type header - let browser set it automatically with boundary
      const response = await api.post(`/image-search/search?top_k=${topK}`, formData);

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

