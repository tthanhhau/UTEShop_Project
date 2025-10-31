'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP + mật khẩu mới
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (!email) {
            setError('Vui lòng nhập email.');
            setLoading(false);
            return;
        }

        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailOk) {
            setError('Email không hợp lệ.');
            setLoading(false);
            return;
        }

        try {
            const response = await authApi.forgotPassword({ email });

            // Check if OTP is returned (fallback for testing when email fails)
            if (response.data?.data?.otp) {
                setMessage(`OTP đã được tạo (gửi email thất bại). Mã OTP của bạn: ${response.data.data.otp}`);
            } else {
                setMessage('OTP đã được gửi đến email của bạn.');
            }

            setStep(2);
        } catch (err: any) {
            console.error('Send OTP error:', err);
            setError(
                err.response?.data?.message ||
                'Không thể gửi OTP. Vui lòng thử lại.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (code.length !== 6) {
            setError('Mã OTP phải gồm 6 ký tự.');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới tối thiểu 6 ký tự.');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            setLoading(false);
            return;
        }

        try {
            await authApi.resetPassword({ email, otp: code, newPassword });
            setMessage('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(
                err.response?.data?.message ||
                'Đổi mật khẩu thất bại. Vui lòng thử lại.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.push('/login');
    };

    const handleResendOtp = () => {
        setStep(1);
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setMessage('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">UTEShop Admin</h1>
                    <p className="text-gray-600">
                        {step === 1 ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
                    </p>
                </div>

                {/* Thông báo thành công */}
                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {message}
                    </div>
                )}

                {/* Thông báo lỗi */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* STEP 1: nhập email gửi OTP */}
                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Admin
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="admin@uteshop.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang gửi...' : 'Gửi OTP'}
                        </button>

                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                            >
                                ← Quay lại đăng nhập
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2: nhập OTP + mật khẩu mới */}
                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                                Mã OTP
                            </label>
                            <input
                                id="code"
                                name="code"
                                type="text"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg font-mono"
                                placeholder="123456"
                                maxLength={6}
                            />
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu mới
                            </label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Xác nhận lại mật khẩu mới"
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6 || newPassword.length < 6 || confirmPassword.length < 6}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </button>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                Gửi lại OTP
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleBackToLogin}
                                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                >
                                    ← Quay lại đăng nhập
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}