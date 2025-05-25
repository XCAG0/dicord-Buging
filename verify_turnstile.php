<?php
// تعيين رأس CORS للسماح بالطلبات من نفس المصدر فقط
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// استلام البيانات من الطلب
$data = json_decode(file_get_contents("php://input"));

// التحقق من وجود رمز التحقق
if (!isset($data->token) || empty($data->token)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "رمز التحقق مطلوب"]);
    exit();
}

// المفتاح السري لـ Cloudflare Turnstile - استبدله بالمفتاح الخاص بك
$secret_key = "1x0000000000000000000000000000000AA";

// إعداد بيانات الطلب للتحقق
$post_data = [
    "secret" => $secret_key,
    "response" => $data->token,
    "remoteip" => $_SERVER['REMOTE_ADDR'] // اختياري: عنوان IP للمستخدم
];

// إرسال طلب التحقق إلى Cloudflare
$ch = curl_init("https://challenges.cloudflare.com/turnstile/v0/siteverify");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
$response = curl_exec($ch);
curl_close($ch);

// تحليل الاستجابة
$result = json_decode($response, true);

// إرسال النتيجة
if ($result["success"]) {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "تم التحقق بنجاح"]);
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "فشل التحقق", "error-codes" => $result["error-codes"]]);
}
?>
