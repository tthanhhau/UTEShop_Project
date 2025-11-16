// Script để kiểm tra và sửa sản phẩm cho image search
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/models/product.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function checkProducts() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Đếm tổng số sản phẩm
        const totalProducts = await Product.countDocuments({});
        console.log(`\n📦 Total products: ${totalProducts}`);

        // Đếm sản phẩm active
        const activeProducts = await Product.countDocuments({ isActive: true });
        console.log(`✅ Active products: ${activeProducts}`);

        // Đếm sản phẩm có images
        const productsWithImages = await Product.countDocuments({
            images: { $exists: true, $ne: [] }
        });
        console.log(`🖼️  Products with images: ${productsWithImages}`);

        // Đếm sản phẩm active và có images (điều kiện cho image search)
        const eligibleProducts = await Product.countDocuments({
            isActive: true,
            images: { $exists: true, $ne: [] }
        });
        console.log(`🎯 Eligible products for image search: ${eligibleProducts}`);

        if (eligibleProducts === 0) {
            console.log('\n⚠️  No eligible products found!');
            
            // Kiểm tra sản phẩm không active
            const inactiveProducts = await Product.countDocuments({ isActive: false });
            console.log(`\n❌ Inactive products: ${inactiveProducts}`);
            
            // Kiểm tra sản phẩm không có images
            const productsWithoutImages = await Product.countDocuments({
                $or: [
                    { images: { $exists: false } },
                    { images: [] }
                ]
            });
            console.log(`🖼️  Products without images: ${productsWithoutImages}`);

            // Đề xuất sửa
            console.log('\n💡 Suggestions:');
            
            if (inactiveProducts > 0) {
                console.log(`   - Set isActive=true for ${inactiveProducts} products`);
                const updateInactive = await Product.updateMany(
                    { isActive: false },
                    { $set: { isActive: true } }
                );
                console.log(`   ✅ Updated ${updateInactive.modifiedCount} products to active`);
            }

            if (productsWithoutImages > 0 && productsWithImages === 0) {
                console.log(`   - ⚠️  ${productsWithoutImages} products don't have images`);
                console.log('   - You need to add images to products first');
            }
        } else {
            console.log(`\n✅ Found ${eligibleProducts} products ready for image search!`);
            
            // Hiển thị một vài sản phẩm mẫu
            const sampleProducts = await Product.find({
                isActive: true,
                images: { $exists: true, $ne: [] }
            }).limit(3).select('name images isActive');
            
            console.log('\n📋 Sample products:');
            sampleProducts.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.name}`);
                console.log(`      Images: ${p.images.length} image(s)`);
                console.log(`      isActive: ${p.isActive}`);
            });
        }

        await mongoose.disconnect();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkProducts();

