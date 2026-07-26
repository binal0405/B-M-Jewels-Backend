const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    about_this_item: { type: String, required: true },
    additional_info: { type: String, required: null },
    product_name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    metal_type: { type: mongoose.Schema.Types.ObjectId, ref: "MetalType", required: true },
    gender: { type: String, required: true },
    size: { type: String, required: null },
    width: { type: Number, required: false },
    height: { type: Number, required: false },
    weight: { type: Number, required: true },
    quantity: { type: Number, required: false },
    promo_type: { type: mongoose.Schema.Types.ObjectId, ref: "PromoType", required: false },
    jewellery_type: { type: String, required: null },
    making_charges_per_gm: { type: Number, required: false },
    hall_mark_charges: { type: Number, required: false },
    additional_charges: { type: Number, required: false },
    gross_weight: { type: Number, required: false },
    net_weight: { type: Number, required: false },
    pcs: { type: Number, required: false },
    wastage: { type: Number, required: false },
    other_charges: { type: Number, required: false },
    making_type: { type: String, enum: ["percentage", "flat", "flat_per_gram"], default: "flat" },
    design_code: { type: String },
    product_images: [{ type: String, required: true }],
    discount_type: { type: String, enum: ["none", "flat", "percentage"], default: "none" },
    discount: { type: Number, default: 0, min: 0 }, // Discount must be non-negative
    purity: { type: mongoose.Schema.Types.ObjectId, ref: "Purity", required: null }, // Metal purity
    rate: { type: mongoose.Schema.Types.ObjectId, ref: "Rate", required: null }, // Reference to rates table
    status: { type: String, enum: ["Show", "Hide"], default: "Show" },
    price: { type: Number, default: 0 },
    price_is_fixed: { type: Boolean, default: true },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    averageRating: { type: Number, default: 0 },
    show_price: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });


/**
 * **Method to fetch base rate based on metal type**
 */
productSchema.methods.getBaseRate = async function () {
    await this.populate('metal_type purity');

    const Rate = mongoose.model("Rate");

    // Find the latest rate for this metal type
    let rateData = await Rate.findOne({ metal_type: this.metal_type._id })
        .sort({ createdAt: -1 });

    // Fallback: If it's a gold-related metal, try to find the rate for base "Gold"
    if (!rateData) {
        const metalName = this.metal_type.metal_name.toLowerCase();
        if (metalName.includes('gold')) {
            const goldMetal = await mongoose.model("MetalType").findOne({ 
                metal_name: { $regex: /^gold$/i } 
            });
            if (goldMetal) {
                rateData = await Rate.findOne({ metal_type: goldMetal._id })
                    .sort({ createdAt: -1 });
            }
        }
    }

    if (!rateData) {
        throw new Error(`No rate found for ${this.metal_type.metal_name}`);
    }

    return rateData.rate;
};

/**
 * **Method to calculate effective rate based on purity**
 */
productSchema.methods.getEffectiveRate = async function () {
    const baseRate = await this.getBaseRate();

    const metalName = this.metal_type.metal_name.toLowerCase();
    const isGoldRelated = metalName.includes('gold');
    const isSilverRelated = metalName.includes('silver');

    if (!isGoldRelated && !isSilverRelated) {
        return baseRate;
    }

    if (!this.purity) {
        throw new Error(`Purity is required for ${this.metal_type.metal_name} products`);
    }

    await this.populate('purity');
    console.log("Purity:", this.purity.product_purity); // Debugging

    const carat = this.purity.product_purity;

    if (isGoldRelated) {
        // Carat to purity factor mapping for gold
        const purityMapping = {
            24: 1.00,
            22: 0.916,
            18: 0.75, // 18K purity updated to 75% as per formula specification
            14: 0.585, // 14K purity updated to 58.5% as per formula specification
            9: 0.40
        };

        const purityFactor = purityMapping[carat] !== undefined 
            ? purityMapping[carat] 
            : parseFloat((carat / 24).toFixed(2));

        return baseRate * purityFactor;
    }

    if (isSilverRelated) {
        // For silver, the purity factor is ignored in price calculations as per sheet specification
        return baseRate;
    }

    return baseRate;
};

/**
 * **Method to calculate material cost**
 * Formula: materialCost = weight * effectiveRate
 */
