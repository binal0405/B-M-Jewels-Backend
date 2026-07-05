require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { secret } = require("../config/secret");
const Admin = require("../model/Admin");

async function main() {
  const email = process.argv[2] || "admin@gmail.com";
  const password = process.argv[3] || "Admin123!";

  console.log(`Target Email: ${email}`);
  console.log(`Target Password: ${password}`);

  if (!secret.db_url) {
    console.error("MONGO_URI is not set in .env");
    process.exit(1);
  }

  await mongoose.connect(secret.db_url);
  console.log("Connected to database.");

  const formattedEmail = email.trim().toLowerCase();
  const existing = await Admin.findOne({ email: formattedEmail });

  if (existing) {
    existing.password = bcrypt.hashSync(password);
    await existing.save();
    console.log(`Password updated successfully for admin: ${formattedEmail}`);
  } else {
    console.log(`Admin ${formattedEmail} not found. Creating a new admin user...`);
    await Admin.create({
      name: "Site Admin",
      email: formattedEmail,
      role: "Admin",
      password: bcrypt.hashSync(password),
      status: "Active",
      joiningDate: new Date(),
    });
    console.log(`Admin created successfully: ${formattedEmail} with password: ${password}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
