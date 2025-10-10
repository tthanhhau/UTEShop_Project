import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import cartReducer from "../features/cart/cartSlice";
import orderReducer from "../features/order/orderSlice";
import favoriteReducer from "../features/favorites/favoriteSlice";
import viewedProductReducer from "../features/viewedProducts/viewedProductSlice";
import reviewReducer from "../features/reviews/reviewSlice";
import notificationReducer from "../redux/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    order: orderReducer,
    favorites: favoriteReducer,
    viewedProducts: viewedProductReducer,
    reviews: reviewReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
export default store;
