require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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

// معالجة ملف xph.html
app.get('/xph.html', (req, res) => {
  fs.readFile(path.join(__dirname, 'xph.html'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading xph.html:', err);
      return res.status(500).send('Error reading file');
    }

    // استبدال تكوين Firebase بالقيم من متغيرات البيئة
    const processedData = data.replace(
      /const firebaseConfig = \{[\s\S]*?\};/,
      `const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 4)};`
    );

    res.setHeader('Content-Type', 'text/html');
    res.send(processedData);
  });
});

// معالجة ملف script.js
app.get('/js/script.js', (req, res) => {
  fs.readFile(path.join(__dirname, 'js/script.js'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading script.js:', err);
      return res.status(500).send('Error reading file');
    }

    // استبدال تكوين Firebase بالقيم من متغيرات البيئة
    const processedData = data.replace(
      /const firebaseConfig = \{[\s\S]*?\};/,
      `const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 4)};`
    );

    res.setHeader('Content-Type', 'application/javascript');
    res.send(processedData);
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
