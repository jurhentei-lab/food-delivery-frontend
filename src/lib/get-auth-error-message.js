export function getAuthErrorMessage(error, fallback = "Алдаа гарлаа!") {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage;
  }

  if (status === 400) {
    return "Илгээсэн мэдээлэл дутуу эсвэл буруу байна.";
  }

  if (status === 401) {
    return "Нэвтрэх мэдээлэл буруу байна.";
  }

  if (status === 403) {
    return "Хандах эрхгүй байна. CORS эсвэл зөвшөөрлийн тохиргоо шалгана уу.";
  }

  if (status === 404) {
    return "Auth service олдсонгүй. API URL-аа шалгана уу.";
  }

  if (status === 409) {
    return "Энэ email бүртгэлтэй байна.";
  }

  if (status >= 500) {
    return "Сервер дээр алдаа гарлаа. Дараа дахин оролдоно уу.";
  }

  if (error?.request && !error?.response) {
    return "Сервертэй холбогдож чадсангүй. Интернет, API URL эсвэл CORS тохиргоогоо шалгана уу.";
  }

  if (typeof error?.message === "string" && error.message.includes("Network Error")) {
    return "Network алдаа гарлаа. Backend ажиллаж байгаа эсэх болон CORS-оо шалгана уу.";
  }

  return fallback;
}
