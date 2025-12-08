const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkProduct() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}));
    const Category = mongoose.model('Category', new mongoose.Schema({}, {strict: false}));
    const Brand = mongoose.model('Brand', new mongoose.Schema({}, {strict: false}));

    // Tìm sản phẩm mới nhất
    const latestProduct = await Product.findOne().sort({createdAt: -1});
    console.log('\n📦 Latest product:', latestProduct.name);
    console.log('Category ID:', latestProduct.category);
    console.log('Category type:', typeof latestProduct.category);
    console.log('Brand ID:', latestProduct.brand);
    console.log('Brand type:', typeof latestProduct.brand);

    // Tìm category "Áo"
    const aoCategory = await Category.findOne({name: 'Áo'});
    console.log('\n👕 Category "Áo" ID:', aoCategory._id);
    console.log('Match?', latestProduct.category.toString() === aoCategory._id.toString());

    // Tìm brand "H&M"
    const hmBrand = await Brand.findOne({name: 'H&M'});
    console.log('\n🏷️  Brand "H&M" ID:', hmBrand._id);
    console.log('Match?', latestProduct.brand.toString() === hmBrand._id.toString());

    // Test query
    console.log('\n🔍 Testing query...');
    const results = await Product.find({
      category: aoCategory._id,
      brand: hmBrand._id
    }).sort({createdAt: -1}).limit(5);
    
    console.log(`Found ${results.length} products:`);
    results.forEach(p => console.log(`  - ${p.name}`));

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
  }
}

checkProduct();
