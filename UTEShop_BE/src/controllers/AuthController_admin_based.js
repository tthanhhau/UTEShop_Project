// src/controllers/authController.js - Admin-based email configuration
import User from '../models/user.js';
import Otp from '../models/Otp.js';
import { sendMail, testEmail } from '../config/mailer_admin_based.js';
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
        console.log(`🔐 Creating OTP for ${email}, type: ${type} (Admin-based email)`);

        // clear OTP cũ cùng type
        await Otp.deleteMany({ email, type });

        const code = generateOtp(); // 6 chữ số
        const codeHash = await hash(code);
        const expiresAt = addMinutes(new Date(), 10); // 10 phút

        // Lưu OTP vào database
        await Otp.create({ email, codeHash, type, expiresAt, attempts: 0 });

        console.log(`🔐 Generated OTP for ${email}: ${code}`);

        try {
            // Gửi email với admin-based configuration
            await sendMail({
                to: email,
                subject: `${title} – Mã OTP`,
                html: otpHtml({ title, code }),
            });

            console.log(`✅ OTP email sent successfully to ${email} (Admin-based)`);
            return { success: true, message: 'OTP đã được gửi' };
        } catch (emailError) {
            console.error(`❌ Failed to send OTP email to ${email} (Admin-based):`, emailError);

            // Xóa OTP đã tạo vì email gửi thất bại
            await Otp.deleteMany({ email, type });

            throw new Error(`Không thể gửi email OTP: ${emailError.message}`);
        }
    } catch (error) {
        console.error('❌ Error in createAndSendOtp (Admin-based):', error);
        throw error;
    }
}

/* ---------------------------- Controllers --------------------------- */

// 1) Gửi OTP đăng ký
export const registerRequestOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    console.log('📧 Register OTP request for:', email, '(Admin-based email)');

    const exists = await User.findOne({ email }).lean();
    if (exists) {
        console.log('❌ Email already exists:', email);
        return res.status(409).json({ message: 'Email đã tồn tại' });
    }

    try {
        await createAndSendOtp(email, 'register', 'Xác thực đăng ký');
        return res.json({ message: 'OTP đã được gửi đến email của bạn' });
    } catch (error) {
        console.error('❌ Register OTP request failed (Admin-based):', error);
        return res.status(500).json({
            message: 'Không thể gửi OTP. Vui lòng thử lại sau.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 2) Xác minh OTP & tạo tài khoản
export const registerVerify = asyncHandler(async (req, res) => {
    const { email, code, name, password } = req.body;

    console.log('🔍 Register verify request for:', email, '(Admin-based email)');

    const otp = await Otp.findOne({ email, type: 'register' });
    if (!otp) {
        console.log('❌ OTP not found for:', email);
        return res.status(400).json({ message: 'OTP không tồn tại hoặc đã dùng' });
    }

    if (otp.expiresAt < new Date()) {
        console.log('❌ OTP expired for:', email);
        await Otp.deleteOne({ _id: otp._id });
        return res.status(400).json({ message: 'OTP đã hết hạn' });
    }

    const ok = await compare(code, otp.codeHash);
    if (!ok) {
        otp.attempts = (otp.attempts || 0) + 1;
        await otp.save();
        console.log('❌ Invalid OTP for:', email, 'attempts:', otp.attempts);
        return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    try {
        // Map name -> username để tương thích schema (kể cả khi bạn đã alias)
        const user = await User.create({ email, username: name, password });
        console.log('✅ User created successfully:', email, '(Admin-based email)');

        await Otp.deleteMany({ email, type: 'register' });

        return res.status(201).json({
            message: 'Đăng ký thành công',
            user: {
                id: user._id,
                email: user.email,
                name: user.name || user.username,
            },
        });
    } catch (createError) {
        console.error('❌ Failed to create user (Admin-based):', createError);
        return res.status(500).json({ message: 'Đăng ký thất bại. Vui lòng thử lại.' });
    }
});

// 3) Gửi OTP quên mật khẩu
export const resetRequestOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    console.log('📧 Reset OTP request for:', email, '(Admin-based email)');

    const user = await User.findOne({ email }).lean();
    if (!user) {
        console.log('❌ User not found:', email);
        return res.status(404).json({ message: 'Email không tồn tại' });
    }

    try {
        await createAndSendOtp(email, 'reset', 'Đặt lại mật khẩu');
        return res.json({ message: 'OTP đã được gửi đến email của bạn' });
    } catch (error) {
        console.error('❌ Reset OTP request failed (Admin-based):', error);
        return res.status(500).json({
            message: 'Không thể gửi OTP. Vui lòng thử lại sau.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 4) Xác minh OTP & đổi mật khẩu
export const resetVerify = asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body;

    console.log('🔍 Reset verify request for:', email, '(Admin-based email)');

    const otp = await Otp.findOne({ email, type: 'reset' });
    if (!otp) {
        console.log('❌ Reset OTP not found for:', email);
        return res.status(400).json({ message: 'OTP không tồn tại hoặc đã dùng' });
    }

    if (otp.expiresAt < new Date()) {
        console.log('❌ Reset OTP expired for:', email);
        await Otp.deleteOne({ _id: otp._id });
        return res.status(400).json({ message: 'OTP đã hết hạn' });
    }

    const ok = await compare(code, otp.codeHash);
    if (!ok) {
        otp.attempts = (otp.attempts || 0) + 1;
        await otp.save();
        console.log('❌ Invalid reset OTP for:', email, 'attempts:', otp.attempts);
        return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found during reset:', email);
            return res.status(404).json({ message: 'Email không tồn tại' });
        }

        user.password = newPassword; // pre-save hook sẽ hash
        await user.save();
        console.log('✅ Password reset successfully for:', email, '(Admin-based email)');

        await Otp.deleteMany({ email, type: 'reset' });

        return res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (resetError) {
        console.error('❌ Password reset failed (Admin-based):', resetError);
        return res.status(500).json({ message: 'Đổi mật khẩu thất bại. Vui lòng thử lại.' });
    }
});

// 5) Đăng nhập
export const login = asyncHandler(async (req, res) => {
    console.log('🔐 LOGIN - Request body:', req.body, '(Admin-based email)');

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

    console.log('🔑 LOGIN - Creating token with payload:', payload, '(Admin-based email)');

    // Tạo tokens
    const token = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    console.log('✅ LOGIN - Login successful for:', email, '(Admin-based email)');

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

// 9) Test email endpoint (chỉ cho development)
export const testEmailEndpoint = asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: 'Test email only available in development' });
    }

    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const result = await testEmail(email);
        if (result.success) {
            return res.json({ message: 'Test email sent successfully (Admin-based)' });
        } else {
            return res.status(500).json({
                message: 'Test email failed (Admin-based)',
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Test email endpoint failed (Admin-based):', error);
        return res.status(500).json({
            message: 'Test email failed (Admin-based)',
            error: error.message
        });
    }
});