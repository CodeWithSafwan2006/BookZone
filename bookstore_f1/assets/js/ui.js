// assets/js/ui.js
(function () {
  const $ = (id) => document.getElementById(id);

  // ✅ FIXED: ULTRA-ROBUST PERSISTENT TOAST CHECK (MUTATION OBSERVER)
  function checkPersistentToasts() {
    const pending = JSON.parse(sessionStorage.getItem("pending_toast"));
    if (!pending) return;

    const observer = new MutationObserver((mutations, obs) => {
      const container = $("toastContainer");
      if (container) {
        showToast(pending.message, pending.type);
        sessionStorage.removeItem("pending_toast");
        obs.disconnect();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    setTimeout(() => observer.disconnect(), 3000);
  }

  // ✅ UPDATED: SIMPLIFIED TRACK READING (4-BOOK LIMIT FIFO)
  function trackReading(bookId) {
    const key = "bookzone_continue_reading";
    let readingList = JSON.parse(localStorage.getItem(key)) || [];

    readingList = readingList.filter((item) => {
      const id = typeof item === "object" ? item.id : item;
      return id !== bookId;
    });

    readingList.unshift(bookId);
    if (readingList.length > 4) readingList.pop();

    localStorage.setItem(key, JSON.stringify(readingList));

    if (
      document.body.dataset.page === "library" &&
      typeof window.renderLibraryDashboard === "function"
    ) {
      window.renderLibraryDashboard();
    }
  }

  // ✅ NEW: REMOVE FROM READING HISTORY
  function removeFromReading(bookId, event) {
    if (event) event.stopPropagation();
    const key = "bookzone_continue_reading";
    let readingList = JSON.parse(localStorage.getItem(key)) || [];

    readingList = readingList.filter((item) => {
      const id = typeof item === "object" ? item.id : item;
      return id !== bookId;
    });

    localStorage.setItem(key, JSON.stringify(readingList));

    if (typeof window.renderLibraryDashboard === "function") {
      window.renderLibraryDashboard();
    }
    showToast("Removed from reading history", "info");
  }

  // ✅ FIXED: PREMIUM FLYING CART ANIMATION
  function animateToCart(event, imgSrc) {
    const cart = document.querySelector(".cart-wrapper");
    if (!cart || !imgSrc || !event) return;

    const flyingImg = document.createElement("img");
    flyingImg.src = imgSrc;
    flyingImg.className = "flying-cart-item";

    const startX = event.clientX;
    const startY = event.clientY;
    const cartRect = cart.getBoundingClientRect();

    flyingImg.style.left = `${startX}px`;
    flyingImg.style.top = `${startY}px`;

    document.body.appendChild(flyingImg);

    requestAnimationFrame(() => {
      flyingImg.style.left = `${cartRect.left + cartRect.width / 2}px`;
      flyingImg.style.top = `${cartRect.top + cartRect.height / 2}px`;
      flyingImg.style.transform = "scale(0.1) rotate(720deg)";
      flyingImg.style.opacity = "0.2";
    });

    setTimeout(() => {
      flyingImg.remove();
      cart.classList.add("animate__animated", "animate__headShake");
      setTimeout(
        () => cart.classList.remove("animate__animated", "animate__headShake"),
        500,
      );
    }, 800);
  }

  // ✅ FIXED: BUY AGAIN / REORDER LOGIC (Strict ID Resolution via Bookstore)
  function reorderItems(orderId, event) {
    const user = window.BookzoneAuth?.loadBookzoneUser();
    if (!user) return;

    const historyKey = `orders_${user.email.toLowerCase()}`;
    const history = JSON.parse(localStorage.getItem(historyKey)) || [];
    const order = history.find((o) => o.id === orderId);

    if (order && window.Cart) {
      order.items.forEach((item) => {
        // BUG FIX: Strictly resolve ID from Bookstore to ensure valid cart insertion
        const resolvedItem =
          window.Bookstore.getBookById(item.id) ||
          window.Bookstore.getComicSeriesById?.(item.id) ||
          item;

        if (resolvedItem?.id) {
          Cart.addToCart(resolvedItem.id, item.qty, true);
        }
      });

      animateToCart(event, "assets/img/reorder-icon.png");
      showToast(`Order items added to cart!`, "success");
    }
  }

  // ✅ NEW: PREMIUM HERO SECTION INJECTION (Custom for every page)
function injectPremiumHero() {
  const page = document.body.dataset.page;
  const container =
    document.querySelector("header.page-header") ||
    document.querySelector("section.hero");

  if (!container) return;

  // --- Offer state ---
  const rawOffer = JSON.parse(localStorage.getItem("bookzone_offer"));
  const offer = {
    active: rawOffer?.active === true,
    discount: Number(rawOffer?.discount) || 3,
    festival: rawOffer?.festival || null,
  };

  const isFestivalActive = offer.active && offer.festival;
  const activeDiscount = isFestivalActive ? offer.discount : 3;

  let title = "";
  let desc = "";

  switch (page) {
    case "home":
      title = "Your Gateway to Boundless Stories";
      desc =
        "Discover premium books, exclusive manga, and thoughtfully curated collections built for modern readers.";
      break;

    case "featured":
      title = "Editor’s Choice Collection";
      desc =
        "A refined selection of titles chosen for quality, creativity, and lasting value.";
      break;

    case "new-arrival":
      title = "Fresh Releases";
      desc =
        "Explore the newest additions shaping today’s reading culture.";
      break;

    case "library":
      title = "The Public Library";
      desc =
        "Access classic literature instantly, with premium offline editions available.";
      break;

    case "comics":
      title = "Manga & Graphic Novels";
      desc =
        "Iconic series and immersive visual storytelling from creators around the world.";
      break;

    case "offer":
  if (isFestivalActive) {
    title = "Festival Offer Active";
    // ✅ Icon added directly into the line next to the Festival Name
    desc = `<i class="ri-sparkling-fill festival-icon"></i> <span class="premium-festival-name">${offer.festival} Sale</span> — <strong class="discount-glam">${activeDiscount}% discount</strong> currently applied on all collections.`;
  } else {
    title = "Premium Member Discount";
    desc = `<i class="ri-vip-crown-2-line premium-icon"></i> A Standard <span class="standard-premium-text">3% Discount</span> is automatically applied on eligible collections.`;
  }
  break;

    default:
      return;
  }

  container.innerHTML = `
    <div class="page-hero">
      <h1>${title}</h1>
      <p>${desc}</p>
    </div>
  `;
}


  // ✅ NEW: PREMIUM GLOBAL FOOTER INJECTION
function injectFooter() {
  const footer = document.querySelector("footer");
  if (!footer) return;

  footer.innerHTML = `
<footer class="footer-premium">
  <div class="container py-4">

    <div class="row footer-grid">

      <!-- ABOUT -->
      <div class="col-6 col-md-3 footer-col">
        <h6 class="footer-title">ABOUT</h6>
        <ul class="footer-links">
          <li>
            <a href="info.html?type=about">
              <i class="ri-information-line"></i>
              <span>About BookZone</span>
            </a>
          </li>

          <li>
            <a href="info.html?type=careers">
              <i class="ri-briefcase-line"></i>
              <span>Careers</span>
            </a>
          </li>

          <li>
            <a href="info.html?type=vision">
              <i class="ri-eye-line"></i>
              <span>Our Vision</span>
            </a>
          </li>
        </ul>
      </div>


      <!-- SOCIAL -->
      <div class="col-6 col-md-3 footer-col">
        <h6 class="footer-title">CONNECT WITH US</h6>
        <ul class="footer-links">

          <li>
            <a href="https://www.facebook.com" target="_blank">
              <i class="ri-facebook-fill"></i>
              <span>Facebook</span>
            </a>
          </li>

          <li>
            <a href="https://www.instagram.com" target="_blank">
              <i class="ri-instagram-line"></i>
              <span>Instagram</span>
            </a>
          </li>

          <li>
            <a href="https://x.com" target="_blank">
              <i class="ri-twitter-x-line"></i>
              <span>X (Twitter)</span>
            </a>
          </li>

        </ul>
      </div>


      <!-- SELL -->
      <div class="col-6 col-md-3 footer-col">
        <h6 class="footer-title">MAKE MONEY WITH US</h6>

        <ul class="footer-links">

          <li>
            <a href="info.html?type=sell">
              <i class="ri-store-2-line"></i>
              <span>Sell on BookZone</span>
            </a>
          </li>

          <li>
            <a href="info.html?type=affiliate">
              <i class="ri-links-line"></i>
              <span>Affiliate Program</span>
            </a>
          </li>

          <li>
            <a href="info.html?type=author">
              <i class="ri-book-2-line"></i>
              <span>Author Publishing</span>
            </a>
          </li>

        </ul>
      </div>


      <!-- HELP -->
      <div class="col-6 col-md-3 footer-col">

        <h6 class="footer-title">HELP & SUPPORT</h6>

        <ul class="footer-links">

          <li>
            <a href="javascript:void(0)" onclick="handleProfileAccess()">
              <i class="ri-user-line"></i>
              <span>Your Account</span>
            </a>
          </li>

          <li>
            <a href="info.html?type=returns">
              <i class="ri-refresh-line"></i>
              <span>Returns Policy</span>
            </a>
          </li>

          <li>
            <a href="info.html?type=support">
              <i class="ri-customer-service-2-line"></i>
              <span>Customer Service</span>
            </a>
          </li>

        </ul>

      </div>

    </div>


    <!-- Divider -->
    <hr class="footer-divider my-4" />


    <!-- Bottom -->
    <div class="footer-bottom text-center">

      © 2026 BookZone. Designed for Readers.

    </div>


  </div>
</footer>
`;

}

window.handleProfileAccess = function() {
    // Correctly access your authentication module
    const user = window.BookzoneAuth?.loadBookzoneUser();
    
    if (user) {
        // Logged-in user goes to profile
        window.location.href = "profile.html";
    } else {
        // Guest user gets a persistent warning and goes to login
        window.UI.showToast("Please login to view your profile", "warning", true);
        window.location.href = "login.html";
    }
};

  function handleReviewVote(bookId, index, type) {
    const user = window.BookzoneAuth.loadBookzoneUser();
    if (!user) {
      UI.showToast("Please login to vote", "warning");
      return;
    }
    const allReviews =
      JSON.parse(localStorage.getItem("bookzone_reviews")) || {};
    if (!allReviews[bookId] || !allReviews[bookId][index]) return;
    const review = allReviews[bookId][index];
    if (!review.votes) review.votes = { up: 0, down: 0 };
    if (type === "up") review.votes.up++;
    else review.votes.down++;
    localStorage.setItem("bookzone_reviews", JSON.stringify(allReviews));
    if (typeof window.renderReviews === "function")
      window.renderReviews(bookId);
  }

  function initTheme() {
    const savedTheme = localStorage.getItem("bookzone_theme") || "light";
    const body = document.body;
    const apply = (theme) => {
      const themeIcon = document.getElementById("themeIcon");
      if (theme === "dark") {
        body.classList.add("dark-mode");
        if (themeIcon) themeIcon.setAttribute("class", "ri-sun-line fs-4");
      } else {
        body.classList.remove("dark-mode");
        if (themeIcon) themeIcon.setAttribute("class", "ri-moon-line fs-4");
      }
    };
    apply(savedTheme);
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("#themeToggle");
      if (btn) {
        btn.style.pointerEvents = "none";
        const isDark = body.classList.contains("dark-mode");
        const nextTheme = isDark ? "light" : "dark";
        localStorage.setItem("bookzone_theme", nextTheme);
        apply(nextTheme);
        setTimeout(() => {
          btn.style.pointerEvents = "auto";
        }, 200);
      }
    });
  }

  function showToast(message, type = "info", persist = false) {
    if (persist) {
      sessionStorage.setItem(
        "pending_toast",
        JSON.stringify({ message, type }),
      );
      return;
    }
    const container = $("toastContainer");
    if (!container) return;
    const activeToasts = container.querySelectorAll(".toast.show");
    if (activeToasts.length >= 2) {
      const oldestToast = activeToasts[0];
      oldestToast.classList.replace("show", "hide");
      setTimeout(() => oldestToast.remove(), 300);
    }
    const toast = document.createElement("div");
    const bgClass =
      type === "success"
        ? "bg-success"
        : type === "danger" || type === "error"
          ? "bg-danger"
          : type === "warning"
            ? "bg-warning text-dark"
            : "bg-dark";
    toast.className = `toast align-items-center show mb-2 border-0 shadow-soft text-white ${bgClass}`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.replace("show", "hide");
        setTimeout(() => toast.remove(), 500);
      }
    }, 3500);
  }

  function initGlobalSearch() {
    const input = $("navSearchInput");
    const results = $("navSearchResults");
    if (!input || !results) return;
    let debounceTimer;
    input.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) {
          results.classList.add("d-none");
          return;
        }
        const allBooks = window.Bookstore?.getAllBooks() || [];
        const matches = allBooks.filter(
          (b) =>
            b.title.toLowerCase().includes(query) ||
            b.author.toLowerCase().includes(query) ||
            (b.category && b.category.toLowerCase().includes(query)),
        );
        results.classList.remove("d-none");
        if (matches.length === 0) {
          results.innerHTML = `<p class="text-center text-muted p-3 mb-0">No results found for "${query}"</p>`;
          return;
        }
        results.innerHTML = matches
          .map((b) => {
            const idNum = parseInt(b.id.replace("book-", ""));
            const validImg =
              isNaN(idNum) || idNum <= 60
                ? b.image
                : "assets/img/default-book.png";
            return `
                    <div class="d-flex align-items-center gap-3 p-3 hover-bg cursor-pointer border-bottom bg-elevated"
                         onclick="window.location.href='${b.isComic || b.category === "comics" ? "comics-series.html?seriesId=" + b.id : "book-details.html?id=" + b.id}'">
                      <div class="search-img-container">
                        <img src="${validImg}" style="width:40px;height:55px;object-fit:cover;" class="rounded shadow-sm" onerror="this.src='assets/img/default-book.png'">
                      </div>
                      <div class="flex-grow-1">
                        <div class="fw-bold small text-main text-truncate" style="max-width: 250px;">${b.title}</div>
                        <div class="text-muted extra-small" style="font-size: 0.75rem;"><i class="ri-user-3-line"></i> ${b.author}</div>
                      </div>
                      <div class="fw-bold text-primary small">${b.price === 0 ? "Free" : "₹" + (b.price || 0)}</div>
                    </div>`;
          })
          .join("");
      }, 300);
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav-search-container"))
        results.classList.add("d-none");
    });
  }

  function syncNavbar() {
    const user = window.BookzoneAuth?.loadBookzoneUser();
    const currentPage = document.body.dataset.page;
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      navbar.innerHTML = `
<div class="container-fluid d-flex align-items-center px-3 position-relative" style="height: 75px;">

    <!-- Logo -->
    <a class="navbar-brand d-flex align-items-center gap-2 me-3" href="index.html">
        <i class="ri-book-open-fill fs-3 text-primary"></i>
        <span class="fw-bold fs-4 text-white">BookZone</span>
    </a>

    <!-- Hamburger Button -->
    <button id="navbarToggle"
        class="btn btn-link text-white d-lg-none ms-auto p-0"
        style="font-size: 28px;">
        <i class="ri-menu-line"></i>
    </button>

    <!-- Desktop Menu -->
    <ul class="navbar-nav d-none d-lg-flex flex-row gap-4 me-auto ms-3">

        <li class="nav-item">
            <a class="nav-link ${currentPage === "home" ? "active text-primary fw-bold" : "text-white"}"
                href="index.html">Home</a>
        </li>

        <li class="nav-item">
            <a class="nav-link ${currentPage === "featured" ? "active text-primary fw-bold" : "text-white"}"
                href="featured.html">Featured</a>
        </li>

        <li class="nav-item">
            <a class="nav-link ${currentPage === "new-arrival" ? "active text-primary fw-bold" : "text-white"}"
                href="new-arrival.html">New Arrivals</a>
        </li>

        <li class="nav-item">
            <a class="nav-link ${currentPage === "library" ? "active text-primary fw-bold" : "text-white"}"
                href="library.html">Library</a>
        </li>

        <li class="nav-item">
            <a class="nav-link ${currentPage === "offer" ? "active text-primary fw-bold" : "text-white"}"
                href="offer.html">Offers</a>
        </li>

        <li class="nav-item">
            <a class="nav-link ${currentPage === "comics" ? "active text-primary fw-bold" : "text-white"}"
                href="comics.html">Comics</a>
        </li>

    </ul>

    <!-- Search -->
    <div class="nav-search-container flex-grow-1 mx-4 d-none d-md-block position-relative"
        style="max-width: 450px;">

        <i class="ri-search-line nav-search-icon"></i>

        <input type="text"
            id="navSearchInput"
            class="form-control rounded-pill themed-placeholder"
            placeholder="Search titles, authors, or categories...">

        <div id="navSearchResults"
            class="d-none position-absolute w-100 shadow-lg rounded-3 bg-elevated mt-2 overflow-auto"
            style="max-height: 400px; z-index: 3000; border: 1px solid var(--border-subtle);">
        </div>

    </div>

    <!-- Right Controls -->
    <div class="d-none d-lg-flex align-items-center gap-4 ms-auto">

        <!-- Theme -->
        <button id="themeToggle"
            class="btn btn-link text-white p-0">
            <i id="themeIcon"
                class="ri-moon-line fs-4"></i>
        </button>

        <!-- Cart -->
        <a href="checkout.html"
            class="cart-wrapper position-relative d-flex align-items-center justify-content-center">

            <div class="cart-glass-base">
                <i class="ri-shopping-cart-2-fill fs-4 text-white"></i>
                <span id="cartCount"
                    class="cart-premium-badge">0</span>
            </div>

        </a>

        <!-- Profile -->
        <div id="profileMenu"
            class="${user ? "" : "d-none"} dropdown">

            <img id="navProfilePic"
                src="${user?.picture || "assets/img/default-avatar.png"}"
                class="rounded-circle border border-2 border-primary"
                width="40"
                height="40"
                data-bs-toggle="dropdown"
                style="cursor:pointer">

            <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 p-2 mt-3">

                <li>
                    <a class="dropdown-item rounded-2"
                        href="profile.html">
                        My Profile
                    </a>
                </li>

                <li>
                    <button class="dropdown-item text-danger rounded-2"
                        onclick="BookzoneAuth.logoutUser()">
                        Logout
                    </button>
                </li>

            </ul>

        </div>

        <!-- Login -->
        <a href="login.html"
            id="loginNavBtn"
            class="${user ? "d-none" : ""} btn btn-primary btn-pill px-4 fw-semibold">

            Login

        </a>

        <!-- Admin -->
        <button id="adminNavBtn"
            onclick="window.location.href='admin.html'"
            class="btn btn-warning btn-sm fw-bold ${user?.isAdmin ? "" : "d-none"}">

            Admin

        </button>

    </div>


    <!-- Mobile Menu -->
    <div id="mobileMenu"
        class="position-absolute top-100 start-0 w-100 bg-dark p-4 d-lg-none shadow-lg"
        style="display:none; z-index:9999;">

        <div class="d-flex flex-column gap-3">

            <a class="nav-link text-white"
                href="index.html">Home</a>

            <a class="nav-link text-white"
                href="featured.html">Featured</a>

            <a class="nav-link text-white"
                href="new-arrival.html">New Arrivals</a>

            <a class="nav-link text-white"
                href="library.html">Library</a>

            <a class="nav-link text-white"
                href="offer.html">Offers</a>

            <a class="nav-link text-white"
                href="comics.html">Comics</a>

            <hr class="border-secondary">

            <a class="nav-link text-white"
                href="checkout.html">Cart</a>

            <a class="nav-link text-white ${user ? "d-none" : ""}"
                href="login.html">Login</a>

            <a class="nav-link text-white ${user?.isAdmin ? "" : "d-none"}"
                href="admin.html">Admin</a>

        </div>

    </div>

</div>
`;
      const toggleBtn = document.getElementById("navbarToggle");
const mobileMenu = document.getElementById("mobileMenu");

toggleBtn?.addEventListener("click", () => {

    if (mobileMenu.style.display === "block") {

        mobileMenu.style.display = "none";

    } else {

        mobileMenu.style.display = "block";

    }

});

      initGlobalSearch();
      if (typeof updateCartCount === "function") updateCartCount();
    }
  }

  function isBookmarked(bookId) {
    const user = window.BookzoneAuth?.loadBookzoneUser();
    if (!user) return false;
    const data = JSON.parse(localStorage.getItem("bookzone_bookmarks")) || {};
    return (
      Array.isArray(data[user.email.toLowerCase()]) &&
      data[user.email.toLowerCase()].includes(bookId)
    );
  }

  function toggleBookmark(bookId, btn) {
    const user = window.BookzoneAuth?.loadBookzoneUser();
    if (!user) {
      UI.showToast("Please login to bookmark items", "warning");
      return;
    }
    const key = "bookzone_bookmarks";
    const data = JSON.parse(localStorage.getItem(key)) || {};
    const email = user.email.toLowerCase();
    if (!Array.isArray(data[email])) data[email] = [];
    const icon = btn.querySelector("i");
    if (data[email].includes(bookId)) {
      data[email] = data[email].filter((id) => id !== bookId);
      btn.classList.remove("active");
      icon.className = "ri-heart-line";
      UI.showToast("Removed from bookmarks", "warning");
    } else {
      if (!data[email].includes(bookId)) {
        data[email].push(bookId);
        btn.classList.add("active");
        icon.className = "ri-heart-fill";
        UI.showToast("Added to bookmarks ❤️", "success");
      }
    }
    localStorage.setItem(key, JSON.stringify(data));
    if (typeof window.renderBookmarks === "function") window.renderBookmarks();
  }

  function confirmRemoveBookmark(bookId) {
    UI.showPopup({
      title: "Remove Bookmark",
      message: "Remove this item from bookmarks?",
      actions: [
        {
          text: "Remove",
          class: "btn-danger",
          onClick: () => {
            const user = window.BookzoneAuth?.loadBookzoneUser();
            const data =
              JSON.parse(localStorage.getItem("bookzone_bookmarks")) || {};
            const email = user.email.toLowerCase();
            if (Array.isArray(data[email])) {
              data[email] = data[email].filter((id) => id !== bookId);
              localStorage.setItem("bookzone_bookmarks", JSON.stringify(data));
            }
            UI.showToast("Bookmark removed", "warning");
            if (typeof window.renderBookmarks === "function")
              window.renderBookmarks();
          },
        },
        { text: "Cancel", class: "btn-secondary" },
      ],
    });
  }

  function updateCartCount() {
    const badge = $("cartCount");
    if (badge && window.Cart) {
      const oldCount = parseInt(badge.textContent) || 0;
      const newCount = window.Cart.getCartItemCount();
      badge.textContent = newCount;
      if (newCount > oldCount) {
        badge.style.animation = "none";
        badge.offsetHeight;
        badge.style.animation = "badgePulse 0.5s ease-in-out";
        const wrapper = document.querySelector(".cart-wrapper");
        if (wrapper) {
          wrapper.classList.add("animate__animated", "animate__bounceIn");
          setTimeout(
            () =>
              wrapper.classList.remove(
                "animate__animated",
                "animate__bounceIn",
              ),
            1000,
          );
        }
      }
    }
  }
  /* ======================================================
   GLOBAL PAGE HERO SYSTEM
====================================================== */

