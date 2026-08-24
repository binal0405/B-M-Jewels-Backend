require("dotenv").config();
const dns = require("dns");
if (process.env.NODE_DNS_SERVERS) {
  const servers = process.env.NODE_DNS_SERVERS.split(",");
  if (servers.length) dns.setServers(servers);
}
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { secret } = require("../config/secret");
const Admin = require("../model/Admin");

const ROLES = ["Admin", "Super Admin", "Manager", "CEO"];

async function main() {
  if (!secret.db_url) {
    console.error("MONGO_URI is not set in .env");
    process.exit(1);
  }

  const name = process.env.ADMIN_NAME || "Site Admin";
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const role = process.env.ADMIN_ROLE || "Admin";

  if (!ROLES.includes(role)) {
    console.error(`ADMIN_ROLE must be one of: ${ROLES.join(", ")}`);
    process.exit(1);
  }

  await mongoose.connect(secret.db_url);

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin already exists for ${email}. Skipping.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  await Admin.create({
    name,
    email,
    role,
    password: bcrypt.hashSync(password),
    status: "Active",
    joiningDate: new Date(),
  });

  console.log(`Admin created: ${email} (role: ${role})`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
