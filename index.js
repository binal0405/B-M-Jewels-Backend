require("dotenv").config();
const dns = require("dns");
if (process.env.NODE_DNS_SERVERS) {
  const servers = process.env.NODE_DNS_SERVERS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length) dns.setServers(servers);
}
const express = require("express");
const app = express();
const path = require('path');
const cors = require("cors");
const connectDB = require("./config/db");
const { secret } = require("./config/secret");
const PORT = secret.port || 7000;
const morgan = require('morgan')
// error handler
const globalErrorHandler = require("./middleware/global-error-handler");
// routes
const userRoutes = require("./routes/user.routes");
const categoryRoutes = require("./routes/category.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const bannerRoutes = require("./routes/banner.routes");
const contactusRoutes = require("./routes/contactus.routes");
const promotypeRoutes = require("./routes/promotype.routes");
const colorRoutes = require("./routes/color.routes");
const purityRoutes = require("./routes/purity.routes");
const metalTypeRoutes = require("./routes/metaltype.routes");
const brandRoutes = require("./routes/brand.routes");
const userOrderRoutes = require("./routes/user.order.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const couponRoutes = require("./routes/coupon.routes");
const reviewRoutes = require("./routes/review.routes");
const rateRoutes = require("./routes/rate.routes");
const adminRoutes = require("./routes/admin.routes");
const settingRoutes = require("./routes/setting.routes");
// const loginRoutes = require("./routes/login.routes");
const uploadRouter = require('./routes/uploadFile.routes');
const cloudinaryRoutes = require("./routes/cloudinary.routes");
const cartRoutes = require("./routes/cart.routes");

// middleware
app.use(cors());
// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// connect database
connectDB();

app.use("/api/user", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/contactus", contactusRoutes);
app.use("/api/contactus", contactusRoutes);
app.use("/api/promotype", promotypeRoutes);
app.use("/api/color", colorRoutes);
app.use("/api/purity", purityRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/metaltype", metalTypeRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/product", productRoutes);
app.use('/api/upload', uploadRouter);
app.use("/api/order", orderRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/user-order", userOrderRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/rate", rateRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
// app.use("/api/login", loginRoutes);
// https://data-asg.goldprice.org/dbXRates/INR
// root route
app.get("/", (req, res) => res.send("Apps worked successfully"));

// 404 — must run after routes, before the error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: 'API Not Found',
      },
    ],
  });
});

app.use(globalErrorHandler);

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`server running on port ${PORT} (host ${HOST} — use http://localhost:${PORT} on this PC)`);
});

module.exports = app;