import jwt from "jsonwebtoken";

// Default secrets nếu không có trong .env
const DEFAULT_JWT_SECRET = "uteshop-default-secret-2024-please-change-in-production";
const DEFAULT_REFRESH_SECRET = "uteshop-default-refresh-secret-2024-please-change-in-production";

// Tạo Access Token
export const signToken = (payload, options = {}) => {
  try {
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "24h"; // Tăng thời gian cho dễ test

    console.log('🔐 JWT Sign - Using secret:', secret ? 'Secret exists' : 'No secret');
    console.log('🔐 JWT Sign - Payload:', payload);

    const token = jwt.sign(payload, secret, { expiresIn, ...options });
    console.log('✅ JWT Sign - Token created successfully');

    return token;
  } catch (error) {
    console.error('❌ JWT Sign Error:', error.message);
    throw error;
  }
};

// Verify Access Token
export const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

    // console.log('🔍 JWT Verify - Using secret:', secret ? 'Secret exists' : 'No secret');
    // console.log('🔍 JWT Verify - Token received:', token ? 'Token exists' : 'No token');

    const decoded = jwt.verify(token, secret);
    //console.log('✅ JWT Verify - Token decoded successfully:', decoded);

    return decoded;
  } catch (error) {
    try {
      // Fallback cho Admin JWT secret
      const adminSecret = "uteshop-admin-secret-key-2024";
      return jwt.verify(token, adminSecret);
    } catch (adminError) {
      console.error('❌ JWT Verify Error:', error.message);
      throw error;
    }
  }
};

// Tạo Refresh Token
export const signRefreshToken = (payload, options = {}) => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    return jwt.sign(payload, secret, { expiresIn, ...options });
  } catch (error) {
    console.error('❌ JWT Refresh Sign Error:', error.message);
    throw error;
  }
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('❌ JWT Refresh Verify Error:', error.message);
    throw error;
  }
};