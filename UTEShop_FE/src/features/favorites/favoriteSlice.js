import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toggleFavorite, getFavorites, checkFavorite } from '../../api/favoriteApi.js';

// Async thunks
export const toggleFavoriteAsync = createAsyncThunk(
    'favorites/toggleFavorite',
    async (productId, { rejectWithValue }) => {
        try {
            const response = await toggleFavorite(productId);
            return { productId, ...response };
        } catch (error) {
            return rejectWithValue(error.message || 'Có lỗi xảy ra');
        }
    }
);

export const getFavoritesAsync = createAsyncThunk(
    'favorites/getFavorites',
    async ({ page = 1, limit = 12 }, { rejectWithValue }) => {
        try {
            const response = await getFavorites(page, limit);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Có lỗi xảy ra');
        }
    }
);

export const checkFavoriteAsync = createAsyncThunk(
    'favorites/checkFavorite',
    async (productId, { rejectWithValue }) => {
        try {
            const response = await checkFavorite(productId);
            return { productId, ...response };
        } catch (error) {
            return rejectWithValue(error.message || 'Có lỗi xảy ra');
        }
    }
);

const initialState = {
    items: [],
    currentPage: 1,
    totalPages: 0,
    total: 0,
    loading: false,
    error: null,
    favoriteStatus: {} // Lưu trạng thái yêu thích của từng sản phẩm
};

const favoriteSlice = createSlice({
    name: 'favorites',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearFavorites: (state) => {
            state.items = [];
            state.currentPage = 1;
            state.totalPages = 0;
            state.total = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            // Toggle favorite
            .addCase(toggleFavoriteAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(toggleFavoriteAsync.fulfilled, (state, action) => {
                state.loading = false;
                const { productId, isFavorite } = action.payload;
                state.favoriteStatus[productId] = isFavorite;
            })
            .addCase(toggleFavoriteAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get favorites
            .addCase(getFavoritesAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getFavoritesAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items;
                state.currentPage = action.payload.page;
                state.totalPages = action.payload.totalPages;
                state.total = action.payload.total;
            })
            .addCase(getFavoritesAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Check favorite
            .addCase(checkFavoriteAsync.fulfilled, (state, action) => {
                const { productId, isFavorite } = action.payload;
                state.favoriteStatus[productId] = isFavorite;
            });
    }
});

export const { clearError, clearFavorites } = favoriteSlice.actions;
export default favoriteSlice.reducer;
