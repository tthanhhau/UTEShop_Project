import React, { useState, useEffect } from 'react';

const SingleImageUpload = ({ onImageChange, initialImage = '' }) => {
    const [image, setImage] = useState(initialImage);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Update image when initialImage changes (for edit mode)
    useEffect(() => {
        setImage(initialImage);
    }, [initialImage]);

    // Cloudinary config - Vite uses import.meta.env
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'fashion';
    const CLOUDINARY_CLOUD_NAME = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || 'dx8ffnhq3';

    const uploadToCloudinary = async (file) => {
        // Check if environment variables are configured
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            throw new Error('Cloudinary chưa được cấu hình. Vui lòng kiểm tra file .env');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
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

        try {
            const imageUrl = await uploadToCloudinary(file);
            setImage(imageUrl);
            onImageChange(imageUrl);
            setUploadProgress(100);
        } catch (error) {
            alert(`Lỗi upload ${file.name}: ${error.message}`);
        } finally {
            setUploading(false);
            setUploadProgress(0);
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
                        <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
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
            {image && (
                <div className="relative inline-block">
                    <img
                        src={image}
                        alt="Logo preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x150?text=Error';
                        }}
                    />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <i className="fas fa-info-circle mr-1"></i>
                Chỉ có thể upload 1 logo cho mỗi thương hiệu. Logo sẽ hiển thị trong danh sách sản phẩm.
            </div>
        </div>
    );
};

export default SingleImageUpload;
