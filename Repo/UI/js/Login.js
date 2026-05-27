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

function toggleAuth(mode) {
  const loginSec = document.getElementById('login-section');
  const signupSec = document.getElementById('signup-section');

  document.querySelectorAll('.was-validated').forEach(form => form.classList.remove('was-validated'));

  // Reset lại trạng thái ẩn mật khẩu khi chuyển form để bảo mật
  document.querySelectorAll('.toggle-password').forEach(button => {
    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (input) {
      input.type = 'password';
      const icon = button.querySelector('i');
      if (icon) icon.className = 'bi bi-eye';
    }
  });

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
      callback: (res) => console.log("Google User:", res.credential)
    });
    const loginBtn = document.getElementById('google-login-btn');
    const signupBtn = document.getElementById('google-signup-btn');
    if (document.getElementById('login-section').style.display !== 'none') {
      if (loginBtn) google.accounts.id.renderButton(loginBtn, { theme: "outline", size: "large", width: "350" });
    } else {
      if (signupBtn) google.accounts.id.renderButton(signupBtn, { theme: "outline", size: "large", width: "350" });
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
  setTimeout(renderGoogleButton, 500);

  const CONTROLLER_PATH = "/PTUD-WEB/Repo/index.php";
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // 🔥 CHỨC NĂNG ẨN / HIỆN MẬT KHẨU
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const passwordInput = document.getElementById(targetId);
      const icon = this.querySelector('i');

      if (passwordInput && icon) {
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          icon.className = 'bi bi-eye-slash'; // Đổi sang icon con mắt gạch chéo
        } else {
          passwordInput.type = 'password';
          icon.className = 'bi bi-eye'; // Đổi lại icon con mắt thường
        }
      }
    });
  });

  // 1. XỬ LÝ FORM ĐĂNG NHẬP
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (!loginForm.checkValidity()) {
        e.stopPropagation();
        loginForm.classList.add('was-validated');
        return;
      }

      const passwordInput = document.getElementById('loginPass');
      if (passwordInput && passwordInput.value.length < 6) {
        Swal.fire({ icon: 'warning', title: 'Thông báo', text: 'Mật khẩu phải chứa tối thiểu 6 ký tự.', confirmButtonColor: '#0d6efd' });
        return;
      }

      const formData = new FormData(loginForm);
      formData.append('action', 'login');

      try {
        const response = await fetch(CONTROLLER_PATH, { method: 'POST', body: formData });
        const result = (await response.text()).trim();

        if (['admin', 'editor', 'contributor', 'reader', 'chief editor'].includes(result)) {
          Swal.fire({ icon: 'success', title: 'Đăng nhập thành công!', text: 'Đang chuyển hướng...', timer: 1200, showConfirmButton: false })
            .then(() => {
              if (result === 'admin' || result === 'chief editor') {
                window.location.href = 'index.php?page=admin_dashboard';
              } else {
                window.location.href = 'index.php?page=home';
              }
            });
        } else {
          Swal.fire({ icon: 'error', title: 'Thất bại', text: result, confirmButtonColor: '#dc3545' });
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể kết nối đến hệ thống!', confirmButtonColor: '#dc3545' });
      }
    });
  }

  // 2. XỬ LÝ FORM ĐĂNG KÝ
  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (!signupForm.checkValidity()) {
        e.stopPropagation();
        signupForm.classList.add('was-validated');
        return;
      }

      const passwordInput = document.getElementById('signupPass');
      if (passwordInput && passwordInput.value.length < 6) {
        Swal.fire({ icon: 'warning', title: 'Thông báo', text: 'Mật khẩu đăng ký phải chứa tối thiểu 6 ký tự.', confirmButtonColor: '#0d6efd' });
        return;
      }

      const formData = new FormData(signupForm);
      formData.append('action', 'signup');

      try {
        const response = await fetch(CONTROLLER_PATH, { method: 'POST', body: formData });
        const result = (await response.text()).trim();

        if (result === 'success') {
          Swal.fire({ icon: 'success', title: 'Đăng ký thành công!', text: 'Hãy tiến hành đăng nhập bằng tài khoản mới.' })
            .then(() => toggleAuth('login'));
        } else {
          Swal.fire({ icon: 'error', title: 'Thất bại', text: result, confirmButtonColor: '#dc3545' });
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể kết nối đến hệ thống!', confirmButtonColor: '#dc3545' });
      }
    });
  }
});