const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://holam24062003_db_user:quangho123@cluster0.bpw0vps.mongodb.net/test';

async function updateProductCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB (database: test)');

    const db = mongoose.connection.db;
    
    // Lấy danh sách categories
    const categories = await db.collection('categories').find({}).toArray();
    console.log('\n📁 Danh mục hiện có:');
    categories.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.name} (${cat._id})`);
    });

    // Lấy danh sách products có category không hợp lệ
    const validCategoryIds = categories.map(c => c._id);
    const products = await db.collection('products').find({}).toArray();
    
    console.log(`\n📦 Tổng số sản phẩm: ${products.length}`);
    
    // Tìm sản phẩm có category không hợp lệ
    const invalidProducts = products.filter(p => {
      if (!p.category) return true;
      return !validCategoryIds.some(id => id.toString() === p.category.toString());
    });

    console.log(`⚠️ Sản phẩm có danh mục không hợp lệ: ${invalidProducts.length}`);

    if (invalidProducts.length === 0) {
      console.log('✅ Tất cả sản phẩm đều có danh mục hợp lệ!');
      return;
    }

    // Phân loại sản phẩm theo tên để gán danh mục phù hợp
    const aoCategory = categories.find(c => c.name === 'Áo');
    const giayCategory = categories.find(c => c.name === 'Giày');
    const phuKienCategory = categories.find(c => c.name === 'Phụ kiện');

    console.log('\n🔄 Đang cập nhật danh mục cho sản phẩm...');

    for (const product of invalidProducts) {
      let newCategoryId;
      const name = product.name.toLowerCase();

      // Phân loại dựa trên tên sản phẩm
      if (name.includes('áo') || name.includes('ao') || name.includes('shirt') || 
          name.includes('hoodie') || name.includes('jacket') || name.includes('polo')) {
        newCategoryId = aoCategory?._id;
      } else if (name.includes('giày') || name.includes('giay') || name.includes('shoe') || 
                 name.includes('sneaker') || name.includes('sandal') || name.includes('boot')) {
        newCategoryId = giayCategory?._id;
      } else {
        // Mặc định gán vào Phụ kiện
        newCategoryId = phuKienCategory?._id || aoCategory?._id;
      }

      if (newCategoryId) {
        await db.collection('products').updateOne(
          { _id: product._id },
          { $set: { category: newCategoryId } }
        );
        const catName = categories.find(c => c._id.toString() === newCategoryId.toString())?.name;
        console.log(`  ✅ "${product.name}" → ${catName}`);
      }
    }

    console.log('\n🎉 Hoàn thành cập nhật danh mục!');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateProductCategories();
