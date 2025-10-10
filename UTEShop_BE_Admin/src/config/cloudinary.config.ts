import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dx8ffnhq3',
    api_key: process.env.CLOUDINARY_API_KEY || '485827842363815',
    api_secret: process.env.CLOUDINARY_API_SECRET || '', // Cần cấu hình trong file .env
});

export default cloudinary;

