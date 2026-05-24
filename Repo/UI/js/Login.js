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
  renderGoogleButton();
}

// Xử lý nút Google Login
function renderGoogleButton() {
  if (window.google && google.accounts) {
    google.accounts.id.initialize({
      client_id: "124352835901-jqh4f03ga43s57qpi10pcbhatlj2pj8k.apps.googleusercontent.com",
      callback: handleGoogleResponse
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

// Xử lý dữ liệu trả về từ Google
function handleGoogleResponse(res) {
  console.log("Google Token:", res.credential);

  // Tạo một form ẩn để gửi token này xuống Backend xử lý đăng nhập/đăng ký
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '?action=google_login';

  const tokenInput = document.createElement('input');
  tokenInput.type = 'hidden';
  tokenInput.name = 'google_credential';
  tokenInput.value = res.credential;

  form.appendChild(tokenInput);
  document.body.appendChild(form);
  form.submit();
}

// Xử lý Đa ngôn ngữ
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
});

// Kiểm tra và gửi form đăng nhập/đăng ký
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // Cập nhật hàm validate cho phép nhập Tài khoản (không ép phải là định dạng email)
  function validateLogin(loginId, password) {
    if (!loginId || !password) return { ok: false, msg: 'Vui lòng nhập tài khoản và mật khẩu.' };
    if (password.length < 6) return { ok: false, msg: 'Mật khẩu tối thiểu 6 ký tự.' };
    return { ok: true };
  }

  function validateSignup(name, email, password) {
    if (!name || !email || !password) return { ok: false, msg: 'Vui lòng điền đầy đủ thông tin.' };
    if (password.length < 6) return { ok: false, msg: 'Mật khẩu tối thiểu 6 ký tự.' };
    return { ok: true };
  }

  // Xử lý Submit Form Đăng Nhập
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const loginIdEl = document.getElementById('loginUser');
      const passEl = document.getElementById('loginPass');

      const loginId = loginIdEl?.value?.trim() ?? '';
      const password = passEl?.value ?? '';

      const v = validateLogin(loginId, password);
      if (!v.ok) {
        alert(v.msg);
        return;
      }

      // Đẩy dữ liệu xuống Backend
      loginForm.action = '?action=login';
      loginForm.method = 'POST';
      loginForm.submit();
    });
  }

  // Xử lý Submit Form Đăng Ký
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const nameEl = document.getElementById('fullName');
      const emailEl = document.getElementById('signupUser');
      const passEl = document.getElementById('signupPass');

      const name = nameEl?.value?.trim() ?? '';
      const email = emailEl?.value?.trim() ?? '';
      const password = passEl?.value ?? '';

      const v = validateSignup(name, email, password);
      if (!v.ok) {
        alert(v.msg);
        return;
      }

      // Đẩy dữ liệu xuống Backend
      signupForm.action = '?action=signup';
      signupForm.method = 'POST';
      signupForm.submit();
    });
  }
});