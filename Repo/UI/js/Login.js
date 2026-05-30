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

const CONTROLLER_PATH = "index.php";


let isGoogleInitialized = false;
let isLoginGoogleRendered = false;
let isSignupGoogleRendered = false;

function toggleAuth(mode) {
  const loginSec = document.getElementById('login-section');
  const signupSec = document.getElementById('signup-section');
  document.querySelectorAll('.was-validated').forEach(form => form.classList.remove('was-validated'));

  if (mode === 'signup') {
    loginSec.style.display = 'none';
    signupSec.style.display = 'block';
  } else {
    loginSec.style.display = 'block';
    signupSec.style.display = 'none';
  }

  // Trì hoãn 50ms để DOM kịp hiển thị block trước khi Google đo kích thước khung
  setTimeout(() => renderGoogleButton(mode), 50);
}

function renderGoogleButton(mode = 'login') {
  // 1. Đợi thư viện Google tải xong. Nếu chưa xong, thử lại sau 200ms
  if (!window.google || !window.google.accounts) {
    setTimeout(() => renderGoogleButton(mode), 200);
    return;
  }

  // 2. Chỉ khởi tạo Google 1 lần duy nhất
  if (!isGoogleInitialized) {
    google.accounts.id.initialize({
      client_id: "124352835901-jqh4f03ga43s57qpi10pcbhatlj2pj8k.apps.googleusercontent.com",
      callback: (res) => console.log("Google User:", res.credential)
    });
    isGoogleInitialized = true;
  }

  const loginBtn = document.getElementById('google-login-btn');
  const signupBtn = document.getElementById('google-signup-btn');

  // 3. Render nút Login nếu chưa render
  if (mode === 'login' && !isLoginGoogleRendered && loginBtn) {
    google.accounts.id.renderButton(loginBtn, { theme: "outline", size: "large", width: "350" });
    isLoginGoogleRendered = true;
  }

  // 4. Render nút Signup nếu chưa render
  if (mode === 'signup' && !isSignupGoogleRendered && signupBtn) {
    google.accounts.id.renderButton(signupBtn, { theme: "outline", size: "large", width: "350" });
    isSignupGoogleRendered = true;
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

<<<<<<<< < Temporary merge branch 1
// 4. Đa ngôn ngữ
=========
>>>>>>>>> Temporary merge branch 2
function applyLanguage(lang) {
  localStorage.setItem('newsPulseLang', lang);

  document.querySelectorAll('[data-key]').forEach(el => {
    if (langData[lang][el.getAttribute('data-key')]) {
      el.innerText = langData[lang][el.getAttribute('data-key')];
    }
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

<<<<<<<<< Temporary merge branch 1
  setupForm('loginForm', 'login');
  setupForm('signupForm', 'signup');
=========
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailEl = document.getElementById('loginUser');
      const passEl = document.getElementById('loginPass');
      const email = emailEl?.value?.trim() ?? '';
      const password = passEl?.value ?? '';
      const v = validateLogin(email, password);
      if (!v.ok) { alert(v.msg); return; }

      // Submit the form to server so PHP can redirect on success
      loginForm.action = '?page=login';
      loginForm.method = 'POST';
      loginForm.submit();
    });
  }

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
      if (!v.ok) { alert(v.msg); return; }

      // Submit the signup form to server
      signupForm.action = '?page=signup';
      signupForm.method = 'POST';
      signupForm.submit();
    });
  }
>>>>>>>>> Temporary merge branch 2
});