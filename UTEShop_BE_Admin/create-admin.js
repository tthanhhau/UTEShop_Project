// Script để tạo tài khoản admin
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop';

// User Schema
const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: String,
        role: { type: String, default: 'customer' },
        isActive: { type: Boolean, default: true },
        loyaltyPoints: {
            type: Object,
            default: { balance: 0, tier: 'BRONZE' },
        },
        voucherClaims: { type: [String], default: [] },
    },
    { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

async function createAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Kết nối MongoDB thành công!');

        // Kiểm tra xem đã có admin chưa
        const existingAdmin = await User.findOne({ email: 'admin@uteshop.com' });

        if (existingAdmin) {
            console.log('⚠️  Tài khoản admin đã tồn tại!');
            console.log('📧 Email: admin@uteshop.com');
            console.log('🔐 Password: 123456');

            // Cập nhật mật khẩu nếu cần
            const hashedPassword = await bcrypt.hash('123456', 10);
            existingAdmin.password = hashedPassword;
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('✅ Đã cập nhật mật khẩu admin!');
        } else {
            // Tạo tài khoản admin mới
            const hashedPassword = await bcrypt.hash('123456', 10);

            const admin = new User({
                name: 'Administrator',
                email: 'admin@uteshop.com',
                password: hashedPassword,
                phone: '0123456789',
                role: 'admin',
                isActive: true,
            });

            await admin.save();
            console.log('✅ Tạo tài khoản admin thành công!');
            console.log('📧 Email: admin@uteshop.com');
            console.log('🔐 Password: 123456');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi:', err);
        process.exit(1);
    }
}

createAdmin();

