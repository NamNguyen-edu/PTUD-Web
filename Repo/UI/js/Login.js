// ===== TEST ACCOUNTS DATABASE =====
const testAccounts = {
  'user': 'admin123'
};

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

// ===== AUTHENTICATE USER =====
function authenticateUser(username, password) {
  // Check if account exists and password matches
  if (testAccounts[username] && testAccounts[username] === password) {
    return { success: true, message: 'Đăng nhập thành công!' };
  }
  return { success: false, message: 'Tài khoản hoặc mật khẩu không đúng!' };
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

    if (ok) {
      // Authenticate user
      const auth = authenticateUser(user.value.trim(), pass.value);
      
      if (auth.success) {
        alert(auth.message);
        // Call login function from main.js
        if (typeof login === 'function') {
          login(user.value.trim());
          // Redirect to home
          setTimeout(() => {
            window.location.href = '../html/home.html';
          }, 500);
        }
      } else {
        alert(auth.message);
        checkValid(user, false);
        checkValid(pass, false);
      }
    }
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