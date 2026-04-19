import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './src/models/order.js';
import User from './src/models/user.js';
import Product from './src/models/product.js';

dotenv.config();

console.log('Testing Order Creation with Complete Shipping Info...\n');

console.log('Using GHTK pickup env vars as the default test address.');
console.log('Override with TEST_SHIPPING_* only when you want a different receiver address.\n');

const testShippingInfo = {
    address: process.env.TEST_SHIPPING_FULL_ADDRESS || `${process.env.GHTK_PICK_ADDRESS || '123 Nguyen Van Cu'}, ${process.env.GHTK_PICK_WARD || 'Phường 1'}, ${process.env.GHTK_PICK_DISTRICT || 'Quận 5'}, ${process.env.GHTK_PICK_PROVINCE || 'TP Hồ Chí Minh'}`,
    toDistrictId: process.env.TEST_SHIPPING_DISTRICT_ID || '1542',
    toWardCode: process.env.TEST_SHIPPING_WARD_CODE || '21211',
    province: process.env.TEST_SHIPPING_PROVINCE || process.env.GHTK_PICK_PROVINCE || 'TP Hồ Chí Minh',
    district: process.env.TEST_SHIPPING_DISTRICT || process.env.GHTK_PICK_DISTRICT || 'Quận 5',
    ward: process.env.TEST_SHIPPING_WARD || process.env.GHTK_PICK_WARD || 'Phường 1',
    shippingFee: Number(process.env.TEST_SHIPPING_FEE || 37500),
};

async function createTestOrder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const user = await User.findOne();
        if (!user) {
            console.error('No user found in database. Please create a user first.');
            return;
        }
        console.log(`Found test user: ${user.name} (${user.email})\n`);

        const product = await Product.findOne({ stock: { $gt: 0 } });
        if (!product) {
            console.error('No product with stock found. Please add products first.');
            return;
        }
        console.log(`Found test product: ${product.name} (Stock: ${product.stock})\n`);

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
                },
            ],
            totalPrice: product.price,
            shippingAddress: testShippingInfo.address,
            paymentMethod: 'COD',
            paymentStatus: 'unpaid',
            status: 'pending',
            shippingInfo: {
                toDistrictId: testShippingInfo.toDistrictId,
                toWardCode: testShippingInfo.toWardCode,
                province: testShippingInfo.province,
                district: testShippingInfo.district,
                ward: testShippingInfo.ward,
                shippingFee: testShippingInfo.shippingFee,
            },
            codDetails: {
                phoneNumberConfirmed: false,
                additionalNotes: 'Test order with complete shipping info',
            },
        });

        await testOrder.save();
        console.log('Test order created successfully!\n');
        console.log('Order Details:');
        console.log(`   - Order ID: ${testOrder._id}`);
        console.log(`   - Customer: ${testOrder.customerName}`);
        console.log(`   - Phone: ${testOrder.customerPhone}`);
        console.log(`   - Status: ${testOrder.status}`);
        console.log(`   - Total: ${testOrder.totalPrice.toLocaleString()} VND`);
        console.log('\nShipping Info:');
        console.log(`   - Province: ${testOrder.shippingInfo.province}`);
        console.log(`   - District: ${testOrder.shippingInfo.district}`);
        console.log(`   - Ward: ${testOrder.shippingInfo.ward}`);
        console.log(`   - District ID: ${testOrder.shippingInfo.toDistrictId}`);
        console.log(`   - Ward Code: ${testOrder.shippingInfo.toWardCode}`);
        console.log(`   - Shipping Fee: ${testOrder.shippingInfo.shippingFee.toLocaleString()} VND`);
        console.log(`   - Full Address: ${testOrder.shippingAddress}`);

        console.log('\nAgenda Job:');
        console.log('   The "process pending order" job should run in 1 minute.');
        console.log('   It will:');
        console.log('   1. Change status to "processing"');
        console.log('   2. Create GHTK shipping order');
        console.log('   3. Change status to "shipped"');
        console.log('   4. Save tracking code');
        console.log('\nWatch your backend logs for:');
        console.log('   - "Processing job for orderId: ..."');
        console.log('   - "Creating shipping order for ..."');
        console.log('   - "Shipping order created: S..."');
        console.log('\nWaiting 65 seconds to verify job execution...\n');

        await new Promise((resolve) => setTimeout(resolve, 65000));

        const updatedOrder = await Order.findById(testOrder._id);
        console.log('Checking order status after 1 minute...\n');
        console.log(`   - Current Status: ${updatedOrder.status}`);

        if (updatedOrder.shippingInfo.trackingCode) {
            console.log(`   - Tracking Code: ${updatedOrder.shippingInfo.trackingCode}`);
            console.log(`   - Provider: ${updatedOrder.shippingInfo.provider}`);
            console.log('\nSUCCESS! GHTK order was created automatically!');
        } else {
            console.log('   - Tracking Code: Not yet created');
            console.log('\nJob might still be running or there was an error.');
            console.log('Check backend logs for details.');
        }

        console.log('\nTo verify manually:');
        console.log('   node verify-order-data.js');
        console.log(`   Or check MongoDB: db.orders.findOne({ _id: ObjectId("${testOrder._id}") })`);
        console.log('\nIf you are using the post-merge administrative map, update TEST_SHIPPING_* env vars before running this script.');
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

createTestOrder();
