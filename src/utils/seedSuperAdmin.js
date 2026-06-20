require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ role: 'superadmin' });
  if (existing) {
    console.log('Super admin already exists:', existing.email);
    process.exit(0);
  }

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@vidyanet.com',
    password: 'Admin@1234',
    role: 'superadmin',
    status: 'approved',
    schoolName: 'Vidyanet ERP',
    isActive: true,
  });

  console.log('Super admin created successfully!');
  console.log('  Email   :', superAdmin.email);
  console.log('  Password: Admin@1234');
  console.log('  ⚠️  Change the password after first login.');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
