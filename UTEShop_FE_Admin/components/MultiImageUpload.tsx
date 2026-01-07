'use client';

import React, { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaTimes, FaInfoCircle } from 'react-icons/fa';

interface MultiImageUploadProps {
    onImagesChange: (urls: string[]) => void;
    initialImages?: string[];
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({ onImagesChange, initialImages = [] }) => {
    const [images, setImages] = useState<string[]>(initialImages);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        setImages(initialImages);
    }, [initialImages]);

    // Cloudinary config - Ưu tiên preset fashion (unsigned)
    const CLOUDINARY_PRESETS = ['fashion', 'uteshop', 'ml_default', 'unsigned_preset'];
    const CLOUDINARY_CLOUD_NAME = 'dx8ffnhq3';

    const uploadToCloudinary = async (file: File): Promise<string> => {
        let lastError: any = null;

        // Thử từng preset cho đến khi thành công
        for (const preset of CLOUDINARY_PRESETS) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', preset);
            formData.append('folder', 'products');

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
                    continue;
                }

                const data = await response.json();
                console.log(`✅ Upload thành công với preset: ${preset}`);
                return data.secure_url;
            } catch (error) {
                console.warn(`Preset "${preset}" error:`, error);
                lastError = error;
            }
        }

        throw new Error('Không thể upload ảnh. Vui lòng nhập URL trực tiếp.');
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        setUploadProgress(0);
        const newImages = [...images];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate
                if (!file.type.startsWith('image/')) {
                    alert(`File ${file.name} không phải là hình ảnh`);
                    continue;
                }

                if (file.size > 5 * 1024 * 1024) {
                    alert(`File ${file.name} quá lớn (max 5MB)`);
                    continue;
                }

                setUploadProgress(Math.round(((i + 1) / files.length) * 100));

                try {
                    const imageUrl = await uploadToCloudinary(file);
                    newImages.push(imageUrl);
                } catch (error: any) {
                    console.error(`Error uploading ${file.name}:`, error);
                }
            }

            setImages(newImages);
            onImagesChange(newImages);
        } catch (error: any) {
            alert(`❌ Lỗi upload: ${error.message}`);
        } finally {
            setUploading(false);
            setUploadProgress(0);
            event.target.value = '';
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesChange(newImages);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);

        const fakeEvent = {
            target: { files: files as any, value: '' }
        } as React.ChangeEvent<HTMLInputElement>;

        handleFileSelect(fakeEvent);
    };

    const handleAddUrl = () => {
        const url = prompt('Nhập URL ảnh:');
        if (url && url.trim()) {
            const newImages = [...images, url.trim()];
            setImages(newImages);
            onImagesChange(newImages);
        }
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
                    id="product-images-upload"
                />
                <label
                    htmlFor="product-images-upload"
                    className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
                >
                    <div className="space-y-2">
                        <FaCloudUploadAlt className="text-4xl text-gray-400 mx-auto" />
                        <div className="text-sm text-gray-600">
                            {uploading ? (
                                <span className="text-purple-600">Đang upload {uploadProgress}%...</span>
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

            {/* Add URL Button */}
            <button
                type="button"
                onClick={handleAddUrl}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
            >
                + Thêm URL ảnh
            </button>

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
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x150?text=Error';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <FaTimes />
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
            <div className="text-xs bg-blue-50 border border-blue-200 p-3 rounded">
                <div className="flex items-start text-blue-700 mb-2">
                    <FaInfoCircle className="mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">Hướng dẫn:</span>
                </div>
                <ul className="text-gray-600 space-y-1 ml-5 list-disc">
                    <li>Ảnh đầu tiên sẽ là ảnh chính của sản phẩm</li>
                    <li>Có thể upload nhiều ảnh cùng lúc hoặc thêm URL</li>
                    <li>Nếu upload lỗi, hãy click "Thêm URL ảnh"</li>
                </ul>
            </div>
        </div>
    );
};

export default MultiImageUpload;

