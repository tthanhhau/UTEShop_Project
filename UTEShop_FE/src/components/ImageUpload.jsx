import React, { useState, useEffect } from 'react';

const ImageUpload = ({ onImagesChange, initialImages = [] }) => {
    const [images, setImages] = useState(initialImages);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [isDragOver, setIsDragOver] = useState(false);

    // Update images when initialImages changes (for edit mode)
    useEffect(() => {
        setImages(initialImages);
    }, [initialImages]);

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
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const newImages = [...images];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert(`File ${file.name} không phải là hình ảnh`);
                    continue;
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert(`File ${file.name} quá lớn. Vui lòng chọn file nhỏ hơn 5MB`);
                    continue;
                }

                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: 0
                }));

                try {
                    const imageUrl = await uploadToCloudinary(file);
                    newImages.push(imageUrl);

                    setUploadProgress(prev => ({
                        ...prev,
                        [file.name]: 100
                    }));
                } catch (error) {
                    alert(`Lỗi upload ${file.name}: ${error.message}`);
                    setUploadProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[file.name];
                        return newProgress;
                    });
                }
            }

            setImages(newImages);
            onImagesChange(newImages);
        } finally {
            setUploading(false);
            setUploadProgress({});
            // Reset input
            event.target.value = '';
        }
    };

    const removeImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesChange(newImages);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        const fileInput = document.getElementById('image-upload');

        // Create a fake event for handleFileSelect
        const fakeEvent = {
            target: { files, value: '' }
        };
        handleFileSelect(fakeEvent);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Hình ảnh sản phẩm
                </label>
                <span className="text-xs text-gray-500">
                    {images.length} ảnh đã chọn
                </span>
            </div>

            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                />
                <label
                    htmlFor="image-upload"
                    className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
                >
                    <div className="space-y-2">
                        <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                        <div className="text-sm text-gray-600">
                            {uploading ? (
                                <span className="text-purple-600">Đang upload...</span>
                            ) : (
                                <>
                                    <span className="font-medium text-purple-600">Chọn ảnh</span> hoặc kéo thả vào đây
                                </>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">
                            PNG, JPG, GIF tối đa 5MB mỗi file
                        </div>
                    </div>
                </label>
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2">
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="truncate">{fileName}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Preview */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={image}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/150x150?text=Error';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                ×
                            </button>
                            {index === 0 && (
                                <div className="absolute bottom-1 left-1 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                                    Chính
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <i className="fas fa-info-circle mr-1"></i>
                Ảnh đầu tiên sẽ là ảnh chính của sản phẩm. Bạn có thể upload nhiều ảnh cùng lúc.
            </div>
        </div>
    );
};

export default ImageUpload;
