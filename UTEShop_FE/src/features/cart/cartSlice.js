import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import { logout } from '../auth/authSlice';

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get('/cart');
      
      console.log('🛒 FetchCart Debug:', {
        items: data.data.items.length,
        totalItems: data.data.totalItems,
        distinctItemCount: data.data.distinctItemCount
      });

      return data.data;
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Không thể tải giỏ hàng'
      );
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1, size }, thunkAPI) => {
    try {
      const { data } = await api.post('/cart/add', { productId, quantity, size });
      console.log('🛒 AddToCart response:', data); // Debug log
      return {
        ...data.data, // Backend trả data.data chứa items, totalItems, totalAmount
        isNewProduct: data.data.isNewProduct,
        message: data.message
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng'
      );
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity, size }, thunkAPI) => {
    try {
      const { data } = await api.put('/cart/update', { productId, quantity, size });
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Không thể cập nhật giỏ hàng'
      );
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async ({ productId, size }, thunkAPI) => {
    try {
      const url = size ? `/cart/remove/${productId}?size=${size}` : `/cart/remove/${productId}`;
      const { data } = await api.delete(url);
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng'
      );
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, thunkAPI) => {
    try {
      const { data } = await api.delete('/cart/clear');
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Không thể xóa giỏ hàng'
      );
    }
  }
);

export const getCartItemCount = createAsyncThunk(
  'cart/getCartItemCount',
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get('/cart');
      console.log('🛒 CART COUNT DETAILS:', data.data);
      return {
        totalItems: data.data.totalItems,
        distinctItemCount: data.data.distinctItemCount
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Không thể lấy số lượng giỏ hàng'
      );
    }
  }
);

export const logCartDetails = createAsyncThunk(
  'cart/logCartDetails',
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get('/cart');
      console.log('🛒 FULL CART DETAILS:', data.data);
      return data.data;
    } catch (error) {
      console.error('❌ Error logging cart details:', error);
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Không thể lấy chi tiết giỏ hàng'
      );
    }
  }
);

export const syncCartAcrossPages = createAsyncThunk(
  'cart/syncCartAcrossPages',
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get('/cart');
      
      // Chỉ log khi có dữ liệu thay đổi
      const state = thunkAPI.getState().cart;
      const hasChanges = 
        JSON.stringify(data.data.items) !== JSON.stringify(state.items) ||
        data.data.totalItems !== state.totalItems ||
        data.data.totalAmount !== state.totalAmount;

      if (hasChanges) {
        console.log('🛒 Sync Cart Across Pages:', {
          items: data.data.items.length,
          totalItems: data.data.totalItems,
          totalAmount: data.data.totalAmount
        });
      }

      return data.data;
    } catch (error) {
      console.error('❌ Error syncing cart:', error);
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Không thể đồng bộ giỏ hàng'
      );
    }
  },
  {
    // Chỉ dispatch nếu có sự thay đổi
    condition: (_, { getState }) => {
      const state = getState().cart;
      return state.items.length > 0;
    }
  }
);

const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  loading: false,
  error: null,
  addingToCart: false,
  updatingCart: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
    resetCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = action.payload.totalAmount;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.addingToCart = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.addingToCart = false;
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = action.payload.totalAmount;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.addingToCart = false;
        state.error = action.payload;
      })

      // Update Cart Item
      .addCase(updateCartItem.pending, (state) => {
        state.updatingCart = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.updatingCart = false;
        
        // Luôn cập nhật items và totalItems
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = action.payload.totalAmount;
        
        console.log('🛒 UpdateCartItem Debug:', {
          items: state.items,
          totalItems: state.totalItems,
          isQuantityUpdate: action.payload.isQuantityUpdate
        });
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.updatingCart = false;
        state.error = action.payload;
      })

      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = action.payload.totalAmount;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.totalItems = action.payload.totalItems || 0;
        state.totalAmount = action.payload.totalAmount || 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reset cart when user logs out
      .addCase(logout, (state) => {
        state.items = [];
        state.totalItems = 0;
        state.totalAmount = 0;
        state.loading = false;
        state.error = null;
        state.addingToCart = false;
        state.updatingCart = false;
      });
  },
});

export const { clearCartError, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
