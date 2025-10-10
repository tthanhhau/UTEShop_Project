import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { addViewedProduct, getViewedProducts, removeViewedProduct } from '../../api/viewedProductApi.js';

// Async thunks
export const addViewedProductAsync = createAsyncThunk(
    'viewedProducts/addViewedProduct',
    async (productId, { rejectWithValue }) => {
        try {
            const response = await addViewedProduct(productId);
            return { productId, ...response };
        } catch (error) {
            return rejectWithValue(error.message || 'Có lỗi xảy ra');
        }
    }
);

export const getViewedProductsAsync = createAsyncThunk(
    'viewedProducts/getViewedProducts',
    async ({ page = 1, limit = 12 }, { rejectWithValue }) => {
        try {
            const response = await getViewedProducts(page, limit);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Có lỗi xảy ra');
        }
    }
);

export const removeViewedProductAsync = createAsyncThunk(
    'viewedProducts/removeViewedProduct',
    async (productId, { rejectWithValue }) => {
        try {
            const response = await removeViewedProduct(productId);
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
    error: null
};

const viewedProductSlice = createSlice({
    name: 'viewedProducts',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearViewedProducts: (state) => {
            state.items = [];
            state.currentPage = 1;
            state.totalPages = 0;
            state.total = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            // Add viewed product
            .addCase(addViewedProductAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addViewedProductAsync.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(addViewedProductAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get viewed products
            .addCase(getViewedProductsAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getViewedProductsAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items;
                state.currentPage = action.payload.page;
                state.totalPages = action.payload.totalPages;
                state.total = action.payload.total;
            })
            .addCase(getViewedProductsAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Remove viewed product
            .addCase(removeViewedProductAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeViewedProductAsync.fulfilled, (state, action) => {
                state.loading = false;
                const { productId } = action.payload;
                state.items = state.items.filter(item => item.product._id !== productId);
                state.total -= 1;
            })
            .addCase(removeViewedProductAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, clearViewedProducts } = viewedProductSlice.actions;
export default viewedProductSlice.reducer;
