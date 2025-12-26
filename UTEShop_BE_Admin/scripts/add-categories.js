const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://holam24062003_db_user:quangho123@cluster0.bpw0vps.mongodb.net/test';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  logo: String,
  website: String,
  country: String,
}, { timestamps: true });

async function addCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB (database: test)');

    const Category = mongoose.model('Category', categorySchema, 'categories');

    const categories = [
      { name: 'Áo', description: 'Các loại áo thun, sơ mi, hoodie, áo khoác' },
      { name: 'Giày', description: 'Sneaker, sandal, giày da, giày thể thao' },
      { name: 'Phụ kiện', description: 'Mũ, túi xách, thắt lưng, kính mắt' },
    ];

    for (const cat of categories) {
      const existing = await Category.findOne({ name: cat.name });
      if (existing) {
        console.log(`⚠️ Danh mục "${cat.name}" đã tồn tại`);
      } else {
        await Category.create(cat);
        console.log(`✅ Đã thêm danh mục: ${cat.name}`);
      }
    }

    console.log('\n🎉 Hoàn thành!');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addCategories();
