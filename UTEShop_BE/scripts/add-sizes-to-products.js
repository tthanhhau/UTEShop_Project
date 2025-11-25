import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/models/product.js';
import Category from '../src/models/category.js';

dotenv.config();

const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['39', '40', '41', '42', '43', '44'];

async function addSizesToProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Lấy tất cả categories
    const categories = await Category.find();
    console.log(`📦 Tìm thấy ${categories.length} categories`);

    // Tìm category giày (có thể là "Giày", "Shoes", "Footwear", etc.)
    const shoeCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes('giày') || 
      cat.name.toLowerCase().includes('shoe') ||
      cat.name.toLowerCase().includes('footwear')
    );

    // Tìm category quần áo (áo, quần, etc.)
    const clothingCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes('áo') || 
      cat.name.toLowerCase().includes('quần') ||
      cat.name.toLowerCase().includes('shirt') ||
      cat.name.toLowerCase().includes('pant') ||
      cat.name.toLowerCase().includes('dress') ||
      cat.name.toLowerCase().includes('jacket')
    );

    console.log(`👟 Giày categories:`, shoeCategories.map(c => c.name));
    console.log(`👕 Quần áo categories:`, clothingCategories.map(c => c.name));

    let updatedCount = 0;

    // Cập nhật sản phẩm giày
    if (shoeCategories.length > 0) {
      const shoeProducts = await Product.find({
        category: { $in: shoeCategories.map(c => c._id) }
      });

      for (const product of shoeProducts) {
        if (!product.sizes || product.sizes.length === 0) {
          // Tạo variants cho mỗi size
          const variants = SHOE_SIZES.map(size => ({
            size,
            stock: Math.floor(product.stock / SHOE_SIZES.length) || 5,
            sku: `${product._id}-${size}`
          }));

          product.sizes = SHOE_SIZES;
          product.variants = variants;
          await product.save();
          updatedCount++;
          console.log(`✅ Đã thêm size giày cho: ${product.name}`);
        }
      }
    }

    // Cập nhật sản phẩm quần áo
    if (clothingCategories.length > 0) {
      const clothingProducts = await Product.find({
        category: { $in: clothingCategories.map(c => c._id) }
      });

      for (const product of clothingProducts) {
        if (!product.sizes || product.sizes.length === 0) {
          // Tạo variants cho mỗi size
          const variants = CLOTHING_SIZES.map(size => ({
            size,
            stock: Math.floor(product.stock / CLOTHING_SIZES.length) || 5,
            sku: `${product._id}-${size}`
          }));

          product.sizes = CLOTHING_SIZES;
          product.variants = variants;
          await product.save();
          updatedCount++;
          console.log(`✅ Đã thêm size quần áo cho: ${product.name}`);
        }
      }
    }

    console.log(`\n🎉 Hoàn thành! Đã cập nhật ${updatedCount} sản phẩm`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Đã ngắt kết nối MongoDB');
  }
}

addSizesToProducts();
