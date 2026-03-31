// assets/js/login.js
(function () {
  const BOOKZONE_USER_KEY = "bookzone_user";
  const USERS_KEY = "bookzone_users";

  // Admin whitelist (email + Google login supported)
 const ADMIN_EMAILS = [
  "shahyash2384@gmail.com",
  "mohmmedrehanv@gmail.com",
];

  const GOOGLE_CLIENT_ID =
    "1031496990950-tkh5hcjfc6cjtuv3tsg6ap10gfcbocu6.apps.googleusercontent.com";

// ✅ ADDED (STRICT MODE SAFE ADDITION ONLY)
function isValidPassword(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,15}$/;

  return regex.test(password);
}

  /* =========================
      STORAGE HELPERS
  ========================= */
  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /* =========================
      SESSION MANAGEMENT
  ========================= */
  function saveSession(user) {
    localStorage.setItem(BOOKZONE_USER_KEY, JSON.stringify(user));
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(BOOKZONE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

function clearSession() {
  localStorage.removeItem(BOOKZONE_USER_KEY);
  localStorage.removeItem("lexi_chat_history");
  localStorage.removeItem("lexi_context");
  localStorage.removeItem("bookzone_continue_reading");

  window.BookzoneUser = null;

  if (window.google && google.accounts?.id) {
    try {
      google.accounts.id.disableAutoSelect();
    } catch {}
  }
}


  /* =========================
      AVATAR HANDLING
  ========================= */
  function updateAvatar(avatarFilename) {
    const user = loadSession();
    if (!user) return;

    const fullPath =
      avatarFilename === null
        ? user.googlePicture || "assets/img/default-avatar.png"
        : `assets/img/avatars/${avatarFilename}`;

    user.picture = fullPath;
    saveSession(user);

    const users = getUsers();
    const idx = users.findIndex(
      u => u.email.toLowerCase() === user.email.toLowerCase()
    );

    if (idx !== -1) {
      users[idx].picture = fullPath;
      saveUsers(users);
    }

    window.BookzoneUser = user;
    UI?.syncNavbar();

    const profileImg = document.getElementById("profileAvatar");
    if (profileImg) profileImg.src = fullPath;

    UI?.showToast("Profile picture updated!", "success");
  }

  /* =========================
      EMAIL LOGIN
  ========================= */
  function loginWithEmail(email, password) {
    if (!email || !password) {
      UI.showPopup({
        title: "Login Required",
        message: "Please enter both email and password.",
        actions: [{ text: "OK" }]
      });
      return;
    }

    const users = getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      UI.showPopup({
        title: "Account Not Found",
        message: "This email is not registered.",
        actions: [
          {
            text: "Create Account",
            class: "btn-primary",
            onClick: () => (window.location.href = "register.html")
          },
          { text: "Cancel", class: "btn-secondary" }
        ]
      });
      return;
    }

    const inputHash = UI.hashPassword(password);
    
    if (user.password !== inputHash) {
      UI.showPopup({
        title: "Incorrect Password",
        message: "The password you entered is incorrect.",
        actions: [
          {
            text: "Reset Password",
            class: "btn-warning",
            onClick: () => (window.location.href = "reset-password.html")
          },
          { text: "Try Again", class: "btn-secondary" }
        ]
      });
      return;
    }

    const sessionUser = {
      name: user.name,
      email: user.email,
      isAdmin: ADMIN_EMAILS.includes(user.email.toLowerCase()),
      picture: user.picture || "assets/img/default-avatar.png"
    };

    saveSession(sessionUser);
    window.BookzoneUser = sessionUser;
    UI.syncNavbar();

    UI.showPopup({
      title: 'Login Successful',
      message: `Welcome back, <b>${user.name}</b>!`,
      actions: [
        {
          text: "Continue",
          class: "btn-success",
          onClick: () => {
            const cart =
              JSON.parse(localStorage.getItem("bookzone_cart")) || [];
            window.location.href = "index.html";
          }
        }
      ]
    });
  }

  /* =========================
      SIGNUP
  ========================= */
  function signupWithEmail(name, email, password) {

    // ✅ ADDED STRICT VALIDATION ONLY (NO LOGIC REMOVED)
    if (!isValidPassword(password)) {

      UI.showPopup({
        title: "Invalid Password",
        message:
          "Password must be 8–15 characters long and include uppercase, lowercase, and special character.",
        actions: [{ text: "OK", class: "btn-primary" }]
      });

      return;
    }

    const users = getUsers();

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      UI.showPopup({
        title: "Account Exists",
        message: "This email is already registered.",
        actions: [
          {
            text: "Go to Login",
            onClick: () => (window.location.href = "login.html")
          }
        ]
      });
      return;
    }

    const newUser = {
      name,
      email,
      password: UI.hashPassword(password),
      picture: "assets/img/default-avatar.png",
      isAdmin: ADMIN_EMAILS.includes(email.toLowerCase())
    };

    users.push(newUser);
    saveUsers(users);

    saveSession(newUser);
    window.BookzoneUser = newUser;
    UI.syncNavbar();

    UI.showPopup({
      title: 'Account Created',
      message: "Your account has been created successfully.",
      actions: [
        {
          text: "Continue",
          class: "btn-success",
          onClick: () => {
            const cart =
              JSON.parse(localStorage.getItem("bookzone_cart")) || [];
            window.location.href = "index.html";
          }
        }
      ]
    });
  }

  /* =========================
      GOOGLE LOGIN
  ========================= */
  function handleGoogleLogin(response) {
    try {
      const payload = JSON.parse(atob(response.credential.split(".")[1]));
      const users = getUsers();

      let user = users.find(
        u => u.email.toLowerCase() === payload.email.toLowerCase()
      );

      if (!user) {
        user = {
          name: payload.name,
          email: payload.email,
          password: null,
          picture: payload.picture,
          googlePicture: payload.picture,
          isAdmin: ADMIN_EMAILS.includes(payload.email.toLowerCase())
        };
        users.push(user);
        saveUsers(users);
      } else if (!user.googlePicture && payload.picture) {
        user.googlePicture = payload.picture;
        saveUsers(users);
      }

      saveSession(user);
      window.BookzoneUser = user;
      UI.syncNavbar();

      UI.showPopup({
        title: "Google Login Successful",
        message: `Welcome, <b>${user.name}</b>!`,
        actions: [
          {
            text: "Continue",
            class: "btn-success",
            onClick: () => {
              const cart =
                JSON.parse(localStorage.getItem("bookzone_cart")) || [];
              window.location.href = "index.html";
            }
          }
        ]
      });
    } catch (e) {
      UI.showPopup({
        title: "Google Login Failed",
        message: "Something went wrong. Please try again.",
        actions: [{ text: "OK" }]
      });
    }
  }

  /* =========================
      GOOGLE INIT
  ========================= */
  function initGoogleLogin() {
    const btn = document.getElementById("googleLoginBtn");
    if (!btn || !window.google) {
      setTimeout(initGoogleLogin, 100);
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin
    });

    google.accounts.id.renderButton(btn, {
      theme: "outline",
      size: "large",
      width: "100%"
    });
  }

  /* =========================
      LOGOUT
  ========================= */
  function logoutUser() {
    UI.showPopup({
      title: "Logout",
      message: "Are you sure you want to logout?",
      actions: [
        {
          text: "Logout",
          class: "btn-danger",
          onClick: () => {
            clearSession();
            UI.syncNavbar();

            document
              .querySelectorAll(".modal-backdrop")
              .forEach(b => b.remove());

            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";

            setTimeout(() => {
              window.location.href = "index.html";
            }, 100);
          }
        },
        { text: "Cancel", class: "btn-secondary" }
      ]
    });
  }

  /* =========================
      INIT
  ========================= */
  document.addEventListener("DOMContentLoaded", () => {

    // STRICT MODE SAFE VARIABLE DECLARATION
    const signupPass = document.getElementById("signupPassword");
    const signupConfirm = document.getElementById("signupConfirmPassword");

    document.getElementById("loginBtn")?.addEventListener("click", () => {
      loginWithEmail(
        document.getElementById("loginEmail")?.value,
        document.getElementById("loginPassword")?.value
      );
    });

    document.getElementById("signupBtn")?.addEventListener("click", () => {

      const fullName =
        document.getElementById("signupName")?.value.trim();

      const email =
        document.getElementById("signupEmail")?.value.trim();

      const password =
        document.getElementById("signupPassword")?.value;

      const confirmPassword =
        document.getElementById("signupConfirmPassword")?.value;

      if (!isValidPassword(password)) {
        signupPass?.classList.add("is-invalid");
        UI.showPopup({
          title: "Invalid Password",
          message:
            "Password must be 8–15 characters and include uppercase, lowercase, and special character.",
          actions: [{ text: "OK" }]
        });
        return;
      }

      if (password !== confirmPassword) {
        signupConfirm?.classList.add("is-invalid");
        UI.showPopup({
          title: "Password Mismatch",
          message: "Passwords do not match.",
          actions: [{ text: "OK" }]
        });
        return;
      }

      signupWithEmail(fullName, email, password);

    });

    if (signupPass && signupConfirm) {
        [signupPass, signupConfirm].forEach(el => {
            el.addEventListener("input", () => {

                const passVal = signupPass.value;
                const confirmVal = signupConfirm.value;

                signupPass.classList.toggle(
                  "is-invalid",
                  passVal.length > 0 && !isValidPassword(passVal)
                );

                signupConfirm.classList.toggle(
                  "is-invalid",
                  confirmVal.length > 0 && confirmVal !== passVal
                );
            });
        });
    }

    if (document.body?.dataset.page === "login") {
      initGoogleLogin();
    }
  });

  window.BookzoneAuth = {
    loadBookzoneUser: loadSession,
    logoutUser,
    loginWithEmail,
    signupWithEmail,
    updateAvatar,
    isValidPassword
  };

})();