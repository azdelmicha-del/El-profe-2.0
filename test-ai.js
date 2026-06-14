const jwt = require('jsonwebtoken');
const { connectMongo, getDb } = require('./src/db');

async function run() {
  await connectMongo();
  const db = getDb();
  const admin = await db.collection('users').findOne({ is_admin: true });
  
  const token = jwt.sign(
      { userId: admin._id.toString(), role: admin.role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_planif_pro_2026',
      { expiresIn: '1d' }
  );

  const res = await fetch('http://localhost:3000/api/admin/ai', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Hola, ¿qué usuarios hay?", context: null })
  });
  
  const text = await res.text();
  console.log("HTTP RESPONSE:", res.status, text);
  process.exit(0);
}
run();
