const mongoose = require('mongoose');

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uteshop';

// Define Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  sizes: [{
    size: String,
    stock: Number
  }],
  variants: [{
    size: String,
    stock: Number
  }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

async function migrateProductSizes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Tìm tất cả sản phẩm có variants (cấu trúc cũ)
    const products = await Product.find({ variants: { $exists: true, $ne: [] } });
    
    console.log(`📦 Tìm thấy ${products.length} sản phẩm cần migrate`);

    let migratedCount = 0;

    for (const product of products) {
      if (product.variants && product.variants.length > 0) {
        // Chuyển đổi từ variants sang sizes
        product.sizes = product.variants.map(v => ({
          size: v.size,
          stock: v.stock
        }));

        // Xóa field variants cũ
        product.variants = undefined;

        await product.save();
        migratedCount++;
        console.log(`✅ Đã migrate sản phẩm: ${product.name}`);
      }
    }

    console.log(`\n🎉 Hoàn thành! Đã migrate ${migratedCount} sản phẩm`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Đã ngắt kết nối MongoDB');
  }
}

migrateProductSizes();
