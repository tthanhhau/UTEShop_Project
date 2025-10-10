// Helper function to upload image to Cloudinary
export const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = 'dx8ffnhq3'; // Your Cloudinary cloud name

    // Thử nhiều preset phổ biến
    const presets = ['ml_default', 'uteshop', 'unsigned_preset'];

    let lastError: any = null;

    // Thử từng preset
    for (const uploadPreset of presets) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.warn(`Preset ${uploadPreset} failed:`, errorData);
                lastError = errorData;
                continue; // Thử preset tiếp theo
            }

            const data = await response.json();
            console.log('✅ Upload thành công với preset:', uploadPreset);
            return data.secure_url;
        } catch (error) {
            console.warn(`Preset ${uploadPreset} error:`, error);
            lastError = error;
        }
    }

    // Nếu tất cả preset đều thất bại
    console.error('❌ Tất cả upload preset đều thất bại!');
    console.error('Chi tiết lỗi:', lastError);
    throw new Error(
        `Không thể upload ảnh. Vui lòng tạo unsigned upload preset trong Cloudinary dashboard.\n` +
        `Tên preset: ml_default hoặc uteshop\n` +
        `Chi tiết: ${lastError?.error?.message || 'Unknown error'}`
    );
};

