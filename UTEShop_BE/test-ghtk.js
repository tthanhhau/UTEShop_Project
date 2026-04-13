import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

console.log('Testing GHTK API Connection...\n');

console.log('Configuration:');
console.log('- API URL:', process.env.GHTK_API_URL);
console.log('- Token:', process.env.GHTK_TOKEN ? 'Set' : 'Missing');
console.log('- Pick Address:', process.env.GHTK_PICK_ADDRESS);
console.log('- Pick Province:', process.env.GHTK_PICK_PROVINCE);
console.log('- Pick District:', process.env.GHTK_PICK_DISTRICT);
console.log('- Pick Ward:', process.env.GHTK_PICK_WARD);
console.log('- Pick Tel:', process.env.GHTK_PICK_TEL);
console.log('\n');
console.log('Using GHTK pickup env vars as the default test address.');
console.log('Override with TEST_SHIPPING_* only when you want a different receiver address.\n');

const testAddress = {
    address: process.env.TEST_SHIPPING_ADDRESS || process.env.GHTK_PICK_ADDRESS || '123 Nguyen Van Cu',
    province: process.env.TEST_SHIPPING_PROVINCE || process.env.GHTK_PICK_PROVINCE || 'TP Hồ Chí Minh',
    district: process.env.TEST_SHIPPING_DISTRICT || process.env.GHTK_PICK_DISTRICT || 'Quận 5',
    ward: process.env.TEST_SHIPPING_WARD || process.env.GHTK_PICK_WARD || 'Phường 1',
};

async function testCalculateFee() {
    console.log('Test 1: Calculate Shipping Fee');
    console.log(`Testing shipping to ${testAddress.ward}, ${testAddress.district}, ${testAddress.province}...\n`);

    try {
        const response = await axios.get(
            `${process.env.GHTK_API_URL}/shipment/fee`,
            {
                params: {
                    pick_address: process.env.GHTK_PICK_ADDRESS,
                    pick_province: process.env.GHTK_PICK_PROVINCE,
                    pick_district: process.env.GHTK_PICK_DISTRICT,
                    pick_ward: process.env.GHTK_PICK_WARD,
                    address: testAddress.address,
                    province: testAddress.province,
                    district: testAddress.district,
                    ward: testAddress.ward,
                    weight: 1000,
                    value: 500000,
                },
                headers: {
                    Token: process.env.GHTK_TOKEN,
                },
            }
        );

        if (response.data.success) {
            console.log('SUCCESS - Shipping Fee Calculated:');
            console.log('   - Fee:', response.data.fee.fee.toLocaleString(), 'VND');
            console.log('   - Insurance Fee:', response.data.fee.insurance_fee.toLocaleString(), 'VND');
            console.log('   - Delivery Option:', response.data.fee.delivery_option);
            console.log('   - Delivery:', response.data.fee.delivery ? 'Available' : 'Not Available');
            console.log('\n');
            return true;
        }

        console.log('FAILED - Response:', response.data);
        console.log('\n');
        return false;
    } catch (error) {
        console.log('ERROR:', error.response?.data || error.message);
        if (error.response?.data) {
            console.log('   Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        console.log('\n');
        return false;
    }
}

async function testCreateOrder() {
    console.log('Test 2: Create Test Order');
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
                    address: `${testAddress.address}, Khu pho 1`,
                    province: testAddress.province,
                    district: testAddress.district,
                    ward: testAddress.ward,
                    hamlet: 'Khac',
                    is_freeship: '0',
                    pick_money: 100000,
                    note: 'Test order - will be cancelled',
                    value: 100000,
                },
            },
            {
                headers: {
                    Token: process.env.GHTK_TOKEN,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data.success) {
            console.log('SUCCESS - Order Created:');
            console.log('   - Label (Tracking Code):', response.data.order.label);
            console.log('   - Partner ID:', response.data.order.partner_id);
            console.log('   - Estimated Pick Time:', response.data.order.estimated_pick_time);
            console.log('   - Estimated Deliver Time:', response.data.order.estimated_deliver_time);
            console.log('   - Fee:', response.data.order.fee.toLocaleString(), 'VND');
            console.log('\n');

            console.log('Cancelling test order...');
            await cancelTestOrder(response.data.order.label);

            return true;
        }

        console.log('FAILED - Response:', response.data);
        console.log('\n');
        return false;
    } catch (error) {
        console.log('ERROR:', error.response?.data || error.message);
        if (error.response?.data) {
            console.log('   Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        console.log('\n');
        return false;
    }
}

async function cancelTestOrder(label) {
    try {
        const response = await axios.post(
            `${process.env.GHTK_API_URL}/shipment/cancel/${label}`,
            {},
            {
                headers: {
                    Token: process.env.GHTK_TOKEN,
                },
            }
        );

        if (response.data.success) {
            console.log('Test order cancelled successfully\n');
        } else {
            console.log('Could not cancel test order:', response.data.message);
            console.log('Please cancel manually: Label =', label, '\n');
        }
    } catch (error) {
        console.log('Could not cancel test order:', error.response?.data?.message || error.message);
        console.log('Please cancel manually: Label =', label, '\n');
    }
}

async function runAllTests() {
    console.log('=======================================================\n');

    const test1Result = await testCalculateFee();

    if (test1Result) {
        console.log('=======================================================\n');
        const test2Result = await testCreateOrder();

        console.log('=======================================================');
        console.log('\nTest Summary:');
        console.log('   - Calculate Fee:', test1Result ? 'PASSED' : 'FAILED');
        console.log('   - Create Order:', test2Result ? 'PASSED' : 'FAILED');
        console.log('\n');

        if (test1Result && test2Result) {
            console.log('All tests passed! GHTK integration is working correctly.\n');
        } else {
            console.log('Some tests failed. Please check the configuration.\n');
        }
    } else {
        console.log('=======================================================');
        console.log('\nBasic test failed. Skipping advanced tests.');
        console.log('\nCommon issues:');
        console.log('   1. Check if GHTK_TOKEN is correct');
        console.log('   2. Verify pick address matches GHTK registration');
        console.log('   3. Ensure province/district/ward names are exact');
        console.log('   4. Update TEST_SHIPPING_* env vars to current post-merge addresses');
        console.log('\n');
    }
}

runAllTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
