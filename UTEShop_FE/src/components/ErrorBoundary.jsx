import React from 'react';
import { useRouteError, Link } from 'react-router-dom';

export function ErrorBoundary() {
    const error = useRouteError();
    console.error(error);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">
                    {error.status === 404 ? 'Trang Không Tồn Tại' : 'Đã Xảy Ra Lỗi'}
                </h1>

                <p className="text-gray-700 mb-6">
                    {error.status === 404
                        ? 'Chúng tôi không tìm thấy trang bạn yêu cầu.'
                        : 'Có lỗi xảy ra. Vui lòng thử lại sau.'}
                </p>

                {error.data && (
                    <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                        <p className="text-red-700">{error.data}</p>
                    </div>
                )}

                <div className="flex justify-center space-x-4">
                    <Link
                        to="/"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                        Về Trang Chủ
                    </Link>

                    <button
                        onClick={() => window.location.reload()}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    >
                        Thử Lại
                    </button>
                </div>
            </div>
        </div>
    );
}
