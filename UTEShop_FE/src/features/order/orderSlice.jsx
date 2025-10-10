import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axiosConfig';

// Async thunks for order-related actions
export const createOrder = createAsyncThunk(
    'order/createOrder',
    async (orderData, { rejectWithValue }) => {
        try {
            console.log('Order Data in Slice:', orderData); // Log dữ liệu order
            const response = await axios.post('/orders', orderData);
            console.log('Order Response:', response.data); // Log phản hồi từ server
            return response.data;
        } catch (error) {
            console.error('Order Creation Error:', error.response?.data || error); // Log lỗi chi tiết
            return rejectWithValue(error.response?.data || 'Error creating order');
        }
    }
);

export const fetchUserOrders = createAsyncThunk(
    'order/fetchUserOrders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/orders');
            return response.data.orders;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Error fetching orders');
        }
    }
);

export const cancelOrder = createAsyncThunk(
    'order/cancelOrder',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`/orders/${orderId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Error cancelling order');
        }
    }
);

const orderSlice = createSlice({
    name: 'order',
    initialState: {
        orders: [],
        currentOrder: null,
        isLoading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        // Create Order
        builder.addCase(createOrder.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(createOrder.fulfilled, (state, action) => {
            state.isLoading = false;
            state.currentOrder = action.payload.order;
            state.orders.unshift(action.payload.order);
        });
        builder.addCase(createOrder.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        });

        // Fetch User Orders
        builder.addCase(fetchUserOrders.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchUserOrders.fulfilled, (state, action) => {
            state.isLoading = false;
            state.orders = action.payload;
        });
        builder.addCase(fetchUserOrders.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        });

        // Cancel Order
        builder.addCase(cancelOrder.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(cancelOrder.fulfilled, (state, action) => {
            state.isLoading = false;
            state.orders = state.orders.filter(
                order => order._id !== action.payload.order._id
            );
        });
        builder.addCase(cancelOrder.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        });
    }
});

export default orderSlice.reducer;
