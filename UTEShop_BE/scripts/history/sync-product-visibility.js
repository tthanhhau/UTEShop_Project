import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/models/product.js';

dotenv.config();

const syncProductVisibility = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion_store');
        console.log('✅ Connected to MongoDB');

        // Find all products that don't have isVisible field
        const productsWithoutVisibility = await Product.find({ isVisible: { $exists: false } });

        if (productsWithoutVisibility.length === 0) {
            console.log('✅ All products already have isVisible field');
            return;
        }

        console.log(`📝 Found ${productsWithoutVisibility.length} products without isVisible field`);

        // Update all products to add isVisible field and sync with isActive
        const updateResult = await Product.updateMany(
            { isVisible: { $exists: false } },
            {
                $set: {
                    isVisible: true,  // Default to true for existing products
                    // Ensure isActive is also set if it doesn't exist
                    ...(process.env.FORCE_SYNC_ACTIVE === 'true' ? { isActive: true } : {})
                }
            }
        );

        console.log(`✅ Updated ${updateResult.modifiedCount} products`);

        // Verify the update
        const productsStillWithoutVisibility = await Product.find({ isVisible: { $exists: false } });

        if (productsStillWithoutVisibility.length === 0) {
            console.log('✅ All products now have isVisible field');
        } else {
            console.log(`❌ Still ${productsStillWithoutVisibility.length} products without isVisible field`);
        }

        // Check for any products where isActive and isVisible are not synchronized
        const unsyncedProducts = await Product.find({
            $expr: { $ne: ['$isActive', '$isVisible'] }
        });

        if (unsyncedProducts.length > 0) {
            console.log(`⚠️ Found ${unsyncedProducts.length} products with unsynchronized isActive/isVisible`);

            // Sync them
            for (const product of unsyncedProducts) {
                await Product.findByIdAndUpdate(product._id, {
                    isVisible: product.isActive
                });
            }

            console.log(`✅ Synchronized ${unsyncedProducts.length} products`);
        }

    } catch (error) {
        console.error('❌ Error syncing product visibility:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run the sync
syncProductVisibility();