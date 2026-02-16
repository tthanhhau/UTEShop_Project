import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './src/models/order.js';
import User from './src/models/user.js';
import Product from './src/models/product.js';

dotenv.config();

console.log('🧪 Testing Order Creation with Complete Shipping Info...\n');

async function createTestOrder() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find a test user
        const user = await User.findOne();
        if (!user) {
            console.error('❌ No user found in database. Please create a user first.');
            return;
        }
        console.log(`✅ Found test user: ${user.name} (${user.email})\n`);

        // Find a test product
        const product = await Product.findOne({ stock: { $gt: 0 } });
        if (!product) {
            console.error('❌ No product with stock found. Please add products first.');
            return;
        }
        console.log(`✅ Found test product: ${product.name} (Stock: ${product.stock})\n`);

        // Create order with COMPLETE shipping info
        const testOrder = new Order({
            user: user._id,
            customerName: user.name || 'Test Customer',
            customerPhone: user.phone || '0987654321',
            items: [
                {
                    product: product._id,
                    quantity: 1,
                    price: product.price,
                    originalPrice: product.price,
                    discountPercentage: product.discountPercentage || 0,
                    discountedPrice: product.price - (product.price * (product.discountPercentage || 0) / 100),
                }
            ],
            totalPrice: product.price,
            shippingAddress: '123 Nguyen Van Cu, Phường 1, Quận 5, Thành phố Hồ Chí Minh',
            paymentMethod: 'COD',
            paymentStatus: 'unpaid',
            status: 'pending',
            // ✅ COMPLETE SHIPPING INFO - This is what we need!
            shippingInfo: {
                toDistrictId: 1542,                          // Quận 5
                toWardCode: '21211',                         // Phường 1
                province: 'Thành phố Hồ Chí Minh',          // ✅ TEXT NAME
                district: 'Quận 5',                          // ✅ TEXT NAME
                ward: 'Phường 1',                            // ✅ TEXT NAME
                shippingFee: 37500,
            },
            codDetails: {
                phoneNumberConfirmed: false,
                additionalNotes: 'Test order with complete shipping info',
            },
        });

        await testOrder.save();
        console.log('✅ Test order created successfully!\n');
        console.log('📦 Order Details:');
        console.log(`   - Order ID: ${testOrder._id}`);
        console.log(`   - Customer: ${testOrder.customerName}`);
        console.log(`   - Phone: ${testOrder.customerPhone}`);
        console.log(`   - Status: ${testOrder.status}`);
        console.log(`   - Total: ${testOrder.totalPrice.toLocaleString()} VND`);
        console.log('\n📍 Shipping Info:');
        console.log(`   - Province: ${testOrder.shippingInfo.province} ✅`);
        console.log(`   - District: ${testOrder.shippingInfo.district} ✅`);
        console.log(`   - Ward: ${testOrder.shippingInfo.ward} ✅`);
        console.log(`   - District ID: ${testOrder.shippingInfo.toDistrictId}`);
        console.log(`   - Ward Code: ${testOrder.shippingInfo.toWardCode}`);
        console.log(`   - Shipping Fee: ${testOrder.shippingInfo.shippingFee.toLocaleString()} VND`);
        console.log(`   - Full Address: ${testOrder.shippingAddress}`);

        console.log('\n⏰ Agenda Job:');
        console.log('   The "process pending order" job should run in 1 minute.');
        console.log('   It will:');
        console.log('   1. Change status to "processing"');
        console.log('   2. Create GHTK shipping order');
        console.log('   3. Change status to "shipped"');
        console.log('   4. Save tracking code');
        console.log('\n👀 Watch your backend logs for:');
        console.log('   - "📦 Processing job for orderId: ..."');
        console.log('   - "🚚 Creating shipping order for ..."');
        console.log('   - "✅ Shipping order created: S..."');
        console.log('\n⏳ Waiting 65 seconds to verify job execution...\n');

        // Wait 65 seconds (1 minute + 5 seconds buffer)
        await new Promise(resolve => setTimeout(resolve, 65000));

        // Check order status after job should have run
        const updatedOrder = await Order.findById(testOrder._id);
        console.log('🔍 Checking order status after 1 minute...\n');
        console.log(`   - Current Status: ${updatedOrder.status}`);

        if (updatedOrder.shippingInfo.trackingCode) {
            console.log(`   - Tracking Code: ${updatedOrder.shippingInfo.trackingCode} ✅`);
            console.log(`   - Provider: ${updatedOrder.shippingInfo.provider}`);
            console.log('\n🎉 SUCCESS! GHTK order was created automatically!');
        } else {
            console.log('   - Tracking Code: ❌ Not yet created');
            console.log('\n⚠️  Job might still be running or there was an error.');
            console.log('   Check backend logs for details.');
        }

        console.log('\n📝 To verify manually:');
        console.log(`   node verify-order-data.js`);
        console.log(`   Or check MongoDB: db.orders.findOne({ _id: ObjectId("${testOrder._id}") })`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

createTestOrder();
