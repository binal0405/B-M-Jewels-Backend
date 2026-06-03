const Cart = require("../model/Cart");
const Product = require("../model/Products");

// Get the user's cart
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: {
        path: "category metal_type purity rate promo_type",
      },
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const adminUrl = process.env.ADMIN_URL || "http://127.0.0.1:7000/";

    // Filter out any items where product might have been deleted
    const validItems = cart.items.filter((item) => item.productId);

    // Format products to match the structure expected by the frontend
    const formattedProducts = validItems.map((item) => {
      const productObj = item.productId.toObject();

      // Format image URLs
      if (productObj.product_images && Array.isArray(productObj.product_images)) {
        productObj.product_images = productObj.product_images.map((img) => {
          if (img.startsWith("http://") || img.startsWith("https://")) {
            return img;
          }
          // Remove leading slash if any
          const cleanImg = img.startsWith("/") ? img.substring(1) : img;
          return `${adminUrl}${cleanImg}`;
        });
      }

      return {
        ...productObj,
        orderQuantity: item.orderQuantity,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedProducts,
    });
  } catch (error) {
    console.error("Error in getCart:", error);
    next(error);
  }
};

// Sync cart from frontend
exports.syncCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { cart_products } = req.body;

    if (!Array.isArray(cart_products)) {
      return res.status(400).json({
        success: false,
        message: "cart_products must be an array",
      });
    }

    // Map frontend products to database schema format
    const items = cart_products.map((item) => ({
      productId: item._id,
      orderQuantity: item.orderQuantity || 1,
    }));

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items,
      });
    } else {
      cart.items = items;
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart synced successfully",
    });
  } catch (error) {
    console.error("Error in syncCart:", error);
    next(error);
  }
};
