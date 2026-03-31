// assets/js/reset-password.js
(function () {
  "use strict";

  const USERS_KEY = "bookzone_users";

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================
       PASSWORD REQUIREMENT LINE VALIDATION (NEW)
       Does NOT remove any existing logic
    ========================================== */

    const resetPasswordInput =
      document.getElementById("resetPassword");

    const resetPasswordHint =
      document.getElementById("resetPasswordHint");

    function isValidPassword(password) {
      const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,15}$/;
      return regex.test(password);
    }

    if (resetPasswordInput && resetPasswordHint) {

      resetPasswordInput.addEventListener("input", function () {

        const password = this.value;

        this.classList.remove("is-valid", "is-invalid");
        resetPasswordHint.classList.remove("valid", "invalid");

        if (password.length === 0) return;

        if (isValidPassword(password)) {

          this.classList.add("is-valid");
          resetPasswordHint.classList.add("valid");

        } else {

          this.classList.add("is-invalid");
          resetPasswordHint.classList.add("invalid");

        }

      });

    }

    /* ==========================================
       RESET BUTTON CLICK LOGIC (EXISTING LOGIC — NOT REMOVED)
    ========================================== */

    document.getElementById("resetBtn")?.addEventListener("click", () => {

      // ✅ UPDATED: Use a single Full Name field to match signup data
      const fullName =
        document.getElementById("resetFullName")?.value.trim();

      const email =
        document.getElementById("resetEmail")?.value.trim();

      const password =
        document.getElementById("resetPassword")?.value;

      const confirmPassword =
        document.getElementById("resetConfirmPassword")?.value;

      // ✅ ALL EMPTY
      if (!fullName && !email && !password && !confirmPassword) {

        UI.showPopup({
          title: "Missing Details",
          message: "Please fill the details first.",
          actions: [{ text: "OK" }],
        });

        return;
      }

      // ✅ PARTIALLY FILLED
      if (!fullName || !email || !password || !confirmPassword) {

        UI.showPopup({
          title: "Incomplete Details",
          message: "Please fill all the details perfectly.",
          actions: [{ text: "OK" }],
        });

        return;
      }

      // ✅ PASSWORD VALIDATION (EXISTING LOGIC PRESERVED)
      if (!isValidPassword(password)) {

        resetPasswordInput?.classList.add("is-invalid");
        resetPasswordHint?.classList.add("invalid");

        UI.showPopup({
          title: "Invalid Password",
          message:
            "Password must be 8–15 characters and include uppercase, lowercase, and special character.",
          actions: [{ text: "OK" }]
        });

        return;
      }

      // ✅ PASSWORD MISMATCH
      if (password !== confirmPassword) {

        UI.showPopup({
          title: "Password Mismatch",
          message: "Passwords do not match.",
          actions: [{ text: "OK" }],
        });

        return;
      }

      const users = getUsers();

      // ✅ CASE-INSENSITIVE USER SEARCH
      const userIndex = users.findIndex(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.name.toLowerCase() === fullName.toLowerCase(),
      );

      // ❌ USER NOT FOUND
      if (userIndex === -1) {

        UI.showPopup({
          title: "Account Not Found",
          message:
            "Account not found with these details. Please check your name and email capitalization.",
          actions: [{ text: "OK" }],
        });

        return;
      }

      // ✅ HASH AND SAVE NEW PASSWORD
      users[userIndex].password =
        UI.hashPassword(password);

      saveUsers(users);

      UI.showPopup({
        title: 'Password Reset Successful',
        message: "You can now login with your new password.",
        actions: [
          {
            text: "Go to Login",
            class: "btn-success",
            onClick: () =>
              (window.location.href = "login.html"),
          },
        ],
      });

    });

  });

})();
