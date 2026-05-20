const mongoose = require('mongoose');
require('dotenv').config();

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uteshop';

console.log('🔗 Connecting to:', MONGODB_URI.substring(0, 30) + '...');

// Define Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sizes: [{
    size: String,
    stock: Number
  }],
  stock: Number
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Define Category Schema
const categorySchema = new mongoose.Schema({
  name: String
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

async function addSampleSizes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Lấy tất cả sản phẩm
    const products = await Product.find().populate('category');
    
    console.log(`📦 Tìm thấy ${products.length} sản phẩm`);

    let updatedCount = 0;

    for (const product of products) {
      // Kiểm tra nếu sizes là array of strings (format cũ)
      if (product.sizes && product.sizes.length > 0) {
        const firstSize = product.sizes[0];
        
        // Nếu là string (format cũ), chuyển đổi sang format mới
        if (typeof firstSize === 'string') {
          console.log(`🔄 Chuyển đổi format cũ sang mới: "${product.name}"`);
          const stockPerSize = Math.floor(product.stock / product.sizes.length) || 10;
          
          product.sizes = product.sizes.map(size => ({
            size: size,
            stock: stockPerSize
          }));
          
          product.stock = product.sizes.reduce((sum, item) => sum + item.stock, 0);
          await product.save();
          updatedCount++;
          console.log(`✅ Đã chuyển đổi: ${product.sizes.map(s => `${s.size}(${s.stock})`).join(', ')}`);
          continue;
        }
        
        // Nếu đã đúng format (object), bỏ qua
        if (typeof firstSize === 'object' && firstSize.size) {
          console.log(`⏭️  Bỏ qua "${product.name}" - đã đúng format`);
          continue;
        }
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
