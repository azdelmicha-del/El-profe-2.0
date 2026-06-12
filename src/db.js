const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_PHONE = process.env.ADMIN_PHONE;
const ADMIN_PASS = process.env.ADMIN_PASS;

async function connectMongo() {
    if (!MONGODB_URI) { console.error('MONGODB_URI no configurada'); process.exit(1); }
    await mongoose.connect(MONGODB_URI, { dbName: 'planif_pro', serverSelectionTimeoutMS: 10000, socketTimeoutMS: 45000 });
    console.log('MongoDB conectado (planif_pro)');
    const db = mongoose.connection;
    await db.collection('users').createIndex({ phone: 1 }, { unique: true });
    await db.collection('conversations').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('conversations').createIndex({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });
    await db.collection('client_messages').createIndex({ phone: 1, createdAt: -1 });
    await db.collection('client_messages').createIndex({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });
    await db.collection('references').createIndex({ userId: 1 });
    await ensureAdmin(db);
    return db;
}

function getDb() { return mongoose.connection; }

async function ensureAdmin(db) {
    if (!ADMIN_PHONE || !ADMIN_PASS) {
        console.warn('⚠️  ADMIN_PHONE o ADMIN_PASS no configurados en .env. Se saltará la inicialización del Admin por defecto.');
        return;
    }
    const existing = await db.collection('users').findOne({ phone: ADMIN_PHONE });
    if (existing) {
        if (!existing.is_admin) await db.collection('users').updateOne({ _id: existing._id }, { $set: { is_admin: true } });
        return;
    }
    const hashed = await bcrypt.hash(ADMIN_PASS, 12);
    await db.collection('users').insertOne({ phone: ADMIN_PHONE, password: hashed, name: 'Admin', grade: '', area: '', school: '', role: 'admin', is_admin: true, plan: 'lifetime', plan_expires: null, created_at: new Date() });
    console.log('Admin creado:', ADMIN_PHONE);
}

module.exports = { connectMongo, getDb };
