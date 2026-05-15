// ===== TEST ACCOUNTS DATABASE =====
const testAccounts = {
  'user': 'admin123'
};

// ===== LANGUAGE DATA =====
const langData = {
  vi: {
    welcome: "Chào mừng trở lại",
    sign_in_google: "Đăng nhập với Google",
    or: "Hoặc",
    email_or_phone: "Email hoặc số điện thoại",
    placeholder_user: "Nhập email hoặc SĐT",
    err_user: "Vui lòng nhập tài khoản.",
    password: "Mật khẩu",
    placeholder_pass: "Nhập mật khẩu",
    err_pass: "Mật khẩu phải từ 6 ký tự.",
    forgotten_password: "Quên mật khẩu?",
    log_in: "Đăng nhập",
    no_acc: "Chưa có tài khoản?",
    sign_up_here: "Đăng ký tại đây",
    slogan: "Nhịp đập tin tức - Kết nối niềm tin",
    alert_login: "Đăng nhập thành công!",
    full_name: "Họ và tên",
    placeholder_full_name: "Nhập họ và tên",
    err_full_name: "Vui lòng nhập họ và tên.",
    agree_terms: "Tôi đồng ý với các điều khoản dịch vụ.",
    sign_up: "Đăng ký",
    term_condition: "Điều khoản dịch vụ",
    log_in_here: "Đăng nhập tại đây",
    have_acc: "Đã có tài khoản?",
    create_account: "Tạo tài khoản của bạn"
  },

  en: {
    welcome: "Welcome back",
    sign_in_google: "Sign in with Google",
    or: "Or",
    email_or_phone: "Email or phone",
    placeholder_user: "Enter email or phone",
    err_user: "Please enter your account.",
    password: "Password",
    placeholder_pass: "Enter password",
    err_pass: "Password must be at least 6 characters.",
    forgotten_password: "Forgotten password?",
    log_in: "Log in",
    no_acc: "Don't have an account?",
    sign_up_here: "Sign up here",
    slogan: "News Pulse – Connecting Trust",
    alert_login: "Login successful!",
    full_name: "Full Name",
    placeholder_full_name: "Enter full name",
    err_full_name: "Please enter your full name.",
    agree_terms: "I guarantee that the information provided is correct and I agree to the",
    sign_up: "Sign Up",
    term_condition: "Terms & Conditions",
    log_in_here: "Log in here",
    have_acc: "Already have an account?",
    create_account: "Create your account"
  }
};

// ===== APPLY LANGUAGE =====
function applyLanguage(lang) {

  localStorage.setItem('newsPulseLang', lang);

  // Translate text
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');

    if (langData[lang][key]) {
      el.innerText = langData[lang][key];
    }
  });

  // Translate placeholder
  document.querySelectorAll('[data-placeholder]').forEach(el => {
    const key = el.getAttribute('data-placeholder');

    if (langData[lang][key]) {
      el.placeholder = langData[lang][key];
    }
  });
}

// ===== VALIDATION =====
function checkValid(element, condition) {

  if (condition) {
    element.classList.remove('is-invalid');
    element.classList.add('is-valid');
    return true;
  }

  element.classList.remove('is-valid');
  element.classList.add('is-invalid');

  return false;
}

// ===== AUTHENTICATE USER =====
function authenticateUser(username, password) {

  if (
    testAccounts[username] &&
    testAccounts[username] === password
  ) {
    return {
      success: true,
      message: 'Đăng nhập thành công!'
    };
  }

  return {
    success: false,
    message: 'Tài khoản hoặc mật khẩu không đúng!'
  };
}

// ===== GOOGLE LOGIN =====
function handleCredentialResponse(response) {

  console.log("Token: " + response.credential);

  const formData = new FormData();
  formData.append('credential', response.credential);

  fetch('Login.php', {
    method: 'POST',
    body: formData
  })
    .then(res => res.text())
    .then(data => {

      alert("Server trả về: " + data);

    });
}

// ===== MAIN =====
document.addEventListener('DOMContentLoaded', function () {

  // ===== LANGUAGE INIT =====
  const savedLang =
    localStorage.getItem('newsPulseLang') || 'vi';

  applyLanguage(savedLang);

  const btnVi = document.getElementById('btn-vi');
  const btnEn = document.getElementById('btn-en');

  if (btnVi) {
    btnVi.onclick = () => applyLanguage('vi');
  }

  if (btnEn) {
    btnEn.onclick = () => applyLanguage('en');
  }

  // ===== NOTIFICATION MODAL =====
  const pushModalElement =
    document.getElementById('pushModal');

  if (pushModalElement) {

    const pushModal =
      new bootstrap.Modal(pushModalElement);

    const btnAllow =
      document.getElementById('btnAllow');

    setTimeout(() => {

      if (Notification.permission === "default") {
        pushModal.show();
      }

    }, 2000);

    if (btnAllow) {

      btnAllow.addEventListener('click', function () {

        Notification.requestPermission()
          .then(permission => {

            if (permission === "granted") {

              new Notification("NewsPulse", {
                body: "Tuyệt vời! Bạn sẽ nhận được tin tức mới nhất từ chúng tôi.",
                icon: "https://via.placeholder.com/100"
              });

            }

            pushModal.hide();

          });
      });
    }
  }

  // ===== LOGIN =====
  const loginForm =
    document.getElementById('loginForm');

  if (loginForm) {

    loginForm.addEventListener('submit', (e) => {

      e.preventDefault();

      const user =
        document.getElementById('loginUser');

      const pass =
        document.getElementById('loginPass');

      const lang =
        localStorage.getItem('newsPulseLang') || 'vi';

      let ok = true;

      ok &= checkValid(
        user,
        user.value.trim() !== ""
      );

      ok &= checkValid(
        pass,
        pass.value.length >= 6
      );

      if (ok) {

        // Authenticate
        const auth = authenticateUser(
          user.value.trim(),
          pass.value
        );

        if (auth.success) {

          alert(langData[lang].alert_login);

          // main.js login()
          if (auth.success) {

            alert(langData[lang].alert_login);

            // Nếu có hàm login từ main.js thì gọi
            if (typeof login === 'function') {
              login(user.value.trim());
            }

            // Luôn redirect về home
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

  // ===== REGISTER =====
  const registerForm =
    document.getElementById('registerForm');

  if (registerForm) {

    registerForm.addEventListener('submit', (e) => {

      e.preventDefault();

      const email =
        document.getElementById('regEmail');

      const pass =
        document.getElementById('regPass');

      const passRegex =
        /^(?=.*[A-Z])(?=.*\d).{8,}$/;

      let ok = true;

      ok &= checkValid(
        email,
        email.value.includes('@')
      );

      ok &= checkValid(
        pass,
        passRegex.test(pass.value)
      );

      if (ok) {
        alert("Đăng ký thành công!");
      }
    });
  }

  // ===== GOOGLE INIT =====
  if (window.google && google.accounts) {
    google.accounts.id.initialize({
      client_id: "124352835901-jqh4f03ga43s57qpi10pcbhatlj2pj8k.apps.googleusercontent.com",
      callback: handleCredentialResponse
    });
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
      google.accounts.id.renderButton(
        googleBtn,
        { theme: "outline", size: "large", width: "100%" } // Tùy chỉnh nút cho đẹp
      );
    }
  }
}); 