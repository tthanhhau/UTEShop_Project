"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dx8ffnhq3',
    api_key: process.env.CLOUDINARY_API_KEY || '485827842363815',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
});
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.config.js.map