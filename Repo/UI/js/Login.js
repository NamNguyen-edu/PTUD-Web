const langData = {
  vi: {
    logo: "NEWSPULSE", welcome: "Chào mừng trở lại", create_account: "Tạo tài khoản",
    full_name: "Họ và tên", placeholder_full_name: "Nhập họ tên",
    email_or_phone: "Email", placeholder_user: "email@vi-du.com",
    login_user: "Tài khoản", placeholder_login_user: "Nhập Username hoặc Email...",
    username_label: "Tên đăng nhập", placeholder_username: "Nhập tên đăng nhập của bạn...",
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
    login_user: "Username", placeholder_login_user: "Enter Username or Email...",
    username_label: "Username", placeholder_username: "Enter your username...",
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
      callback: handleGoogleResponse
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

// XỬ LÝ CHUNG: ẨN/HIỆN MẬT KHẨU
document.addEventListener('click', function (e) {
  if (e.target.closest('.toggle-password')) {
    const btn = e.target.closest('.toggle-password');
    const input = document.getElementById(btn.getAttribute('data-target'));
    const icon = btn.querySelector('i');
    input.type = (input.type === 'password') ? 'text' : 'password';
    icon.className = (input.type === 'password') ? 'bi bi-eye' : 'bi bi-eye-slash';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Setup ngôn ngữ
  const currentLang = localStorage.getItem('newsPulseLang') || 'vi';
  applyLanguage(currentLang);

  const btnVi = document.getElementById('btn-vi');
  const btnEn = document.getElementById('btn-en');

  if (btnVi) btnVi.addEventListener('click', () => applyLanguage('vi'));
  if (btnEn) btnEn.addEventListener('click', () => applyLanguage('en'));

  // Hiển thị nút Google mặc định (phần login) ngay khi vào trang
  renderGoogleButton('login');

  // Xử lý Form
  handleFormSubmit('loginForm', '?page=login', 'login');
  handleFormSubmit('signupForm', '?page=signup', 'signup');
});

async function handleFormSubmit(formId, url, actionType) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin!',
        text: 'Vui lòng điền đầy đủ các trường bắt buộc.'
      });
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';

    const formData = new FormData(form);
    try {
      const response = await fetch(url, { method: 'POST', body: formData });
      const result = (await response.text()).trim();

      if (actionType === 'login') {
        if (['admin', 'editor', 'contributor', 'reader', 'chief editor'].includes(result)) {
          Swal.fire({ icon: 'success', title: 'Đăng nhập thành công!', timer: 1000, showConfirmButton: false })
            .then(() => {
              if (result === 'admin') {
                window.location.href = 'index.php?page=admin_dashboard';
              } else if (result === 'chief editor') {
                window.location.href = 'index.php?page=categorymanagement';
              } else {
                window.location.href = 'index.php?page=home';
              }
            });
        } else {
          Swal.fire({ icon: 'error', title: 'Đăng nhập thất bại', text: result });
        }
      } else {
        if (result === 'success') {
          Swal.fire({ icon: 'success', title: 'Đăng ký thành công!' }).then(() => toggleAuth('login'));
        } else {
          Swal.fire({ icon: 'error', title: 'Lỗi đăng ký', text: result });
        }
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi kết nối', text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' });
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}

async function handleGoogleResponse(res) {
  try {
    const response = await fetch('?page=google_auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'credential=' + encodeURIComponent(res.credential)
    });
    const result = (await response.text()).trim();
    if (['admin', 'editor', 'contributor', 'reader', 'chief editor'].includes(result)) {
      Swal.fire({ icon: 'success', title: 'Đăng nhập Google thành công!', timer: 1000, showConfirmButton: false })
        .then(() => {
          if (result === 'admin') window.location.href = 'index.php?page=admin_dashboard';
          else if (result === 'chief editor') window.location.href = 'index.php?page=categorymanagement';
          else window.location.href = 'index.php?page=home';
        });
    } else {
      Swal.fire({ icon: 'error', title: 'Lỗi đăng nhập Google', text: result });
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Lỗi kết nối', text: 'Không thể kết nối đến máy chủ.' });
  }
}

function applyLanguage(lang) {
  localStorage.setItem('newsPulseLang', lang);

  document.querySelectorAll('[data-key]').forEach(el => {
    if (langData[lang][el.getAttribute('data-key')]) {
      el.innerText = langData[lang][el.getAttribute('data-key')];
    }
  });

  document.querySelectorAll('[data-placeholder]').forEach(el => {
    if (langData[lang][el.getAttribute('data-placeholder')]) {
      el.placeholder = langData[lang][el.getAttribute('data-placeholder')];
    }
  });
}