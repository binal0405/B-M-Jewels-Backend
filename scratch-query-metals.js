require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

// Import and register schemas
const MetalType = require("./model/MetalType");
const Purity = require("./model/Purity");
const Rate = require("./model/Rate");
const Category = require("./model/Category");
const Product = require("./model/Products");

async function run() {
    await connectDB();
    try {
        const product = await Product.findOne({ metal_type: "6a21b8c04720161c01b83bfb" })
            .populate("metal_type purity");
        if (product) {
            console.log(JSON.stringify(product, null, 2));
            try {
                const baseRate = await product.getBaseRate();
                console.log("Base Rate:", baseRate);
            } catch (e) {
                console.log("Error getting base rate:", e.message);
            }
        } else {
            console.log("No Rose Gold product found");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
