'use client';

import React, { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaTimes, FaInfoCircle } from 'react-icons/fa';

interface SingleImageUploadProps {
    onImageChange: (url: string) => void;
    initialImage?: string;
}

const SingleImageUpload: React.FC<SingleImageUploadProps> = ({ onImageChange, initialImage = '' }) => {
    const [image, setImage] = useState(initialImage);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        setImage(initialImage);
    }, [initialImage]);

    // Cloudinary config - Thử nhiều preset
    const CLOUDINARY_PRESETS = ['uteshop', 'ml_default', 'fashion', 'unsigned_preset'];
    const CLOUDINARY_CLOUD_NAME = 'dx8ffnhq3';

    const uploadToCloudinary = async (file: File): Promise<string> => {
        let lastError: any = null;

        // Thử từng preset cho đến khi thành công
        for (const preset of CLOUDINARY_PRESETS) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', preset);
            formData.append('folder', 'brands');

            try {
                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    console.warn(`Preset "${preset}" failed:`, errorData);
                    lastError = errorData;
                    continue; // Thử preset tiếp theo
                }

                const data = await response.json();
                console.log(`✅ Upload thành công với preset: ${preset}`);
                return data.secure_url;
            } catch (error) {
                console.warn(`Preset "${preset}" error:`, error);
                lastError = error;
            }
        }

        // Nếu tất cả preset đều thất bại
        throw new Error(
            'Không thể upload ảnh. Vui lòng tạo upload preset "uteshop" (unsigned) trong Cloudinary hoặc nhập URL ảnh trực tiếp.'
        );
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert(`File ${file.name} không phải là hình ảnh`);
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(`File ${file.name} quá lớn. Vui lòng chọn file nhỏ hơn 5MB`);
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 200);

        try {
            const imageUrl = await uploadToCloudinary(file);
            setImage(imageUrl);
            onImageChange(imageUrl);
            setUploadProgress(100);
            alert('✅ Upload ảnh thành công!');
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`❌ ${error.message}\n\nBạn có thể nhập URL ảnh trực tiếp ở ô bên dưới thay thế.`);
        } finally {
            clearInterval(progressInterval);
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);
            // Reset input
            event.target.value = '';
        }
    };

    const removeImage = () => {
        setImage('');
        onImageChange('');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Logo thương hiệu
                </label>
                <span className="text-xs text-gray-500">
                    {image ? '1 ảnh đã chọn' : 'Chưa có ảnh'}
                </span>
            </div>

            {/* Upload Area */}
            {!image && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="hidden"
                        id="brand-logo-upload"
                    />
                    <label
                        htmlFor="brand-logo-upload"
                        className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
                    >
                        <div className="space-y-2">
                            <FaCloudUploadAlt className="text-4xl text-gray-400 mx-auto" />
                            <div className="text-sm text-gray-600">
                                {uploading ? (
                                    <span className="text-purple-600">Đang upload...</span>
                                ) : (
                                    <>
                                        <span className="font-medium text-purple-600">Chọn logo</span> hoặc kéo thả vào đây
                                    </>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                PNG, JPG, GIF tối đa 5MB
                            </div>
                        </div>
                    </label>
                </div>
            )}

            {/* Upload Progress */}
            {uploading && (
                <div className="bg-gray-50 rounded p-3">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Đang upload...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {image && !uploading && (
                <div className="relative inline-block">
                    <img
                        src={image}
                        alt="Logo preview"
                        className="w-32 h-32 object-contain rounded-lg border border-gray-200 p-2"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x150?text=Error';
                        }}
                    />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Instructions */}
            <div className="text-xs bg-blue-50 border border-blue-200 p-3 rounded">
                <div className="flex items-start text-blue-700 mb-2">
                    <FaInfoCircle className="mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">Hướng dẫn upload:</span>
                </div>
                <ul className="text-gray-600 space-y-1 ml-5 list-disc">
                    <li>Ảnh sẽ tự động upload lên Cloudinary</li>
                    <li>Nếu lỗi, bạn có thể nhập URL ảnh ở ô bên dưới</li>
                    <li>Hoặc tạo preset "uteshop" (unsigned) trong Cloudinary</li>
                </ul>
            </div>
        </div>
    );
};

export default SingleImageUpload;

