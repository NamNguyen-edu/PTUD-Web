document.addEventListener('DOMContentLoaded', function () {
  // Khởi tạo Modal
  const pushModalElement = document.getElementById('pushModal');
  const pushModal = new bootstrap.Modal(pushModalElement);
  const btnAllow = document.getElementById('btnAllow');

  // 1. Tự động hiện sau 2 giây (Chưa cần làm gì đã hiện)
  setTimeout(() => {
    // Chỉ hiện nếu trình duyệt chưa được cấp quyền (tránh làm phiền người đã bật rồi)
    if (Notification.permission === "default") {
      pushModal.show();
    }
  }, 2000);

  // 2. Xử lý khi nhấn nút "Bật thông báo ngay"
  btnAllow.addEventListener('click', function () {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        // Hiện cái push thật của trình duyệt để test
        new Notification("NewsPulse", {
          body: "Tuyệt vời! Bạn sẽ nhận được tin tức mới nhất từ chúng tôi.",
          icon: "https://via.placeholder.com/100"
        });
      }
      pushModal.hide(); // Đóng modal sau khi chọn
    });
  });
});
// Hàm validate dùng chung cho cả 2 trang
function checkValid(element, condition) {
  if (condition) {
    element.classList.remove('is-invalid');
    element.classList.add('is-valid');
    return true;
  } else {
    element.classList.remove('is-valid');
    element.classList.add('is-invalid'); // Bôi đỏ
    return false;
  }
}

// Xử lý Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser');
    const pass = document.getElementById('loginPass');

    let ok = true;
    ok &= checkValid(user, user.value.trim() !== "");
    ok &= checkValid(pass, pass.value.length >= 6);

    if (ok) alert("Đăng nhập thành công!");
  });
}

// Xử lý Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail');
    const pass = document.getElementById('regPass');

    // Check pass: ít nhất 8 ký tự, 1 hoa, 1 số
    const passRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

    let ok = true;
    ok &= checkValid(email, email.value.includes('@'));
    ok &= checkValid(pass, passRegex.test(pass.value));

    if (ok) alert("Đăng ký thành công!");
  });
}