(function renderPageHero() {
  const header = document.querySelector(".page-header");
  if (!header) return;

  const page = document.body.dataset.page;

  const heroes = {
    home: {
      title: "Your Gateway to Boundless Stories",
      desc: "Discover premium books, exclusive manga, and thoughtfully curated collections built for modern readers."
    },
    featured: {
      title: "Editor's Choice Collection",
      desc: "A refined selection of titles chosen for quality, creativity, and lasting value."
    },
    "new-arrival": {
      title: "Fresh Off the Press",
      desc: "Explore the newest arrivals shaping today’s reading trends."
    },
    library: {
      title: "Public Digital Library",
      desc: "Read world-class literature instantly online, with offline editions available anytime."
    },
    comics: {
      title: "Manga & Graphic Novels",
      desc: "Immerse yourself in iconic stories and legendary illustrated worlds."
    },
    offer: {
      title: "Premium Member Discount",
      desc: "Enjoy exclusive savings automatically applied on eligible collections."
    }
  };

  const data = heroes[page];
  if (!data) return;

  header.innerHTML = `
    <div class="page-hero">
      <h1>${data.title}</h1>
      <p>${data.desc}</p>
    </div>
  `;
})();

  function openAvatarPicker() {
    const avatars = [
      "avatar-1.png",
      "avatar-2.png",
      "avatar-3.png",
      "avatar-4.png",
      "avatar-5.png",
      "avatar-6.png",
      "avatar-7.png",
      "avatar-8.png",
    ];
    let html = `<div class="row g-3 text-center">`;
    avatars.forEach((img) => {
      html += `<div class="col-3"><img src="assets/img/avatars/${img}" class="rounded-circle border cursor-pointer avatar-option" style="width: 60px; height: 60px; object-fit: cover; transition: 0.2s;" onclick="BookzoneAuth.updateAvatar('${img}'); bootstrap.Modal.getInstance(document.getElementById('globalPopup')).hide();"></div>`;
    });
    html += `<div class="col-12 mt-3 pt-3 border-top"><button class="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-2" onclick="BookzoneAuth.updateAvatar(null); bootstrap.Modal.getInstance(document.getElementById('globalPopup')).hide();"><i class="ri-restart-line"></i><span>Restore Default Profile Picture</span></button></div></div>`;
    UI.showPopup({
      title: "Choose Your Avatar",
      message: html,
      actions: [{ text: "Cancel", class: "btn-secondary" }],
    });
  }

  // ✅ FIXED: FORCE 3% DEFAULT DISCOUNT CALCULATION
  function createBookCard(book) {
    const user = window.BookzoneAuth?.loadBookzoneUser();
    const bookmarked = user && UI.isBookmarked(book.id);
    const fullBook = window.Bookstore.getBookById(book.id);
    const adminBooks = JSON.parse(localStorage.getItem("bookzone_books")) || [];
    const adminData = adminBooks.find((b) => b.id === book.id);
    const isAvailable = adminData ? adminData.available !== false : true;

    // Force 3% default if no offer exists or is inactive
    const offerData = JSON.parse(localStorage.getItem("bookzone_offer")) || {
      active: false,
      discount: 3,
    };
    const activeDiscount = offerData.active ? offerData.discount : 3;

    let priceHtml = "";
  if (!isAvailable) {
    priceHtml = `<span class="fw-bold text-danger small">Currently Unavailable</span>`;
  } else {
    // 1. Detect if we are on the offer page
    const isOfferPage = document.body.dataset.page === "offer";

    // 2. SAFETY: Ensure activeDiscount is a valid number (default to 3 if null)
    const discountValue = Number(activeDiscount) || 3;

    // 3. Fix the logic block
    if (book.offer || isOfferPage) {
      // Math: Original = (Current Price) / (1 - Discount/100)
      const originalPrice = Math.round(fullBook.price / (1 - discountValue / 100));

      priceHtml = `
          <div class="d-flex flex-column price-tag">
              <span class="text-muted extra-small text-decoration-line-through old-price" 
                    style="text-decoration: line-through !important;">₹${originalPrice}</span>
              <span class="fw-bold text-main new-price">₹${fullBook.price}</span>
          </div>`;
    } else if (fullBook.price === 0) {
      priceHtml = `<span class="fw-bold text-main">Free</span>`;
    } else {
      priceHtml = `<span class="fw-bold text-main">₹${fullBook.price}${book.isLibrary ? ' <small class="text-muted" style="font-size:0.6rem">Offline</small>' : ""}</span>`;
    }
  }
    let tagHtml = "";
    if (book.isLibrary)
      tagHtml = `<span class="badge badge-library"><i class="ri-book-open-fill"></i></span>`;
    else if (book.offer)
      tagHtml = `<span class="badge badge-offer"><i class="ri-percent-fill"></i></span>`;
    else if (book.newArrival)
      tagHtml = `<span class="badge badge-new"><i class="ri-fire-fill"></i></span>`;
    else if (book.isComic || book.category === "comics")
      tagHtml = `<span class="badge badge-comics"><i class="ri-mickey-fill"></i></span>`;
    else if (book.isFeatured)
      tagHtml = `<span class="badge badge-featured"><i class="ri-medal-fill"></i></span>`;
    const detailsPage =
      book.isComic || book.category === "comics"
        ? `comics-series.html?seriesId=${book.id}`
        : `book-details.html?id=${book.id}`;
    const actionButton = book.isLibrary
      ? `<a href="${fullBook.readUrl || "#"}" target="_blank" class="btn btn-sm btn-outline-primary px-3 rounded-pill" onclick="UI.trackReading('${book.id}')">Read</a>`
      : `<button class="btn btn-sm ${isAvailable ? "btn-primary" : "btn-secondary"} px-3 rounded-pill" onclick="event.stopPropagation(); if(${isAvailable}) { Cart.addToCart('${book.id}'); UI.animateToCart(event, '${book.image}'); }">Add</button>`;
    return `<div class="col-6 col-md-4 col-lg-3 ${!isAvailable ? "opacity-75" : ""}"><div class="card h-100 border-0 shadow-soft book-card" onclick="if(!event.target.closest('button') && !event.target.closest('a')) window.location.href='${detailsPage}'"><div class="position-relative">${tagHtml}<button class="bookmark-btn position-absolute top-0 end-0 m-2 ${bookmarked ? "active" : ""}" onclick="event.stopPropagation(); UI.toggleBookmark('${book.id}', this)"><i class="ri-heart-${bookmarked ? "fill" : "line"}"></i></button><img src="${book.image}" class="card-img-top" loading="lazy" style="${!isAvailable ? "filter: grayscale(1);" : ""}"></div><div class="card-body p-3 d-flex flex-column"><h6 class="fw-bold text-truncate mb-1 text-main">${book.title}</h6><p class="text-muted small mb-2">${book.author}</p><div class="d-flex justify-content-between align-items-center mt-auto">${priceHtml}${actionButton}</div></div></div></div>`;
  }

  function renderOrderHistory() {
    const user = window.BookzoneAuth?.loadBookzoneUser();
    const container = $("orderHistoryContainer");
    if (!user || !container) return;
    const history =
      JSON.parse(localStorage.getItem(`orders_${user.email.toLowerCase()}`)) ||
      [];
    if (history.length === 0) {
      container.innerHTML = `<p class="text-muted small">No orders found yet.</p>`;
      return;
    }
    container.innerHTML = history
      .map(
        (order) =>
          `<div class="card bg-elevated border-0 mb-3 rounded-3 shadow-sm overflow-hidden fade-in-up"><div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center py-3"><div><span class="fw-bold text-main small d-block">${order.id}</span><span class="text-muted extra-small">${order.date}</span></div><div class="d-flex gap-2 align-items-center"><button class="btn btn-primary btn-sm rounded-pill px-3" onclick="UI.reorderItems('${order.id}', event)"><i class="ri-refresh-line me-1"></i> Buy Again</button><span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3">${order.status}</span></div></div><div class="card-body"><div class="py-2">${order.items.map((i) => `<div class="d-flex justify-content-between extra-small mb-1"><span class="text-main">${i.title} (x${i.qty})</span><span class="text-muted">₹${i.price * i.qty}</span></div>`).join("")}</div><div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2"><div class="extra-small text-muted"><i class="ri-bank-card-line me-1"></i> ${order.paymentMethod}</div><div class="fw-bold text-primary">Total: ₹${order.total}</div></div></div></div>`,
      )
      .join("");
  }

  function renderPageContent() {
    const page = document.body.getAttribute("data-page");
    const bs = window.Bookstore;
    if (!bs) return;
    switch (page) {
      case "home":
        $("featuredList") &&
          ($("featuredList").innerHTML = bs
            .getFeaturedBooks()
            .slice(0, 4)
            .map(createBookCard)
            .join(""));
        $("newArrivalHome") &&
          ($("newArrivalHome").innerHTML = bs
            .getNewArrivalBooks()
            .slice(0, 4)
            .map(createBookCard)
            .join(""));
        $("offerListHome") &&
          ($("offerListHome").innerHTML = bs
            .getOfferBooks()
            .slice(0, 4)
            .map(createBookCard)
            .join(""));
        $("comicsHome") &&
          ($("comicsHome").innerHTML = bs
            .getComics()
            .slice(0, 4)
            .map(createBookCard)
            .join(""));
        break;
      case "featured":
        $("featuredBooksContainer") &&
          ($("featuredBooksContainer").innerHTML = bs
            .getFeaturedBooks()
            .map(createBookCard)
            .join(""));
        break;
      case "new-arrival":
        $("newArrivalContainer") &&
          ($("newArrivalContainer").innerHTML = bs
            .getNewArrivalBooks()
            .map(createBookCard)
            .join(""));
        break;
      case "library":
        if (typeof window.renderLibraryDashboard === "function")
          window.renderLibraryDashboard();
        $("onlineBooksContainer") &&
          ($("onlineBooksContainer").innerHTML = bs
            .getLibraryBooks()
            .map(createBookCard)
            .join(""));
        break;
      case "checkout":
        window.Cart?.renderCheckoutSummary();
        break;
      case "offer":
        $("offerBooksContainer") &&
          ($("offerBooksContainer").innerHTML = bs
            .getOfferBooks()
            .map(createBookCard)
            .join(""));
        break;
      case "comics":
        $("comicsContainer") &&
          ($("comicsContainer").innerHTML = bs
            .getComics()
            .map(createBookCard)
            .join(""));
        break;
      case "profile":
        renderOrderHistory();
        break;
      case "comics-series":
        if (typeof window.renderSeriesDetails === "function")
          window.renderSeriesDetails();
        break;
    }
  }

  function showPopup({ 
  title = "", 
  message = "", 
  actions = [], 
  backdrop = true,    // ✅ Support for 'static' backdrop (blocks clicking outside)
  keyboard = true,    // ✅ Support for blocking Esc key
  hideCloseButton = false,
  type = ""           // ✅ Added type support for specialized alerts (e.g., 'error')
}) {
  const modalElement = document.getElementById("globalPopup") || $("globalPopup");
  if (!modalElement) return;

  // 1. Set Content
  const titleEl = document.getElementById("popupTitle") || $("popupTitle");
  const messageEl = document.getElementById("popupMessage") || $("popupMessage");
  
  if (titleEl) titleEl.textContent = title;
  if (messageEl) {
    // If it's an availability error, we can style it specifically
    if (type === "error") {
      messageEl.innerHTML = `<div class="text-danger">${message}</div>`;
    } else {
      messageEl.innerHTML = message;
    }
  }

  // 2. Control Close Button (Hide for Success/Error Locks)
  const closeBtn = modalElement.querySelector(".btn-close");
  if (closeBtn) {
    closeBtn.style.display = hideCloseButton ? "none" : "block";
  }

  // 3. Render Action Buttons
  const footer = document.getElementById("popupActions") || $("popupActions");
  if (footer) {
    footer.innerHTML = "";
    // FORCE footer visibility (essential if checkout logic previously hid it)
    footer.style.display = "flex"; 

    actions.forEach((a) => {
      const btn = document.createElement("button");
      btn.className = `btn ${a.class || "btn-primary"}`;
      btn.textContent = a.text || "OK";
      btn.onclick = () => {
        if (a.onClick) a.onClick();
        // Hide correct Bootstrap instance
        const instance = bootstrap.Modal.getInstance(modalElement);
        if (instance) instance.hide();
      };
      footer.appendChild(btn);
    });
  }

  // 4. 🔥 Fix "Black Shade" (Clean up old instances)
  const existingInstance = bootstrap.Modal.getInstance(modalElement);
  if (existingInstance) {
    existingInstance.dispose(); 
  }

  // 5. Initialize with the passed options
  const modalInstance = new bootstrap.Modal(modalElement, {
    backdrop: backdrop, // Blocks clicking outside if set to 'static'
    keyboard: keyboard  // Blocks Esc key if set to false
  });

  // 6. 🌑 Dark Mode Visual Consistency
  const modalContent = modalElement.querySelector('.modal-content');
  if (modalContent && document.body.classList.contains('dark-mode')) {
      modalContent.style.backgroundColor = "#161b22";
      modalContent.style.color = "#f1f5f9";
      modalContent.style.borderColor = "#30363d";
  }

  modalInstance.show();
}

  function confirmOfflinePurchase(bookId) {
    const book = window.Bookstore.getBookById(bookId);
    if (!book) return;
    const modalBody = document.getElementById("offlineModalBody");
    if (modalBody) {
      modalBody.innerHTML = `<p class="mb-0 text-main">This book is free to read online. Still want to buy offline for <strong>₹${book.price}</strong>?</p>`;
    }
    const modalElement = document.getElementById("offlineConfirmModal");
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
      const confirmBtn = document.getElementById("confirmOfflineBtn");
      if (confirmBtn) {
        confirmBtn.onclick = () => {
          window.Cart.addToCart(bookId);
          modal.hide();
        };
      }
    }
  }
  
  function toggleBackToTop() {
    const btn = document.getElementById("backToTop");
    if (!btn) return;
    const threshold = 300;
    const currentScroll =
      window.pageYOffset || document.documentElement.scrollTop;
    if (currentScroll > threshold) {
      btn.style.display = "flex";
      setTimeout(() => {
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
      }, 10);
    } else {
      btn.style.opacity = "0";
      btn.style.pointerEvents = "none";
      setTimeout(() => {
        if (btn.style.opacity === "0") btn.style.display = "none";
      }, 300);
    }
  }

  function injectBackButton() {
    const page = document.body.getAttribute("data-page");
    if (["book-details", "comics-series"].includes(page)) {
      const container =
        document.querySelector("section.container") ||
        document.querySelector("main .container") ||
        document.querySelector(".container.py-4") ||
        document.querySelector(".container.mt-5");
      if (container) {
        if (container.querySelector(".back-btn-injected")) return;
        const btn = document.createElement("button");
        btn.className =
          "btn btn-link text-decoration-none text-main ps-0 mb-3 hover-primary transition-all d-flex align-items-center gap-2 back-btn-injected";
        btn.innerHTML = `<i class="ri-arrow-left-line"></i> <span>Back</span>`;
        btn.onclick = () => window.history.back();
        container.prepend(btn);
      }
    }
  }

  window.onscroll = toggleBackToTop;

  window.addEventListener("storage", (e) => {
    const syncKeys = [
      "bookzone_cart",
      "bookzone_user",
      "bookzone_bookmarks",
      "bookzone_books",
      "bookzone_continue_reading",
      "bookzone_coupons",
      "bookzone_reviews",
    ];
    if (syncKeys.includes(e.key)) {
      updateCartCount();
      syncNavbar();
      renderPageContent();
      if (document.body.dataset.page === "profile") {
        if (typeof window.renderBookmarks === "function")
          window.renderBookmarks();
      }
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("backToTop");
    if (btn) {
      btn.onclick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    }
    initTheme();
    syncNavbar();
    updateCartCount();
    renderPageContent();
    injectBackButton();
    toggleBackToTop();
    checkPersistentToasts();
    injectPremiumHero(); // Hero injection
    injectFooter(); // Footer injection
    if ($("year")) $("year").textContent = new Date().getFullYear();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  });

  window.UI = {
    showToast,
    showPopup,
    updateCartCount,
    syncNavbar,
    toggleBookmark,
    isBookmarked,
    confirmRemoveBookmark,
    confirmOfflinePurchase,
    createBookCard,
    openAvatarPicker,
    injectBackButton,
    reorderItems,
    hashPassword: (p) =>
      typeof CryptoJS !== "undefined" ? CryptoJS.SHA256(p).toString() : p,
    renderOrderHistory,
    animateToCart,
    reorderItems,
    trackReading,
    removeFromReading,
    handleReviewVote,
  };
})();
