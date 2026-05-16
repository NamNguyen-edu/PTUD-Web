const langData = {
  vi: {
    logo: "NEWSPULSE", welcome: "Chào mừng trở lại", create_account: "Tạo tài khoản",
    full_name: "Họ và tên", placeholder_full_name: "Nhập họ tên",
    email_or_phone: "Email", placeholder_user: "email@vi-du.com",
    password: "Mật khẩu", placeholder_pass: "Tối thiểu 6 ký tự",
    log_in: "Đăng nhập", sign_up: "Đăng ký ngay", or: "Hoặc",
    no_acc: "Chưa có tài khoản?", have_acc: "Đã có tài khoản?",
    log_in_here: "Đăng nhập tại đây", sign_up_here: "Đăng ký tại đây",
    slogan: "NHỊP ĐẬP TIN TỨC - KẾT NỐI NIỀM TIN"
  },
  en: {
    logo: "NEWSPULSE", welcome: "Welcome back", create_account: "Create account",
    full_name: "Full Name", placeholder_full_name: "Enter your name",
    email_or_phone: "Email", placeholder_user: "email@example.com",
    password: "Password", placeholder_pass: "At least 6 chars",
    log_in: "Log in", sign_up: "Sign Up", or: "Or",
    no_acc: "Don't have an account?", have_acc: "Already have an account?",
    log_in_here: "Log in here", sign_up_here: "Sign up here",
    slogan: "JOIN US - CONNECTING TRUST"
  }
};

// Hàm chuyển đổi Đăng nhập / Đăng ký
function toggleAuth(mode) {
  const loginSec = document.getElementById('login-section');
  const signupSec = document.getElementById('signup-section');

  if (mode === 'signup') {
    loginSec.style.display = 'none';
    signupSec.style.display = 'block';
  } else {
    loginSec.style.display = 'block';
    signupSec.style.display = 'none';
  }
  // Render lại nút Google cho section đang hiển thị
  renderGoogleButton();
}

function renderGoogleButton() {
  if (window.google && google.accounts) {
    google.accounts.id.initialize({
      client_id: "124352835901-jqh4f03ga43s57qpi10pcbhatlj2pj8k.apps.googleusercontent.com",
      callback: (res) => console.log("Google User:", res.credential)
    });

    // Kiểm tra xem section nào đang hiện thì vẽ vào đó
    const loginBtn = document.getElementById('google-login-btn');
    const signupBtn = document.getElementById('google-signup-btn');

    if (document.getElementById('login-section').style.display !== 'none') {
      google.accounts.id.renderButton(loginBtn, { theme: "outline", size: "large", width: "350" });
    } else {
      google.accounts.id.renderButton(signupBtn, { theme: "outline", size: "large", width: "350" });
    }
  }
}

function applyLanguage(lang) {
  localStorage.setItem('newsPulseLang', lang);
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (langData[lang][key]) el.innerText = langData[lang][key];
  });
  document.querySelectorAll('[data-placeholder]').forEach(el => {
    const key = el.getAttribute('data-placeholder');
    if (langData[lang][key]) el.placeholder = langData[lang][key];
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(localStorage.getItem('newsPulseLang') || 'vi');

  document.getElementById('btn-vi').onclick = () => applyLanguage('vi');
  document.getElementById('btn-en').onclick = () => applyLanguage('en');

  // Khởi tạo nút Google lần đầu
  setTimeout(renderGoogleButton, 200);
});

// Kiểm tra và gửi form đăng nhập/đăng ký
if (isValid) {
    const formData = new FormData();
    // Nếu đang ở form đăng ký, mode sẽ là 'register', ngược lại là 'login'
    const mode = (signupForm.offsetParent !== null) ? 'register' : 'login';
    
    formData.append('action', mode);
    formData.append('email', emailEl.value);
    formData.append('password', passEl.value);
    if(mode === 'register') {
        formData.append('fullname', nameEl.value);
    }

    fetch('../model/Login.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            // Chuyển hướng sau khi thành công
            window.location.href = 'index.php?page=home';
        } else {
            alert("Thất bại: " + data.message);
        }
    })
    .catch(err => console.error("Lỗi kết nối server:", err));
}