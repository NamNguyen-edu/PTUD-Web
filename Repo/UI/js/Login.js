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
          // Redirect to home page after login
          setTimeout(() => {
            window.location.href = 'index.php?page=home';
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


function handleCredentialResponse(response) {
  // Đây là nơi nhận Token sau khi user chọn tài khoản xong
  console.log("Token: " + response.credential);

  // Gửi token này sang file PHP để xử lý
  const formData = new FormData();
  formData.append('credential', response.credential);

  fetch('Login.php', {
    method: 'POST',
    body: formData
  })
    .then(res => res.text())
    .then(data => {
      alert("Server trả về: " + data);
      // Nếu thành công, chuyển hướng về trang chủ
      // window.location.href = "../../index.php"; 
    });
}

window.onload = function () {
  // 2. Khởi tạo với Client ID bạn vừa lấy
  google.accounts.id.initialize({
    client_id: "124352835901-jqh4f03ga43s57qpi10pcbhatlj2pj8k.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });

  // 3. Kết nối nút bấm của NewsPulse với Google
  const googleBtn = document.getElementById('google-login-btn'); // Đảm bảo nút của bạn có id này
  if (googleBtn) {
    googleBtn.onclick = () => {
      google.accounts.id.prompt(); // Hiện bảng chọn tài khoản
    };
  }
};