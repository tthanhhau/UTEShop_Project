import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './src/models/order.js';

dotenv.config();

console.log('🔍 Verifying Order Data Structure...\n');

async function verifyOrders() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all orders
        const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
        console.log(`📦 Found ${orders.length} recent orders\n`);

        // Analyze each order
        for (const order of orders) {
            console.log('═══════════════════════════════════════════════════════');
            console.log(`Order ID: ${order._id}`);
            console.log(`Status: ${order.status}`);
            console.log(`Created: ${order.createdAt}`);
            console.log(`Customer: ${order.customerName}`);
            console.log(`Phone: ${order.customerPhone}`);

            if (order.shippingInfo) {
                console.log('\n📍 Shipping Info:');
                console.log(`  - toDistrictId: ${order.shippingInfo.toDistrictId} (${typeof order.shippingInfo.toDistrictId})`);
                console.log(`  - toWardCode: ${order.shippingInfo.toWardCode} (${typeof order.shippingInfo.toWardCode})`);
                console.log(`  - province: ${order.shippingInfo.province || '❌ MISSING'} (${typeof order.shippingInfo.province})`);
                console.log(`  - district: ${order.shippingInfo.district || '❌ MISSING'} (${typeof order.shippingInfo.district})`);
                console.log(`  - ward: ${order.shippingInfo.ward || '❌ MISSING'} (${typeof order.shippingInfo.ward})`);
                console.log(`  - shippingFee: ${order.shippingInfo.shippingFee}`);

                if (order.shippingInfo.trackingCode) {
                    console.log(`  - trackingCode: ${order.shippingInfo.trackingCode}`);
                    console.log(`  - provider: ${order.shippingInfo.provider}`);
                }

                // Check if order has complete data
                const hasCompleteData =
                    order.shippingInfo.province &&
                    order.shippingInfo.district &&
                    order.shippingInfo.ward;

                if (hasCompleteData) {
                    console.log('\n✅ This order has COMPLETE shipping data (can create GHTK order)');
                } else {
                    console.log('\n❌ This order is MISSING text names (OLD order, cannot create GHTK order)');
                    console.log('   → Need to place a NEW order to test shipping integration');
                }
            } else {
                console.log('\n❌ No shipping info at all');
            }

            console.log('');
        }

        console.log('═══════════════════════════════════════════════════════\n');

        // Summary
        const ordersWithCompleteData = orders.filter(o =>
            o.shippingInfo?.province &&
            o.shippingInfo?.district &&
            o.shippingInfo?.ward
        );

        const ordersWithMissingData = orders.filter(o =>
            o.shippingInfo &&
            (!o.shippingInfo.province || !o.shippingInfo.district || !o.shippingInfo.ward)
        );

        console.log('📊 SUMMARY:');
        console.log(`  - Total orders checked: ${orders.length}`);
        console.log(`  - Orders with COMPLETE data: ${ordersWithCompleteData.length} ✅`);
        console.log(`  - Orders with MISSING data: ${ordersWithMissingData.length} ❌`);
        console.log('');

        if (ordersWithMissingData.length > 0) {
            console.log('⚠️  WARNING: Found orders with missing text names!');
            console.log('   These are OLD orders created before the fix.');
            console.log('   They CANNOT be used to create GHTK shipping orders.');
            console.log('   Please place a NEW order to test the shipping integration.\n');
        }

        if (ordersWithCompleteData.length > 0) {
            console.log('✅ Found orders with complete data!');
            console.log('   These orders CAN be used to create GHTK shipping orders.');
            console.log('   The automatic shipping creation should work for these orders.\n');
        }

        if (ordersWithCompleteData.length === 0 && ordersWithMissingData.length > 0) {
            console.log('🎯 ACTION REQUIRED:');
            console.log('   1. Go to the frontend checkout page');
            console.log('   2. Place a NEW order with full address selection');
            console.log('   3. Wait 1 minute for automatic GHTK order creation');
            console.log('   4. Check backend logs for success/error\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

verifyOrders();
