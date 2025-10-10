import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// Chọn một instance axios để sử dụng nhất quán
import api from "../../api/axiosConfig";

// ------------------- Async Thunks -------------------

// Helper để xử lý lỗi một cách nhất quán
const createApiThunk = (name, url, method = "post") => {
  return createAsyncThunk(name, async (payload, thunkAPI) => {
    try {
      const { data } = await api[method](url, payload);
      return data;
    } catch (err) {
      // Sử dụng rejectWithValue để gửi payload lỗi có cấu trúc đến reducer
      return thunkAPI.rejectWithValue(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Đã xảy ra lỗi"
      );
    }
  });
};

// --- Thunks cho luồng Đăng ký & Quên mật khẩu ---
export const requestRegisterOtp = createApiThunk(
  "auth/requestRegisterOtp",
  "/auth/register/request-otp"
);
export const verifyRegister = createApiThunk(
  "auth/verifyRegister",
  "/auth/register/verify"
);
export const requestResetOtp = createApiThunk(
  "auth/requestResetOtp",
  "/auth/forgot/request-otp"
);
export const verifyReset = createApiThunk(
  "auth/verifyReset",
  "/auth/forgot/verify"
);

// --- Thunk cho luồng Đăng nhập ---
export const loginUser = createApiThunk("auth/login", "/auth/login");

// Thêm vào cuối file, trước export default
// Thunk để lấy thông tin user
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/auth/me");
      return data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Không thể tải thông tin người dùng"
      );
    }
  }
);

// ------------------- Slice Definition -------------------

// 👉 Sử dụng sessionStorage để duy trì trạng thái đăng nhập qua các lần tải lại trang
const initialState = {
  // Lấy từ sessionStorage nếu có
  user: JSON.parse(sessionStorage.getItem("user") || "null"),
  token: sessionStorage.getItem("token") || null,
  refreshToken: sessionStorage.getItem("refreshToken") || null,
  // Trạng thái cục bộ
  loading: false,
  error: null,
  message: null, // Dùng để hiển thị thông báo thành công (ví dụ: "OTP đã được gửi")
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  // Reducers cho các hành động đồng bộ
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
      state.message = null;
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");
    },
    clearFeedback(state) {
      state.error = null;
      state.message = null;
    },
    updateUserProfile(state, action) {
      // Cập nhật thông tin user trong Redux store
      state.user = { ...state.user, ...action.payload };
      // Cập nhật sessionStorage
      sessionStorage.setItem("user", JSON.stringify(state.user));
    },
  },
  // Reducers cho các hành động bất đồng bộ (từ createAsyncThunk)
  extraReducers: (builder) => {
    // Xử lý chung cho trạng thái "pending" và "rejected"
    const handlePending = (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    };
    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload; // payload từ rejectWithValue
    };

    builder
      // --- Login ---
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;

        sessionStorage.setItem("user", JSON.stringify(action.payload.user));
        sessionStorage.setItem("token", action.payload.token);
        sessionStorage.setItem("refreshToken", action.payload.refreshToken);
      })
      .addCase(loginUser.rejected, handleRejected)

      // --- Register OTP Request ---
      .addCase(requestRegisterOtp.pending, handlePending)
      .addCase(requestRegisterOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(requestRegisterOtp.rejected, handleRejected)

      // --- Register Verify ---
      .addCase(verifyRegister.pending, handlePending)
      .addCase(verifyRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        // Lưu ý: Luồng này không tự động đăng nhập người dùng.
        // Người dùng sẽ cần đăng nhập sau khi đăng ký thành công.
        // state.user = action.payload.user; // Dòng này có thể được thêm nếu muốn lưu thông tin người dùng ngay lập tức
      })
      .addCase(verifyRegister.rejected, handleRejected)

      // --- Reset OTP Request ---
      .addCase(requestResetOtp.pending, handlePending)
      .addCase(requestResetOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(requestResetOtp.rejected, handleRejected)

      // --- Reset Verify ---
      .addCase(verifyReset.pending, handlePending)
      .addCase(verifyReset.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(verifyReset.rejected, handleRejected);

    // Cập nhật extraReducers để xử lý fetchUserProfile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        state.profileLoading = false;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      });
  },
});

// ------------------- Exports -------------------

// Selector để lấy token hiện tại
export const selectCurrentToken = (state) => state.auth.token;

// Export các actions đồng bộ
export const { logout, clearFeedback, updateUserProfile } = authSlice.actions;

// Export reducer để thêm vào store
export default authSlice.reducer;
