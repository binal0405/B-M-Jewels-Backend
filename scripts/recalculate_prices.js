require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

// Load models
require("../model/MetalType");
require("../model/Purity");
require("../model/Rate");
require("../model/Category");
const Product = require("../model/Products");

async function run() {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Fetching dynamic price products...");
    const products = await Product.find({ price_is_fixed: false })
        .populate("metal_type")
        .populate("purity")
        .populate("rate");

    console.log(`Found ${products.length} products to update.`);

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
        try {
            const oldPrice = product.price;
            const finalPrice = await product.getFinalPrice();
            if (finalPrice !== null && finalPrice !== undefined) {
                product.price = finalPrice;
                await product.save();
                console.log(`[SUCCESS] "${product.product_name}": ${oldPrice.toFixed(2)} -> ${product.price.toFixed(2)}`);
                successCount++;
            } else {
                console.log(`[SKIP] "${product.product_name}" (null price, possibly missing rate or purity)`);
                failCount++;
            }
        } catch (err) {
            console.error(`[ERROR] "${product.product_name}": ${err.message}`);
            failCount++;
        }
    }

    console.log(`\nRecalculation complete. Successful updates: ${successCount}, Skipped/Failed: ${failCount}`);
    await mongoose.disconnect();
}

run().catch(error => {
    console.error("Migration failed:", error);
    process.exit(1);
});
