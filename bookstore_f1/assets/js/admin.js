// assets/js/admin.js
(function () {
  const currentUser = JSON.parse(localStorage.getItem("bookzone_user"));
  if (!currentUser || !currentUser.isAdmin) {
    window.location.href = "index.html";
    return;
  }

  const ADMIN_BOOKS_KEY = "bookzone_books"; 
  const ADMIN_COUPONS_KEY = "bookzone_coupons";
  const OFFER_KEY = "bookzone_offer";

  function initAdminStorage() {
    if (!localStorage.getItem(ADMIN_BOOKS_KEY)) {
      localStorage.setItem(ADMIN_BOOKS_KEY, JSON.stringify(window.Bookstore.getAllBooks()));
    }
    if (!localStorage.getItem(ADMIN_COUPONS_KEY)) {
      const defaultCoupons = [
        { code: "SAVE10", discount: 10, isActive: true },
        { code: "MANGA5", discount: 5, isActive: false },
        { code: "WELCOME", discount: 15, isActive: false },
        { code: "READ20", discount: 20, isActive: false },
        { code: "FESTIVAL", discount: 25, isActive: false }
      ];
      localStorage.setItem(ADMIN_COUPONS_KEY, JSON.stringify(defaultCoupons));
    }
    renderCoupons();
    if (document.getElementById("adminReviewContent")) renderReviewModeration();
  }

  /* SEARCH LOGIC */
  window.AdminSearch = {
    handleInput: function (val) {
      const query = val.trim().toLowerCase();
      const resultsDiv = document.getElementById("adminSearchResults");
      if (!resultsDiv) return;
      
      if (query.length < 1) {
        resultsDiv.classList.add("d-none");
        return;
      }

      const books = JSON.parse(localStorage.getItem(ADMIN_BOOKS_KEY)) || [];
      const matches = books.filter(b => b.title.toLowerCase().includes(query)).slice(0, 5);

      if (matches.length > 0) {
        resultsDiv.classList.remove("d-none");
        resultsDiv.innerHTML = matches.map(b => `
          <div class="p-3 border-bottom hover-bg cursor-pointer d-flex align-items-center gap-3 bg-white text-dark" 
               onclick="Admin.loadToEditor('${b.id}')">
            <img src="${b.image}" width="30" height="40" style="object-fit:cover" class="rounded">
            <div>
              <div class="fw-bold small">${b.title}</div>
              <div class="extra-small text-muted">${b.category}</div>
            </div>
          </div>
        `).join("");
      } else {
        resultsDiv.innerHTML = `<div class="p-3 text-muted small bg-white">No books found</div>`;
      }
    }
  };

  /*EDITOR LOGIC */
  window.Admin = {
    loadToEditor: function (id) {
      const books = JSON.parse(localStorage.getItem(ADMIN_BOOKS_KEY));
      const b = books.find(x => x.id === id);
      const resultsDiv = document.getElementById("adminSearchResults");
      if(resultsDiv) resultsDiv.classList.add("d-none");
      if (!b) return;

      const card = document.querySelector('.card.shadow-soft.border-0.rounded-4.bg-elevated');
      if (card) {
          card.classList.remove('fade-in-up');
          void card.offsetWidth; 
          card.classList.add('fade-in-up');
      }

      document.getElementById("bookId").value = b.id;
      document.getElementById("bookTitle").value = b.title;
      document.getElementById("bookCategory").value = b.category;
      document.getElementById("bookAvailable").checked = b.available !== false;

      const author = document.getElementById("bookAuthor");
      if(author) author.value = b.author || "";
      
      const price = document.getElementById("bookPrice");
      if(price) price.value = b.price || 0;

      window.UI?.showToast(`Selected: ${b.title}`, "info");
    },
    toggleCouponStatus: function (idx) {
      let coupons = JSON.parse(localStorage.getItem(ADMIN_COUPONS_KEY));
      coupons[idx].isActive = !coupons[idx].isActive;
      localStorage.setItem(ADMIN_COUPONS_KEY, JSON.stringify(coupons));
      renderCoupons();
      
      const activeUserCoupon = JSON.parse(localStorage.getItem("active_session_coupon"));
      if (activeUserCoupon && activeUserCoupon.code === coupons[idx].code && !coupons[idx].isActive) {
          localStorage.removeItem("active_session_coupon");
      }
    },

    // CREATE DYNAMIC COUPON
    createNewCoupon: function() {
        const codeInput = document.getElementById("newCouponCode");
        const discountInput = document.getElementById("newCouponDiscount");
        if(!codeInput || !discountInput) return;

        const code = codeInput.value.trim().toUpperCase();
        const discount = parseInt(discountInput.value);

        if(!code || isNaN(discount)) {
            window.UI.showToast("Enter valid code and discount percentage", "warning");
            return;
        }

        let coupons = JSON.parse(localStorage.getItem(ADMIN_COUPONS_KEY)) || [];
        if(coupons.some(c => c.code === code)) {
            window.UI.showToast("Coupon code already exists", "danger");
            return;
        }

        coupons.unshift({ code, discount, isActive: true });
        localStorage.setItem(ADMIN_COUPONS_KEY, JSON.stringify(coupons));
        
        codeInput.value = "";
        discountInput.value = "";
        renderCoupons();
        window.UI.showToast(`Coupon ${code} Created!`, "success");
    },

    // DELETE COUPON
    deleteCoupon: function(idx) {
        window.UI.showPopup({
            title: "Remove Coupon?",
            message: "This discount code will be permanently deleted.",
            actions: [
                { text: "Delete", class: "btn-danger", onClick: () => {
                    let coupons = JSON.parse(localStorage.getItem(ADMIN_COUPONS_KEY));
                    coupons.splice(idx, 1);
                    localStorage.setItem(ADMIN_COUPONS_KEY, JSON.stringify(coupons));
                    renderCoupons();
                    window.UI.showToast("Coupon Removed", "success");
                }},
                { text: "Cancel", class: "btn-secondary" }
            ]
        });
    },

    // DELETE REVIEW MODERATION
    deleteReview: function(parentId, reviewId, type) {
        window.UI.showPopup({
            title: "Delete Review?",
            message: `This will permanently remove this ${type} feedback.`,
            actions: [
                { 
                    text: "Delete", 
                    class: "btn-danger", 
                    onClick: () => {
                        const storageKey = type === 'comic' ? "bookzone_comic_reviews" : "bookzone_reviews";
                        let allReviews = JSON.parse(localStorage.getItem(storageKey)) || {};
                        
                        if(allReviews[parentId]) {
                            allReviews[parentId] = allReviews[parentId].filter(r => r.id !== reviewId);
                            if(allReviews[parentId].length === 0) delete allReviews[parentId];
                            
                            localStorage.setItem(storageKey, JSON.stringify(allReviews));
                            renderReviewModeration();
                            window.UI.showToast("Review Removed", "success");
                        }
                    }
                },
                { text: "Cancel", class: "btn-secondary" }
            ]
        });
    }
};

  /* RENDER COUPONS WITH REMOVE BUTTON */
  function renderCoupons() {
    const coupons = JSON.parse(localStorage.getItem(ADMIN_COUPONS_KEY)) || [];
    const container = document.getElementById("adminCouponList");
    if (!container) return;

    container.innerHTML = coupons.map((c, idx) => `
        <div class="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light border border-subtle mb-2 coupon-item-card">
            <div class="d-flex align-items-center gap-3">
                <div class="bg-primary bg-opacity-10 p-2 rounded-2 text-primary">
                    <i class="ri-ticket-2-line fs-5"></i>
                </div>
                <div>
                    <div class="fw-bold text-main small coupon-code-text">${c.code}</div>
                    <div class="text-muted extra-small coupon-discount-text">${c.discount}% Discount</div>
                </div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <div class="form-check form-switch ps-0">
                    <input class="form-check-input ms-0" type="checkbox" role="switch" 
                           ${c.isActive ? 'checked' : ''} 
                           onclick="Admin.toggleCouponStatus(${idx})"
                           style="width: 2.4rem; height: 1.2rem; cursor: pointer;">
                </div>
                <button class="btn btn-link text-danger p-0 border-0 ms-2" onclick="Admin.deleteCoupon(${idx})">
                    <i class="ri-delete-bin-6-line fs-5"></i>
                </button>
            </div>
        </div>`).join("");
  }

  // RENDER REVIEW MODERATION FEED
  function renderReviewModeration() {
    const container = document.getElementById("adminReviewContent");
    if(!container) return;

    // 1. Fetch both review types
    const bookReviews = JSON.parse(localStorage.getItem("bookzone_reviews")) || {};
    const comicReviews = JSON.parse(localStorage.getItem("bookzone_comic_reviews")) || {};
    
    let html = "";
    let count = 0;

    // Helper to generate template
    const createTemplate = (parentId, r, type) => {
        count++;
        const badgeClass = type === 'comic' ? 'bg-warning text-dark' : 'bg-info text-white';
        return `
            <div class="card mb-3 shadow-sm border-0 bg-white">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="badge ${badgeClass} extra-small">${type.toUpperCase()}</span>
                            <span class="fw-bold text-main small">${r.userName}</span>
                            <span class="text-muted extra-small">ID: ${parentId}</span>
                        </div>
                        <div class="text-warning extra-small mb-1">${'★'.repeat(r.stars || 5)}${'☆'.repeat(5-(r.stars || 5))}</div>
                        <p class="text-secondary small mb-0">${r.text}</p>
                    </div>
                    <button class="btn btn-sm btn-outline-danger border-0" 
                            onclick="Admin.deleteReview('${parentId}', '${r.id}', '${type}')">
                        <i class="ri-delete-bin-line fs-5"></i>
                    </button>
                </div>
            </div>`;
    };

    // 2. Loop through Book Reviews
    for(const id in bookReviews) {
        bookReviews[id].forEach(r => html += createTemplate(id, r, 'book'));
    }

    // 3. Loop through Comic Reviews
    for(const id in comicReviews) {
        comicReviews[id].forEach(r => html += createTemplate(id, r, 'comic'));
    }

    container.innerHTML = count > 0 ? html : `<div class="text-center py-5 text-muted small">No reviews found.</div>`;
}

  // Festival Logics
  document.addEventListener("DOMContentLoaded", () => {
    initAdminStorage();
    const festSelect = document.getElementById("globalFestivalSelect");
    const actBtn = document.getElementById("activateFestivalBtn");
    const deactBtn = document.getElementById("deactivateFestivalBtn");

    if (actBtn && festSelect) {
      actBtn.onclick = () => {
        localStorage.setItem(OFFER_KEY, JSON.stringify({ 
            active: true, 
            festival: festSelect.value || null, 
            discount: Math.floor(Math.random() * 11) + 5 
        }));
        window.UI?.showToast("Festival Offer Active", "success");
      };
      deactBtn.onclick = () => {
        localStorage.setItem(OFFER_KEY, JSON.stringify({ active: false, festival: null, discount: 3 }));
        window.UI?.showToast("Offers Deactivated", "info");
      };
    }

    /* ✅ FORM SUBMISSION FIX */
    const form = document.getElementById("bookForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const currentId = document.getElementById("bookId").value;
        if (!currentId) { window.UI?.showToast("Search and select a book first!", "warning"); return; }

        let books = JSON.parse(localStorage.getItem(ADMIN_BOOKS_KEY));
        const idx = books.findIndex(b => b.id === currentId);
        
        if (idx > -1) {
          books[idx].available = document.getElementById("bookAvailable").checked;
          localStorage.setItem(ADMIN_BOOKS_KEY, JSON.stringify(books));
          window.UI?.showToast("Availability Updated!", "success");
        }
      });
    }
  });
})();