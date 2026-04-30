require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ username: 'record' });
  if (!user) { console.log('User not found!'); process.exit(1); }
  console.log('Found user:', user.username, '| hash:', user.password.slice(0, 20) + '...');
  const match = await user.matchPassword('pass123');
  console.log('Password match for pass123:', match);
  await mongoose.disconnect();
}
test().catch(console.error);
