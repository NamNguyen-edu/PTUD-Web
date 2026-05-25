const langData = {
  vi: {
    logo: "NEWSPULSE", welcome: "Chào mừng trở lại", create_account: "Tạo tài khoản",
    full_name: "Họ và tên", placeholder_full_name: "Nhập họ tên",
    email_or_phone: "Tài khoản", placeholder_user: "Email hoặc Số điện thoại",
    password: "Mật khẩu", placeholder_pass: "Tối thiểu 6 ký tự",
    log_in: "Đăng nhập", sign_up: "Đăng ký ngay", or: "Hoặc",
    no_acc: "Chưa có tài khoản?", have_acc: "Đã có tài khoản?",
    log_in_here: "Đăng nhập tại đây", sign_up_here: "Đăng ký tại đây",
    slogan: "NHỊP ĐẬP TIN TỨC - KẾT NỐI NIỀM TIN"
  },
  en: {
    logo: "NEWSPULSE", welcome: "Welcome back", create_account: "Create account",
    full_name: "Full Name", placeholder_full_name: "Enter your name",
    email_or_phone: "Account", placeholder_user: "Email or Phone number",
    password: "Password", placeholder_pass: "At least 6 chars",
    log_in: "Log in", sign_up: "Sign Up", or: "Or",
    no_acc: "Don't have an account?", have_acc: "Already have an account?",
    log_in_here: "Log in here", sign_up_here: "Sign up here",
    slogan: "JOIN US - CONNECTING TRUST"
  }
};

// 1. Chuyển đổi giao diện Đăng nhập / Đăng ký
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
  renderGoogleButton();
}

function renderGoogleButton() {
  if (window.google && google.accounts) {
    google.accounts.id.initialize({
      client_id: "124352835901-jqh4f03ga43s57qpi10pcbhatlj2pj8k.apps.googleusercontent.com",
      callback: handleGoogleResponse
    });

    const isLogin = document.getElementById('login-section').style.display !== 'none';
    const targetEl = document.getElementById(isLogin ? 'google-login-btn' : 'google-signup-btn');

    if (targetEl) {
      targetEl.innerHTML = ""; // Xóa nội dung cũ để vẽ mới
      google.accounts.id.renderButton(targetEl, { theme: "outline", size: "large", width: "350" });
    }
  }
}

// 3. Callback Google
function handleGoogleResponse(res) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '?action=google_login';
  const input = document.createElement('input');
  input.type = 'hidden'; input.name = 'google_credential'; input.value = res.credential;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

// 4. Đa ngôn ngữ
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

// 5. Khởi tạo mọi thứ khi DOM load xong
document.addEventListener('DOMContentLoaded', () => {
  // Ngôn ngữ
  applyLanguage(localStorage.getItem('newsPulseLang') || 'vi');
  document.getElementById('btn-vi').onclick = () => applyLanguage('vi');
  document.getElementById('btn-en').onclick = () => applyLanguage('en');

  // Google
  setTimeout(renderGoogleButton, 500);

  // Xử lý Form Submit (Sử dụng 1 handler chung để gọn code)
  const setupForm = (formId, action) => {
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate đơn giản
        const inputs = this.querySelectorAll('input');
        for (let input of inputs) {
          if (input.value.trim() === '') {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
          }
        }

        // Gửi form
        this.action = '?action=' + action;
        this.method = 'POST';
        this.submit();
      });
    }
  };

  setupForm('loginForm', 'login');
  setupForm('signupForm', 'signup');
});