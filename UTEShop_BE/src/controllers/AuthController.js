// src/controllers/authController.js
import User from '../models/user.js';
import Otp from '../models/Otp.js';
import { sendMail } from '../config/mailer_admin_based.js';
import { otpHtml } from '../utils/emailTemplates.js';
import generateOtp from '../utils/generateOtp.js';
import { hash, compare } from '../utils/hash.js';
import {
  signToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../services/jwtServices.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/* ----------------------------- Helpers ----------------------------- */

const addMinutes = (d, mins) => new Date(d.getTime() + mins * 60000);

async function createAndSendOtp(email, type, title) {
  try {
    // clear OTP cũ cùng type
    await Otp.deleteMany({ email, type });

    const code = generateOtp(); // 6 chữ số
    const codeHash = await hash(code);
    const expiresAt = addMinutes(new Date(), 10); // 10 phút

    await Otp.create({ email, codeHash, type, expiresAt, attempts: 0 });

    try {
      await sendMail({
        to: email,
        subject: `${title} – Mã OTP`,
        html: otpHtml({ title, code }),
      });
      console.log(`✅ OTP email sent successfully to ${email} for ${type}`);
      return { success: true, message: 'OTP đã được gửi' };
    } catch (emailError) {
      console.error(`❌ Failed to send OTP email to ${email}:`, emailError);
      // Xóa OTP đã tạo nếu gửi email thất bại
      await Otp.deleteMany({ email, type });
      throw new Error(`Không thể gửi email OTP: ${emailError.message}`);
    }
  } catch (error) {
    console.error(`❌ createAndSendOtp error for ${email}:`, error);
    throw error;
  }
}

/* ---------------------------- Controllers --------------------------- */

// 1) Gửi OTP đăng ký
export const registerRequestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const exists = await User.findOne({ email }).lean();
  if (exists) return res.status(409).json({ message: 'Email đã tồn tại' });

  try {
    await createAndSendOtp(email, 'register', 'Xác thực đăng ký');
    return res.json({ message: 'OTP đã được gửi' });
  } catch (error) {
    console.error('❌ Register OTP error:', error);
    return res.status(500).json({
      message: 'Không thể gửi OTP đăng ký',
      error: error.message
    });
  }
});

// 2) Xác minh OTP & tạo tài khoản
export const registerVerify = asyncHandler(async (req, res) => {
  const { email, code, name, password } = req.body;

  const otp = await Otp.findOne({ email, type: 'register' });
  if (!otp) return res.status(400).json({ message: 'OTP không tồn tại hoặc đã dùng' });

  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    return res.status(400).json({ message: 'OTP đã hết hạn' });
  }

  const ok = await compare(code, otp.codeHash);
  if (!ok) {
    otp.attempts = (otp.attempts || 0) + 1;
    await otp.save();
    return res.status(400).json({ message: 'Mã OTP không đúng' });
  }

  // Map name -> username để tương thích schema (kể cả khi bạn đã alias)
  const user = await User.create({ email, username: name, password });

  await Otp.deleteMany({ email, type: 'register' });

  return res.status(201).json({
    message: 'Đăng ký thành công',
    user: {
      id: user._id,
      email: user.email,
      name: user.name || user.username,
    },
  });
});

// 3) Gửi OTP quên mật khẩu
export const resetRequestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

  try {
    await createAndSendOtp(email, 'reset', 'Đặt lại mật khẩu');
    return res.json({ message: 'OTP đã được gửi' });
  } catch (error) {
    console.error('❌ Reset OTP error:', error);
    return res.status(500).json({
      message: 'Không thể gửi OTP đặt lại mật khẩu',
      error: error.message
    });
  }
});

// 4) Xác minh OTP & đổi mật khẩu
export const resetVerify = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  const otp = await Otp.findOne({ email, type: 'reset' });
  if (!otp) return res.status(400).json({ message: 'OTP không tồn tại hoặc đã dùng' });

  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    return res.status(400).json({ message: 'OTP đã hết hạn' });
  }

  const ok = await compare(code, otp.codeHash);
  if (!ok) {
    otp.attempts = (otp.attempts || 0) + 1;
    await otp.save();
    return res.status(400).json({ message: 'Mã OTP không đúng' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

  user.password = newPassword; // pre-save hook sẽ hash
  await user.save();

  await Otp.deleteMany({ email, type: 'reset' });

  return res.json({ message: 'Đổi mật khẩu thành công' });
});

// 5) Đăng nhập
export const login = asyncHandler(async (req, res) => {
  console.log('🔐 LOGIN - Request body:', req.body);

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: 'Email & password required',
      code: 'MISSING_CREDENTIALS'
    });
  }

  // Tìm user theo email
  const user = await User.findOne({ email });
  if (!user) {
    console.log('❌ LOGIN - User not found:', email);
    return res.status(401).json({
      message: 'Sai email ',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Kiểm tra password
  const ok = await user.comparePassword(password);
  if (!ok) {
    console.log('❌ LOGIN - Wrong password for:', email);
    return res.status(401).json({
      message: 'Sai  mật khẩu',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Tạo payload cho JWT với đầy đủ thông tin
  const payload = {
    _id: user._id, // Sử dụng _id thay vì id để nhất quán với MongoDB
    id: user._id, // Thêm id để tương thích
    email: user.email,
    name: user.name,
    role: user.role,
    loyaltyPoints: user.loyaltyPoints.balance
  };

  console.log('🔑 LOGIN - Creating token with payload:', payload);

  // Tạo tokens
  const token = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  console.log('✅ LOGIN - Login successful for:', email);

  return res.json({
    token,
    refreshToken,
    user: {
      _id: user._id,
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      address: user.address || '',
      avatarUrl: user.avatarUrl || ''
    },
    message: 'Đăng nhập thành công'
  });
});

// 6) Lấy profile (yêu cầu middleware requireAuth set req.user)
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User không tồn tại' });
  res.json({ user });
});

// 7) Refresh access token
export const refreshTokenController = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const token = signToken({ id: payload.id, email: payload.email });
    return res.json({ token });
  } catch {
    return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
});

