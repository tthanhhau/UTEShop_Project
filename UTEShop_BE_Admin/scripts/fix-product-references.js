const mongoose = require('mongoose');
require('dotenv').config();

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uteshop';

console.log('🔗 Connecting to:', MONGODB_URI.substring(0, 30) + '...');

// Define Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  category: mongoose.Schema.Types.ObjectId,
  brand: mongoose.Schema.Types.ObjectId,
  sizes: [{
    size: String,
    stock: Number
  }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

async function fixProductReferences() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Lấy tất cả sản phẩm
    const products = await productsCollection.find({}).toArray();
    
    console.log(`📦 Tìm thấy ${products.length} sản phẩm`);

    let fixedCount = 0;

    for (const product of products) {
      const updates = {};
      
      // Kiểm tra category
      if (product.category && typeof product.category === 'string') {
        console.log(`🔧 Fixing category for: ${product.name}`);
        updates.category = new mongoose.Types.ObjectId(product.category);
      }
      
      // Kiểm tra brand
      if (product.brand && typeof product.brand === 'string') {
        console.log(`🔧 Fixing brand for: ${product.name}`);
        updates.brand = new mongoose.Types.ObjectId(product.brand);
      }
      
      if (Object.keys(updates).length > 0) {
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: updates }
        );
        fixedCount++;
        console.log(`✅ Fixed: ${product.name}`);
      }
    }

    console.log(`\n🎉 Hoàn thành! Đã fix ${fixedCount} sản phẩm`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Đã ngắt kết nối MongoDB');
  }
}

fixProductReferences();
