import mongoose from 'mongoose';
import Product from '../src/models/product.js';
import Category from '../src/models/category.js';

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uteshop';

async function addSampleSizes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Lấy tất cả sản phẩm
    const products = await Product.find().populate('category');
    
    console.log(`📦 Tìm thấy ${products.length} sản phẩm`);

    let updatedCount = 0;

    for (const product of products) {
      // Bỏ qua nếu đã có sizes
      if (product.sizes && product.sizes.length > 0) {
        console.log(`⏭️  Bỏ qua "${product.name}" - đã có sizes`);
        continue;
      }

      const categoryName = product.category?.name?.toLowerCase() || '';
      
      // Kiểm tra xem có phải quần áo không
      if (categoryName.includes('quần') || categoryName.includes('áo') || categoryName.includes('clothing')) {
        // Thêm sizes cho quần áo
        const clothingSizes = ['S', 'M', 'L', 'XL'];
        const stockPerSize = Math.floor(product.stock / clothingSizes.length) || 10;
        
        product.sizes = clothingSizes.map(size => ({
          size: size,
          stock: stockPerSize
        }));
        
        // Cập nhật tổng stock
        product.stock = product.sizes.reduce((sum, item) => sum + item.stock, 0);
        
        await product.save();
        updatedCount++;
        console.log(`✅ Đã thêm sizes cho quần áo: ${product.name}`);
        console.log(`   Sizes: ${product.sizes.map(s => `${s.size}(${s.stock})`).join(', ')}`);
      }
      // Kiểm tra xem có phải giày không
      else if (categoryName.includes('giày') || categoryName.includes('shoe')) {
        // Thêm sizes cho giày
        const shoeSizes = ['38', '39', '40', '41', '42'];
        const stockPerSize = Math.floor(product.stock / shoeSizes.length) || 10;
        
        product.sizes = shoeSizes.map(size => ({
          size: size,
          stock: stockPerSize
        }));
        
        // Cập nhật tổng stock
        product.stock = product.sizes.reduce((sum, item) => sum + item.stock, 0);
        
        await product.save();
        updatedCount++;
        console.log(`✅ Đã thêm sizes cho giày: ${product.name}`);
        console.log(`   Sizes: ${product.sizes.map(s => `${s.size}(${s.stock})`).join(', ')}`);
      } else {
        console.log(`⏭️  Bỏ qua "${product.name}" - không phải quần áo hoặc giày`);
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

addSampleSizes();