productSchema.methods.getMaterialCost = async function () {
    const effectiveRate = await this.getEffectiveRate();
    console.log("Effective Rate:", effectiveRate); // Debugging
    return Math.round(this.weight * effectiveRate);
};

/**
 * **Method to calculate making charges**
 */
productSchema.methods.getMakingCharges = async function () {
    if (!this.making_charges_per_gm) return 0;

    let makingCharges = 0;
    if (this.making_type === "percentage") {
        const materialCost = await this.getMaterialCost();
        makingCharges = (materialCost * this.making_charges_per_gm) / 100;
    } else if (this.making_type === "flat_per_gram") {
        makingCharges = this.making_charges_per_gm * this.weight;
    } else {
        makingCharges = this.making_charges_per_gm;
    }
    return Math.round(makingCharges);
};

/**
 * **Method to calculate discounted making charges**
 */
productSchema.methods.getDiscountedMakingCharges = async function () {
    const makingCharges = await this.getMakingCharges();
    let discountedMakingCharges = makingCharges;

    if (this.discount_type === "percentage") {
        const discountAmount = (makingCharges * this.discount) / 100;
        discountedMakingCharges = makingCharges - discountAmount;
    } else if (this.discount_type === "flat") {
        discountedMakingCharges = makingCharges - this.discount;
    }

    return Math.round(Math.max(discountedMakingCharges, 0));
};

/**
 * **Method to calculate final price after tax**
 * Formula based on specification:
 * Subtotal = Gold Value (materialCost) + Making Charges (discountedMakingCharges) + Additional Cost (hallmark + additional + other charges)
 * Final Price = Subtotal + 3% GST
 */
productSchema.methods.getFinalPrice = async function () {
    try {
        const materialCost = await this.getMaterialCost();
        const discountedMakingCharges = await this.getDiscountedMakingCharges();

        // Additional Cost components
        const hall_mark_charges = this.hall_mark_charges || 0;
        const additional_charges = this.additional_charges || 0;
        const other_charges = this.other_charges || 0;
        const additionalCost = hall_mark_charges + additional_charges + other_charges;

        // Subtotal = Gold Value + Making Charges + Additional Cost
        const subtotal = materialCost + discountedMakingCharges + additionalCost;

        // GST is 3% of Subtotal
        const gst = subtotal * 0.03;

        // Final price
        const finalPrice = subtotal + gst;

        return Math.round(finalPrice);
    } catch (error) {
        console.error("Error calculating final price:", error);
        return null;
    }
};

/**
 * **Middleware to calculate and save the price before saving the product**
 */
productSchema.pre("save", async function (next) {
    try {
        // Skip calculation if price was explicitly set (only for fixed price products)
        if (!this.forcePriceCalculation && this.price_is_fixed && this.price !== undefined && this.price !== null && this.price !== 0) {
            return next();
        }

        // Calculate the final price
        const finalPrice = await this.getFinalPrice();
        if (!this.price_is_fixed) {
            this.price = finalPrice || 0;
        }


        next();
    } catch (error) {
        console.error("Error calculating price during save:", error);
        next(error);
    }
});

/**
 * **Middleware to calculate and save the price before updating the product**
 */
productSchema.pre("findOneAndUpdate", async function (next) {
    try {
        const update = this.getUpdate();
        const product = await this.model.findOne(this.getQuery());

        if (!product) {
            return next(new Error("Product not found"));
        }

        // Skip if price is being explicitly set
        if (update.price !== undefined && update.price !== null) {
            return next();
        }

        // Recalculate if relevant fields are modified
        const shouldRecalculate = (update.weight || update.metal_type || update.purity || update.making_charges_per_gm || update.making_type || update.discount_type || update.discount);

        if (shouldRecalculate) {
            const finalPrice = await product.getFinalPrice();
            this.setUpdate({ ...update, price: finalPrice || 0 });
        }

        next();
    } catch (error) {
        console.error("Error calculating price during update:", error);
        next(error);
    }
});

/**
 * **Method to calculate and update the average rating**
 */
productSchema.methods.updateAverageRating = async function () {
    const product = await mongoose.model("Product").findById(this._id).populate("reviews");

    if (!product.reviews || product.reviews.length === 0) {
        this.averageRating = 0;
    } else {
        const sumRating = product.reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
        this.averageRating = sumRating / product.reviews.length;
    }

    await this.save();
};

const Product = mongoose.model("Product", productSchema);
module.exports = Product;