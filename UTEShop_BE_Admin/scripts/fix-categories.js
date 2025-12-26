const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://holam24062003_db_user:quangho123@cluster0.bpw0vps.mongodb.net/test';

async function fixCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Đổi tên Phụ kiện1 thành Phụ kiện
    await db.collection('categories').updateOne(
      { name: 'Phụ kiện1' },
      { $set: { name: 'Phụ kiện' } }
    );
    console.log('✅ Đã đổi tên "Phụ kiện1" thành "Phụ kiện"');

    // Lấy tất cả danh mục
    const aoCategory = await db.collection('categories').findOne({ name: 'Áo' });
    const quanCategory = await db.collection('categories').findOne({ name: 'Quần' });
    const giayCategory = await db.collection('categories').findOne({ name: 'Giày' });
    const phuKienCategory = await db.collection('categories').findOne({ name: 'Phụ kiện' });

    console.log('\n📁 Danh mục:');
    console.log(`  - Áo: ${aoCategory?._id}`);
    console.log(`  - Quần: ${quanCategory?._id}`);
    console.log(`  - Giày: ${giayCategory?._id}`);
    console.log(`  - Phụ kiện: ${phuKienCategory?._id}`);

    // Keywords cho từng danh mục
    const quanKeywords = ['quần', 'quan', 'pants', 'jeans', 'short', 'trouser', 'cargo', 'baggy', 'chino', 'slim fit', 'skinny'];
    const aoKeywords = ['áo', 'ao', 'shirt', 'hoodie', 'jacket', 'polo', 'sơ mi', 'thun'];
    const giayKeywords = ['giày', 'giay', 'shoe', 'sneaker', 'sandal', 'boot', 'loafer', 'derby', 'oxford', 'mule', 'adizero', 'campus', 'ultrarun', 'metcon', 'pegasus', 'air max', 'vapor', 'acg zoom', 'sb malor'];
    const phuKienKeywords = ['khăn', 'khan', 'thắt lưng', 'that lung', 'mũ', 'cà vạt', 'ca vat', 'vòng cổ', 'vong co', 'vòng tay', 'vong tay', 'ví', 'túi', 'tui', 'nơ', 'kính', 'belt', 'hat', 'cap', 'bag', 'wallet', 'glasses', 'scarf', 'tie', 'bracelet', 'necklace'];

    const products = await db.collection('products').find({}).toArray();
    console.log(`\n📦 Tổng số sản phẩm: ${products.length}`);
    console.log('\n🔄 Đang cập nhật danh mục...\n');

    let aoCount = 0, quanCount = 0, giayCount = 0, phuKienCount = 0;

    for (const product of products) {
      const name = product.name.toLowerCase();
      let newCategoryId = null;
      let categoryName = '';

      // Kiểm tra theo thứ tự ưu tiên: Quần > Giày > Áo > Phụ kiện
      if (quanKeywords.some(kw => name.includes(kw))) {
        newCategoryId = quanCategory?._id;
        categoryName = 'Quần';
        quanCount++;
      } else if (giayKeywords.some(kw => name.includes(kw))) {
        newCategoryId = giayCategory?._id;
        categoryName = 'Giày';
        giayCount++;
      } else if (aoKeywords.some(kw => name.includes(kw))) {
        newCategoryId = aoCategory?._id;
        categoryName = 'Áo';
        aoCount++;
      } else if (phuKienKeywords.some(kw => name.includes(kw))) {
        newCategoryId = phuKienCategory?._id;
        categoryName = 'Phụ kiện';
        phuKienCount++;
      }

      if (newCategoryId) {
        await db.collection('products').updateOne(
          { _id: product._id },
          { $set: { category: newCategoryId } }
        );
        console.log(`  ✅ "${product.name}" → ${categoryName}`);
      } else {
        console.log(`  ⚠️ "${product.name}" → Không xác định được danh mục`);
      }
    }

    console.log('\n📊 Thống kê:');
    console.log(`  - Áo: ${aoCount} sản phẩm`);
    console.log(`  - Quần: ${quanCount} sản phẩm`);
    console.log(`  - Giày: ${giayCount} sản phẩm`);
    console.log(`  - Phụ kiện: ${phuKienCount} sản phẩm`);
    console.log('\n🎉 Hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

fixCategories();
