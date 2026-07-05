require('dotenv').config();

const secret = {
    port: process.env.PORT || 7000,
    env: process.env.NODE_ENV || 'development',
    db_url: process.env.MONGO_URI,
    token_secret: process.env.TOKEN_SECRET,
    jwt_secret_for_verify: process.env.JWT_SECRET_FOR_VERIFY,
    node_dns_servers: process.env.NODE_DNS_SERVERS,
    email_service: process.env.SERVICE,
    email_user: process.env.EMAIL_USER,
    email_pass: process.env.EMAIL_PASS,
    email_host: process.env.EMAIL_HOST,
    email_port: process.env.EMAIL_PORT,
    email_secure: process.env.EMAIL_SECURE,
    cloudinary_name: process.env.CLOUDINARY_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
    cloudinary_upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    stripe_key: process.env.STRIPE_KEY,
    client_url: process.env.STORE_URL,
    admin_url: process.env.ADMIN_URL,
    jwt_secret: process.env.JWT_SECRET,
};

module.exports = {
    secret,
};
