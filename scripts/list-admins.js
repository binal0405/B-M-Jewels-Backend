require("dotenv").config();
const mongoose = require("mongoose");
const { secret } = require("../config/secret");

async function main() {
  if (!secret.db_url) {
    console.error("MONGO_URI is not set in .env");
    process.exit(1);
  }

  console.log("Connecting to database...");
  await mongoose.connect(secret.db_url);
  console.log("Connected.");

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log("Collections in database:");
  for (let col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(` - ${col.name}: ${count} documents`);
  }

  const admins = await db.collection("admins").find({}).toArray();
  console.log("Admins in database:");
  admins.forEach(a => {
    console.log(`- Email: ${a.email}, Name: ${a.name}, Role: ${a.role}, Status: ${a.status}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Failed to connect to local database:", err.message);
  process.exit(1);
});
