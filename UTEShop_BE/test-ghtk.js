import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

console.log('🚀 Testing GHTK API Connection...\n');

// Kiểm tra config
console.log('📋 Configuration:');
console.log('- API URL:', process.env.GHTK_API_URL);
console.log('- Token:', process.env.GHTK_TOKEN ? '✅ Set' : '❌ Missing');
console.log('- Pick Address:', process.env.GHTK_PICK_ADDRESS);
console.log('- Pick Province:', process.env.GHTK_PICK_PROVINCE);
console.log('- Pick District:', process.env.GHTK_PICK_DISTRICT);
console.log('- Pick Ward:', process.env.GHTK_PICK_WARD);
console.log('- Pick Tel:', process.env.GHTK_PICK_TEL);
console.log('\n');

// Test 1: Tính phí vận chuyển
async function testCalculateFee() {
    console.log('📦 Test 1: Calculate Shipping Fee');
    console.log('Testing shipping from Quận 1 to Quận 5...\n');

    try {
        const response = await axios.get(
            `${process.env.GHTK_API_URL}/shipment/fee`,
            {
                params: {
                    pick_address: process.env.GHTK_PICK_ADDRESS,
                    pick_province: process.env.GHTK_PICK_PROVINCE,
                    pick_district: process.env.GHTK_PICK_DISTRICT,
                    pick_ward: process.env.GHTK_PICK_WARD,
                    address: '123 Nguyen Van Cu',
                    province: 'TP Hồ Chí Minh',
                    district: 'Quận 5',
                    ward: 'Phường 1',
                    weight: 1000, // 1kg
                    value: 500000, // 500k VND
                },
                headers: {
                    'Token': process.env.GHTK_TOKEN,
                },
            }
        );

        if (response.data.success) {
            console.log('✅ SUCCESS - Shipping Fee Calculated:');
            console.log('   - Fee:', response.data.fee.fee.toLocaleString(), 'VND');
            console.log('   - Insurance Fee:', response.data.fee.insurance_fee.toLocaleString(), 'VND');
            console.log('   - Delivery Option:', response.data.fee.delivery_option);
            console.log('   - Delivery:', response.data.fee.delivery ? 'Available' : 'Not Available');
            console.log('\n');
            return true;
        } else {
            console.log('❌ FAILED - Response:', response.data);
            console.log('\n');
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.response?.data || error.message);
        if (error.response?.data) {
            console.log('   Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        console.log('\n');
        return false;
    }
}

// Test 2: Tạo đơn hàng test (sẽ hủy ngay sau đó)
async function testCreateOrder() {
    console.log('📦 Test 2: Create Test Order');
    console.log('Creating a test shipping order...\n');

    const testOrderId = `TEST_${Date.now()}`;

    try {
        const response = await axios.post(
            `${process.env.GHTK_API_URL}/shipment/order`,
            {
                products: [
                    {
                        name: 'Test Product',
                        weight: 0.5,
                        quantity: 1,
                        price: 100000,
                    },
                ],
                order: {
                    id: testOrderId,
                    pick_name: process.env.GHTK_PICK_NAME || 'Shop Test',
                    pick_address: process.env.GHTK_PICK_ADDRESS,
                    pick_province: process.env.GHTK_PICK_PROVINCE,
                    pick_district: process.env.GHTK_PICK_DISTRICT,
                    pick_ward: process.env.GHTK_PICK_WARD,
                    pick_tel: process.env.GHTK_PICK_TEL,
                    tel: '0901234567',
                    name: 'Nguyen Van A',
                    address: '123 Nguyen Van Cu, Khu pho 1',
                    province: 'TP Hồ Chí Minh',
                    district: 'Quận 5',
                    ward: 'Phường 1',
                    hamlet: 'Khác',
                    is_freeship: '0',
                    pick_money: 100000,
                    note: 'Test order - will be cancelled',
                    value: 100000,
                },
            },
            {
                headers: {
                    'Token': process.env.GHTK_TOKEN,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data.success) {
            console.log('✅ SUCCESS - Order Created:');
            console.log('   - Label (Tracking Code):', response.data.order.label);
            console.log('   - Partner ID:', response.data.order.partner_id);
            console.log('   - Estimated Pick Time:', response.data.order.estimated_pick_time);
            console.log('   - Estimated Deliver Time:', response.data.order.estimated_deliver_time);
            console.log('   - Fee:', response.data.order.fee.toLocaleString(), 'VND');
            console.log('\n');

            // Tự động hủy đơn test
            console.log('🗑️  Cancelling test order...');
            await cancelTestOrder(response.data.order.label);

            return true;
        } else {
            console.log('❌ FAILED - Response:', response.data);
            console.log('\n');
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.response?.data || error.message);
        if (error.response?.data) {
            console.log('   Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        console.log('\n');
        return false;
    }
}

// Hủy đơn test
async function cancelTestOrder(label) {
    try {
        const response = await axios.post(
            `${process.env.GHTK_API_URL}/shipment/cancel/${label}`,
            {},
            {
                headers: {
                    'Token': process.env.GHTK_TOKEN,
                },
            }
        );

        if (response.data.success) {
            console.log('✅ Test order cancelled successfully\n');
        } else {
            console.log('⚠️  Could not cancel test order:', response.data.message);
            console.log('   Please cancel manually: Label =', label, '\n');
        }
    } catch (error) {
        console.log('⚠️  Could not cancel test order:', error.response?.data?.message || error.message);
        console.log('   Please cancel manually: Label =', label, '\n');
    }
}

// Chạy tất cả tests
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════\n');

    const test1Result = await testCalculateFee();

    if (test1Result) {
        console.log('═══════════════════════════════════════════════════════\n');
        const test2Result = await testCreateOrder();

        console.log('═══════════════════════════════════════════════════════');
        console.log('\n📊 Test Summary:');
        console.log('   - Calculate Fee:', test1Result ? '✅ PASSED' : '❌ FAILED');
        console.log('   - Create Order:', test2Result ? '✅ PASSED' : '❌ FAILED');
        console.log('\n');

        if (test1Result && test2Result) {
            console.log('🎉 All tests passed! GHTK integration is working correctly.\n');
        } else {
            console.log('⚠️  Some tests failed. Please check the configuration.\n');
        }
    } else {
        console.log('═══════════════════════════════════════════════════════');
        console.log('\n❌ Basic test failed. Skipping advanced tests.');
        console.log('\n💡 Common issues:');
        console.log('   1. Check if GHTK_TOKEN is correct');
        console.log('   2. Verify pick address matches GHTK registration');
        console.log('   3. Ensure province/district/ward names are exact');
        console.log('\n');
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