// 8) Logout (nếu bạn lưu refresh token server-side thì xoá ở đây)
// Hiện tại không lưu server-side -> chỉ trả OK để FE xoá local
export const logout = asyncHandler(async (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// 9) Facebook Login
export const facebookLogin = asyncHandler(async (req, res) => {
  const { accessToken, userID, name, email, picture } = req.body;

  if (!accessToken || !userID) {
    return res.status(400).json({
      message: 'Facebook access token và userID là bắt buộc',
      code: 'MISSING_FACEBOOK_DATA'
    });
  }

  try {
    // Verify Facebook token với Facebook Graph API (với retry logic)
    const axios = (await import('axios')).default;
    let fbResponse;
    let retries = 3;

    while (retries > 0) {
      try {
        console.log(`🔍 Verifying Facebook token (attempts left: ${retries})...`);
        fbResponse = await axios.get(
          `https://graph.facebook.com/v18.0/me`,
          {
            params: {
              access_token: accessToken,
              fields: 'id,name,email'
            },
            timeout: 10000, // 10 second timeout
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        console.log('✅ Facebook token verified successfully');
        break; // Success, exit retry loop
      } catch (verifyError) {
        retries--;
        if (retries === 0) {
          // Nếu verify thất bại sau 3 lần thử, vẫn cho phép login
          // nhưng log warning (trust client-side verification)
          console.warn('⚠️ Facebook token verification failed, trusting client data:', verifyError.message);
          fbResponse = { data: { id: userID, name, email } };
        } else {
          console.log(`⚠️ Retry Facebook verification (${retries} left)...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }
    }

    // Kiểm tra userID match (nếu verify thành công)
    if (fbResponse.data.id !== userID) {
      console.error('❌ Facebook userID mismatch:', fbResponse.data.id, 'vs', userID);
      return res.status(401).json({
        message: 'Facebook token không hợp lệ',
        code: 'INVALID_FACEBOOK_TOKEN'
      });
    }

    // Tìm hoặc tạo user
    let user = await User.findOne({
      $or: [
        { facebookId: userID },
        { email: email || fbResponse.data.email }
      ]
    });

    if (!user) {
      // Tạo user mới từ Facebook
      const userEmail = email || fbResponse.data.email || `fb_${userID}@facebook.com`;
      const userName = name || fbResponse.data.name || `Facebook User ${userID}`;

      user = await User.create({
        email: userEmail,
        username: userName,
        password: Math.random().toString(36).slice(-8) + 'Fb!123', // Random password
        facebookId: userID,
        avatarUrl: picture || '',
        role: 'customer'
      });
      console.log('✅ Created new user from Facebook:', user.email);
    } else if (!user.facebookId) {
      // Link Facebook account với existing user
      user.facebookId = userID;
      if (picture && !user.avatarUrl) {
        user.avatarUrl = picture;
      }
      await user.save();
      console.log('✅ Linked Facebook account to existing user:', user.email);
    } else {
      console.log('✅ Existing Facebook user logged in:', user.email);
    }

    // Tạo JWT tokens
    const payload = {
      _id: user._id,
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      loyaltyPoints: user.loyaltyPoints.balance
    };

    const token = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    console.log('✅ Facebook login successful for:', user.email);

    return res.json({
      token,
      refreshToken,
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        avatarUrl: user.avatarUrl || ''
      },
      message: 'Đăng nhập Facebook thành công'
    });

  } catch (error) {
    console.error('❌ Facebook login error:', error);
    return res.status(500).json({
      message: 'Đăng nhập Facebook thất bại. Vui lòng thử lại.',
      error: error.message,
      code: 'FACEBOOK_LOGIN_ERROR'
    });
  }
});
