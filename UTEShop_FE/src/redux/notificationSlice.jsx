import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosConfig';

export const fetchNotificationsAsync = createAsyncThunk(
  'notifications/fetchNotifications',
  async () => {
    const response = await api.get('/user/notifications');
    return response.data;
  }
);

export const markNotificationsAsReadAsync = createAsyncThunk(
  'notifications/markAsRead',
  async () => {
    await api.post('/user/notifications/mark-read');
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    status: 'idle',
  },
  reducers: {
    // Action này sẽ được gọi bởi WebSocket
    addNotification: (state, action) => {
      state.items.unshift(action.payload); // Thêm vào đầu danh sách
      state.unreadCount++;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsAsync.fulfilled, (state, action) => {
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.status = 'succeeded';
      })
      .addCase(markNotificationsAsReadAsync.fulfilled, (state) => {
        state.unreadCount = 0;
        state.items.forEach(item => { item.read = true; });
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;