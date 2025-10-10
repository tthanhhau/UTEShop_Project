import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    createReview,
    getProductReviews,
    getUserReview,
    updateReview,
    deleteReview
} from '../../api/reviewApi.js';

// Async thunks
export const createReviewAsync = createAsyncThunk(
    'reviews/createReview',
    async ({ productId, reviewData }, { rejectWithValue }) => {
        try {
            const response = await createReview(productId, reviewData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
        }
    }
);

export const getProductReviewsAsync = createAsyncThunk(
    'reviews/getProductReviews',
    async ({ productId, page = 1, limit = 10, rating = null }, { rejectWithValue }) => {
        try {
            const response = await getProductReviews(productId, page, limit, rating);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
        }
    }
);

export const getUserReviewAsync = createAsyncThunk(
    'reviews/getUserReview',
    async (productId, { rejectWithValue }) => {
        try {
            const response = await getUserReview(productId);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
        }
    }
);

export const updateReviewAsync = createAsyncThunk(
    'reviews/updateReview',
    async ({ reviewId, reviewData }, { rejectWithValue }) => {
        try {
            const response = await updateReview(reviewId, reviewData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
        }
    }
);

export const deleteReviewAsync = createAsyncThunk(
    'reviews/deleteReview',
    async (reviewId, { rejectWithValue }) => {
        try {
            const response = await deleteReview(reviewId);
            return { reviewId, ...response };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
        }
    }
);

const initialState = {
    reviews: [],
    userReview: null,
    stats: {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    currentPage: 1,
    totalPages: 0,
    total: 0,
    loading: false,
    error: null
};

const reviewSlice = createSlice({
    name: 'reviews',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearReviews: (state) => {
            state.reviews = [];
            state.userReview = null;
            state.stats = {
                totalReviews: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
            state.currentPage = 1;
            state.totalPages = 0;
            state.total = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create review
            .addCase(createReviewAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createReviewAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.userReview = action.payload.review;
                // Thêm review mới vào đầu danh sách
                state.reviews.unshift(action.payload.review);
                state.total += 1;
            })
            .addCase(createReviewAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get product reviews
            .addCase(getProductReviewsAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getProductReviewsAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.reviews = action.payload.reviews;
                state.stats = action.payload.stats;
                state.currentPage = action.payload.page;
                state.totalPages = action.payload.totalPages;
                state.total = action.payload.total;
                console.log('📊 Redux: Updated review stats:', action.payload.stats);
            })
            .addCase(getProductReviewsAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get user review
            .addCase(getUserReviewAsync.fulfilled, (state, action) => {
                state.userReview = action.payload.review;
            })
            // Update review
            .addCase(updateReviewAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateReviewAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.userReview = action.payload.review;
                // Cập nhật review trong danh sách
                const index = state.reviews.findIndex(r => r._id === action.payload.review._id);
                if (index !== -1) {
                    state.reviews[index] = action.payload.review;
                }
                // Cập nhật stats nếu có trong response
                if (action.payload.stats) {
                    state.stats = action.payload.stats;
                    console.log('📊 Redux: Updated review stats after edit:', action.payload.stats);
                }
            })
            .addCase(updateReviewAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete review
            .addCase(deleteReviewAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteReviewAsync.fulfilled, (state, action) => {
                state.loading = false;
                const { reviewId } = action.payload;
                state.userReview = null;
                state.reviews = state.reviews.filter(r => r._id !== reviewId);
                state.total -= 1;
                // Cập nhật stats nếu có trong response
                if (action.payload.stats) {
                    state.stats = action.payload.stats;
                    console.log('📊 Redux: Updated review stats after delete:', action.payload.stats);
                }
            })
            .addCase(deleteReviewAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
