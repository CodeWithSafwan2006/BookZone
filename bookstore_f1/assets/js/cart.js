// assets/js/cart.js
(function () {
const getUserCartKey = () => {
    const user = window.BookzoneAuth?.loadBookzoneUser();
    return user ? `cart_${user.email.toLowerCase()}` : "bookzone_guest_cart";
};

const ADMIN_COUPONS_KEY = "bookzone_coupons";

const getStoredCart = () => JSON.parse(localStorage.getItem(getUserCartKey())) || [];

function saveCart(cartData) {
    localStorage.setItem(getUserCartKey(), JSON.stringify(cartData));
    if (window.UI && window.UI.updateCartCount) window.UI.updateCartCount();
}

  function isLoggedIn() {
    return !!window.BookzoneAuth?.loadBookzoneUser();
  }

  function getItemById(itemId) {
    if (!itemId) return null;
    let book = window.Bookstore.getBookById(itemId);
    if (book) return book;

    if (itemId.startsWith("series:")) {
      const sid = itemId.replace("series:", "");
      const series = window.Bookstore.getComicSeriesById(sid);
      if (series) return { ...series, price: series.totalPrice, id: itemId };
    }

    const comics = window.Bookstore.getComics() || [];
    for (const s of comics) {
      const v = s.volumes?.find((x) => x.volumeId === itemId);
      if (v)
        return { ...v, id: v.volumeId, category: "comics", parentSeries: s.id };
    }
    return null;
  }

  window.Cart = {
    addToCart: function (itemId, qty = 1, silent = false) {
      const itemData = getItemById(itemId);
      if (!itemData) return;

      const adminBooks =
        JSON.parse(localStorage.getItem("bookzone_books")) || [];
      const bookStatus = adminBooks.find(
        (b) =>
          b.id === itemId ||
          (itemData.parentSeries && b.id === itemData.parentSeries),
      );

      if (bookStatus && bookStatus.available === false) {
        window.UI.showPopup({
          title: "Currently Unavailable",
          message:
            "Currently this book is not available. You can visit our nearest store or come back again in a few days.",
          actions: [{ text: "Got it", class: "btn-primary" }],
        });
        return;
      }

      let currentCart = getStoredCart();
      const existingIndex = currentCart.findIndex((i) => i.id === itemId);

      if (existingIndex > -1) {
        currentCart[existingIndex].qty += qty;
        if (currentCart[existingIndex].qty <= 0) {
          currentCart.splice(existingIndex, 1);
          if (!silent)
            window.UI?.showToast(`${itemData.title} removed`, "danger");
        } else {
          const action = qty > 0 ? "increased" : "decreased";
          if (!silent)
            window.UI?.showToast(
              `${itemData.title} quantity ${action}`,
              "info",
            );
        }
      } else if (qty > 0) {
        currentCart.push({ id: itemId, qty: qty });
        if (!silent)
          window.UI?.showToast(`${itemData.title} added to cart`, "success");
      }

      saveCart(currentCart);
      if (document.body.getAttribute("data-page") === "checkout")
        this.renderCheckoutSummary();
    },

    applyCoupon: function () {
      const input = document.getElementById("couponInput");
      if (!input) return;

      const typedCode = input.value.trim().toUpperCase();
      const masterCoupons =
        JSON.parse(localStorage.getItem(ADMIN_COUPONS_KEY)) || [];
      const found = masterCoupons.find(
        (c) => c.code.toUpperCase() === typedCode,
      );

      if (found && found.isActive) {
        localStorage.setItem("active_session_coupon", JSON.stringify(found));
        window.UI.showToast(
          `Success! ${found.discount}% discount applied.`,
          "success",
        );
        this.renderCheckoutSummary();
      } else if (found && !found.isActive) {
        window.UI.showToast("This coupon is currently disabled.", "warning");
        localStorage.removeItem("active_session_coupon");
        this.renderCheckoutSummary();
      } else {
        window.UI.showToast("Invalid code. Check for typos.", "danger");
        localStorage.removeItem("active_session_coupon");
        this.renderCheckoutSummary();
      }
    },

    clearCart: function () {
      saveCart([]);
      localStorage.removeItem("active_session_coupon");
      if (document.body.getAttribute("data-page") === "checkout")
        this.renderCheckoutSummary();
    },

    getCartItemCount: function () {
      return getStoredCart().reduce((total, item) => total + item.qty, 0);
    },

    renderCheckoutSummary: function () {
      if (window.__ORDER_COMPLETED__) return;
      const container = document.getElementById("checkoutSummary");
      const recContainer = document.getElementById("recommendationsContainer");
      if (!container) return;

      const currentCart = getStoredCart();
      const activeCoupon =
        JSON.parse(localStorage.getItem("active_session_coupon")) || null;
      let subtotal = 0;

      if (currentCart.length === 0) {
        container.innerHTML = `
                    <div class="text-center py-5 fade-in-up">
                        <i class="ri-shopping-cart-2-line display-1 text-muted opacity-25"></i>
                        <p class='mt-3 text-main fs-5'>Your cart is currently empty.</p>
                        <a href="index.html" class="btn btn-primary px-4 rounded-pill mt-2 shadow-sm">Go Shopping</a>
                    </div>`;
        if (recContainer) recContainer.innerHTML = "";
        return;
      }

      const itemsHtml = currentCart
        .map((item) => {
          const data = getItemById(item.id);
          if (!data) return "";
          const lineTotal = data.price * item.qty;
          subtotal += lineTotal;
          return `
                <div class="d-flex gap-3 align-items-center border-bottom py-2">
                    <img src="${data.image}" style="width:40px;height:55px;object-fit:contain;" class="rounded shadow-sm">
                    <div class="flex-grow-1">
                        <h6 class="fw-bold mb-0 text-main small text-truncate" style="max-width:200px;">${data.title}</h6>
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <button class="btn btn-sm btn-outline-secondary py-0 px-2 extra-small" onclick="Cart.addToCart('${item.id}', -1)">-</button>
                            <span class="text-main fw-bold extra-small">${item.qty}</span>
                            <button class="btn btn-sm btn-outline-secondary py-0 px-2 extra-small" onclick="Cart.addToCart('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <div class="fw-bold text-main small">₹${lineTotal}</div>
                </div>`;
        })
        .join("");

      const discountAmount = activeCoupon
        ? Math.round(subtotal * (activeCoupon.discount / 100))
        : 0;
const deliveryCharge = (subtotal > 0 && subtotal >= 1000) ? 0 : 49;
      const finalTotal = subtotal - discountAmount + deliveryCharge;

      container.innerHTML = `
                <div class="fade-in-up">
                    ${itemsHtml}
                    <div class="mt-3 p-3 bg-elevated rounded-4 border-0 shadow-soft" style="max-width: 500px; margin: 0 auto;">
                        <div class="row g-2">
                            <div class="col-6 text-muted extra-small">Subtotal: ₹${subtotal}</div>
                            <div class="col-6 text-end text-success extra-small fw-bold">
                                ${discountAmount > 0 ? "Saved (" + activeCoupon.code + "): -₹" + discountAmount : ""}
                            </div>
                            <div class="col-12 text-muted extra-small border-bottom pb-2">Delivery: ${deliveryCharge === 0 ? '<b class="text-success">FREE</b>' : "₹" + deliveryCharge}</div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="fw-bold text-main fs-5">Grand Total</span>
                            <span class="text-primary fw-bold fs-4">₹${finalTotal}</span>
                        </div>
                        <div class="d-grid gap-2 mt-3 text-center">
<button class="btn btn-success py-2 fw-bold rounded-pill shadow-sm transition-all" 
        onclick="Cart.processSecureCheckout(${finalTotal})">
    <i class="ri-secure-payment-line me-1"></i>Secure Checkout
</button>
                            <button class="btn btn-link text-danger text-decoration-none fw-bold mt-1 py-1" 
                                    style="font-size: 0.85rem; letter-spacing: 0.5px;"
                                    onclick="Cart.clearCart()">
                                <i class="ri-delete-bin-line"></i> Clear Cart
                            </button>
                        </div>
                        <div class="text-center mt-2 border-top pt-2">
                            <p class="extra-small text-muted mb-0" style="font-size:0.6rem;">
                                <i class="ri-shield-check-line text-success"></i> SSL ENCRYPTED
                            </p>
                        </div>
                    </div>
                </div>`;

      const cartCategories = [
        ...new Set(
          currentCart.map((it) => getItemById(it.id)?.category).filter(Boolean),
        ),
      ];
      this.renderRecommendations(cartCategories);
    },

    initiatePayment: function (amount) {
    /* --- 1. SECURITY & STATE --- */
    if (!isLoggedIn()) {
        UI.showPopup({
            title: "Login Required",
            message: "Please login to proceed with your purchase.",
            actions: [
                { text: "Login", onClick: () => (location.href = "login.html") },
            ],
        });
        return;
    }

    let paymentVerified = false;
    let otpVerified = false;
    let qrInterval = null;
    let qrIndex = 0;

    const qrCodes = [
        `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=bookzone1@upi&am=${amount}`,
        `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=bookzone2@upi&am=${amount}`,
        `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=bookzone3@upi&am=${amount}`,
    ];

    /* --- 2. DYNAMIC UI --- */
    const paymentHtml = `
    <div id="paymentWrapper" style="position: relative; min-height: 250px; display: flex; flex-direction: column; gap: 12px;">
        <p class="mb-2 text-main">Total Payable: <b id="modalAmountDisplay">₹${amount}</b></p>
        <div class="list-group mb-2">
          
          <label class="list-group-item cursor-pointer" style="border: 1px solid #f1f3f5; border-radius: 12px; padding: 14px; margin-bottom: 8px;">
            <input type="radio" name="payment" value="card" checked>
            <span class="ms-2"><i class="ri-bank-card-line me-1"></i> Credit / Debit Card</span>
          </label>

          <div id="cardBox" class="mt-1 p-2 border rounded bg-light mb-2">
              <div class="mb-2">
                <input class="form-control" id="cardNo" placeholder="16 Digit Card Number" maxlength="16">
              </div>
              <div class="row g-2">
                <div class="col-7"><input class="form-control" id="cardExp" placeholder="MM/YYYY" maxlength="7"></div>
                <div class="col-5"><input class="form-control" id="cardCvv" placeholder="CVV" maxlength="3"></div>
              </div>
          </div>

          <label class="list-group-item cursor-pointer" style="border: 1px solid #f1f3f5; border-radius: 12px; padding: 14px; margin-bottom: 8px;">
            <input type="radio" name="payment" value="upi">
            <span class="ms-2"><i class="ri-qr-code-line me-1"></i> UPI / QR Code</span>
          </label>

          <div id="upiBox" class="d-none mt-1 p-3 border rounded bg-white text-center position-relative mb-2">
            <div class="position-relative d-inline-block mb-2">
                <img id="qrImg" src="${qrCodes[0]}" style="width:160px; height:160px;" class="border p-1 shadow-sm">
                <div id="qrOverlay" class="d-none position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                     style="background: rgba(255,255,255,0.9); z-index: 5; border-radius: 5px;">
                    <button id="regenBtn" class="btn btn-primary btn-sm rounded-pill shadow fw-bold">Generate Next QR</button>
                </div>
            </div>
            <div class="mb-2">
              <span class="badge bg-warning text-dark p-2">Expires in: <span id="qrTimer">30</span>s</span>
            </div>
            <div class="d-flex gap-2 mb-2">
              <input type="text" id="otpInput" class="form-control rounded-pill text-center" placeholder="6-digit OTP" maxlength="6">
              <button class="btn btn-primary btn-sm rounded-pill px-3" id="verifyOtpBtn">Verify</button>
            </div>
          </div>

          <label class="list-group-item cursor-pointer" style="border: 1px solid #f1f3f5; border-radius: 12px; padding: 14px;">
            <input type="radio" name="payment" value="cod">
            <span class="ms-2"><i class="ri-truck-line me-1"></i> Cash on Delivery</span>
          </label>

        </div>

        <button id="confirmPayBtn" class="btn btn-success w-100 rounded-pill py-2 fw-bold shadow-sm" disabled>Complete Order</button>
    </div>
  `;

    UI.showPopup({
        title: "Secure Payment",
        message: paymentHtml,
        actions: [
            {
                text: "Cancel",
                class: "btn-secondary rounded-pill",
                onClick: () => clearInterval(qrInterval),
            },
        ],
    });

    /* --- 3. DOM INTERACTION --- */
    setTimeout(() => {
        const confirmBtn = document.getElementById("confirmPayBtn");
        const upiBox = document.getElementById("upiBox");
        const cardBox = document.getElementById("cardBox");
        const qrImg = document.getElementById("qrImg");
        const qrOverlay = document.getElementById("qrOverlay");
        const regenBtn = document.getElementById("regenBtn");
        const otpInp = document.getElementById("otpInput");
        const otpBtn = document.getElementById("verifyOtpBtn");
        const wrapper = document.getElementById("paymentWrapper");

        function updateConfirm(valid) {
            paymentVerified = valid;
            confirmBtn.disabled = !valid;
        }

        /* Red Bar Error Logic for Card Details */
       /* Inside assets/js/cart.js -> initiatePayment -> DOM Interaction section */

["cardNo", "cardExp", "cardCvv"].forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener("input", (e) => {
        // 1. Clean input data
        if (id !== "cardExp") e.target.value = e.target.value.replace(/\D/g, "");
        
        const no = document.getElementById("cardNo").value.replace(/\D/g, "");
        const exp = document.getElementById("cardExp").value.trim();
        const cvv = document.getElementById("cardCvv").value.replace(/\D/g, "");

        // 2. Individual field validation
        let expValid = false;
        if (exp.includes("/")) {
            const parts = exp.split("/");
            const month = parseInt(parts[0], 10);
            const year = parts[1] ? parts[1].trim() : "";
            expValid = month >= 1 && month <= 12 && (year.length === 2 || year.length === 4);
        }

        // 3. APPLY RED ALERTS (is-invalid class)
        // Card Number Alert
        if (id === "cardNo") {
            el.classList.toggle("is-invalid", no.length > 0 && no.length !== 16);
        }
        // Expiry Alert
        if (id === "cardExp") {
            el.classList.toggle("is-invalid", exp.length > 2 && !expValid);
        }
        // CVV Alert
        if (id === "cardCvv") {
            el.classList.toggle("is-invalid", cvv.length > 0 && cvv.length !== 3);
        }

        // 4. Update the Complete button status
        const allCardValid = no.length === 16 && cvv.length === 3 && expValid;
        if (document.querySelector('input[name="payment"]:checked').value === "card") {
            updateConfirm(allCardValid);
        }
    });
});

        /* QR TIMER LOGIC */
        function startTimer() {
            let timeLeft = 30;
            const display = document.getElementById("qrTimer");
            qrOverlay.classList.add("d-none");
            qrOverlay.classList.remove("d-flex");
            otpInp.disabled = false;
            otpBtn.disabled = false;
            clearInterval(qrInterval);
            qrInterval = setInterval(() => {
                timeLeft--;
                if (display) display.textContent = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(qrInterval);
                    qrOverlay.classList.remove("d-none");
                    qrOverlay.classList.add("d-flex");
                    otpInp.disabled = true;
                    otpBtn.disabled = true;
                    UI.showToast("QR Expired. Regenerate to continue.", "warning");
                }
            }, 1000);
        }

        regenBtn.onclick = () => {
            qrIndex = (qrIndex + 1) % qrCodes.length;
            qrImg.src = qrCodes[qrIndex];
            startTimer();
        };

        otpBtn.onclick = () => {
            if (otpInp.value.replace(/\D/g, "").length === 6) {
                otpVerified = true;
                updateConfirm(true);
                clearInterval(qrInterval);
                UI.showToast("OTP Verified!", "success");
            } else {
                UI.showToast("Enter a 6-digit OTP", "error");
            }
        };

        /* Inside assets/js/cart.js -> initiatePayment -> DOM Interaction section */

otpInp?.addEventListener("input", (e) => {
    // 1. Remove non-numeric characters
    const val = e.target.value.replace(/\D/g, "");
    e.target.value = val;

    // 2. APPLY RED ALERT: If user typed something but it's not 6 digits
    otpInp.classList.toggle("is-invalid", val.length > 0 && val.length !== 6);

    // 3. Keep existing logic: verify button status
    otpBtn.disabled = val.length !== 6;
});
        /* PAYMENT METHOD TOGGLE */
        document.querySelectorAll('input[name="payment"]').forEach((radio) => {
            radio.addEventListener("change", () => {
                upiBox.classList.toggle("d-none", radio.value !== "upi");
                cardBox.classList.toggle("d-none", radio.value !== "card");
                if (radio.value === "cod") updateConfirm(true);
                else if (radio.value === "upi") {
                    updateConfirm(otpVerified);
                    if (!otpVerified) startTimer();
                } else if (radio.value === "card") {
                    document.getElementById("cardNo").dispatchEvent(new Event("input"));
                }
            });
        });

        /* FINAL CONFIRMATION WITH PREMIUM LIGHT SPINNER */
       /* Inside assets/js/cart.js -> initiatePayment -> DOM Interaction section */

confirmBtn.onclick = () => {
    const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value || "cod";
    
    // ✅ 1. Aggressive Footer Hiding
    // This targets both your specific popupActions container AND the Bootstrap modal-footer
    const modalFooter = document.querySelector('.modal-footer');
    const popupActions = document.getElementById('popupActions');
    
    if (modalFooter) {
        modalFooter.style.setProperty("display", "none", "important");
    }
    if (popupActions) {
        popupActions.style.setProperty("display", "none", "important");
    }

    // ✅ 2. Show the Premium Spinner
    if (wrapper) {
        wrapper.innerHTML = `
        <div class="processing-loader-container">
            <div class="premium-spinner"></div>
            <div class="mt-2 text-center">
                <h5 class="processing-text mb-1">
                    ${selectedPayment === 'cod' ? 'Confirming Order...' : 'Verifying Transaction...'}
                </h5>
                <p class="processing-subtext mb-0">Grand Total: <b>₹${amount}</b></p>
            </div>
        </div>`;
    }

    // ✅ 3. Finalize Order after delay
    setTimeout(() => {
        this.completeCheckout();
    }, 2200);
};
    }, 300);
},

    // ✅ FIXED: RECOMMENDATION ENGINE (Excludes items already in cart)
    renderRecommendations: function (categories) {
      const container = document.getElementById("recommendationsContainer");
      const currentCart = getStoredCart();
      if (!container || currentCart.length === 0) return;

      const adminBooks =
        JSON.parse(localStorage.getItem("bookzone_books")) || [];
      const currentIds = currentCart.map((c) => c.id);

      const isWithinLibraryRange = (imgStr) => {
        const match = imgStr.match(/book-(\d+)\.png/);
        return match ? parseInt(match[1]) <= 60 : true;
      };

      const recs = window.Bookstore.getAllBooks().filter((b) => {
        const isMatch =
          categories.includes(b.category) && !currentIds.includes(b.id);
        const adminData = adminBooks.find((ab) => ab.id === b.id);
        const isAvailable = adminData ? adminData.available !== false : true;
        return isMatch && isAvailable && isWithinLibraryRange(b.image);
      });

      if (recs.length === 0) {
        container.innerHTML = "";
        return;
      }

      container.innerHTML = `
                <h5 class="fw-bold mt-4 mb-3 text-main">You May Also Like</h5>
                <div class="recommendation-swipe-wrapper">
                    <div class="recommendation-row">
                        ${recs
                          .map((b) => {
                            const isComic =
                              b.category === "comics" || b.isComic;
                            const link = isComic
                              ? `comics-series.html?seriesId=${b.id}`
                              : `book-details.html?id=${b.id}`;
                            return `
                                <div class="recommendation-card" onclick="window.location.href='${link}'">
                                    <div class="rec-img-container">
                                        <img src="${b.image}" onerror="this.src='assets/img/default-book.png'">
                                    </div>
                                    <div class="p-2">
                                        <div class="fw-bold small text-truncate text-main">${b.title}</div>
                                        <div class="text-primary small fw-semibold">₹${b.price || 0}</div>
                                    </div>
                                </div>`;
                          })
                          .join("")}
                    </div>
                </div>`;
    },
    processSecureCheckout: function () {
      // 1️⃣ Get freshest data using dynamic user key
      const cartKey = getUserCartKey();
      const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
      const allBooks = JSON.parse(localStorage.getItem("bookzone_books")) || [];

      // 2️⃣ VALIDATION: Map through cart items to check current availability
      const unavailableItems = cart.filter((cartItem) => {
        const itemData = getItemById(cartItem.id);
        const currentAdminData = allBooks.find((b) => 
            b.id === cartItem.id || 
            (itemData?.parentSeries && b.id === itemData.parentSeries)
        );

        // Mark as unavailable if book is missing in admin records or available is false
        const isMissing = !currentAdminData;
        const isSoldOut = currentAdminData && currentAdminData.available === false;

        return isMissing || isSoldOut;
      });

      // 3️⃣ IF UNAVAILABLE: Clean cart selectively and stop
      if (unavailableItems.length > 0) {
        // Fetch titles for the error message
        const itemNames = unavailableItems.map((i) => {
            const data = getItemById(i.id);
            return data ? data.title : "Unknown Book";
        }).join(", ");

        // Remove ONLY the unavailable items from storage
        const updatedCart = cart.filter(
          (cartItem) => !unavailableItems.some((un) => un.id === cartItem.id),
        );
        localStorage.setItem(cartKey, JSON.stringify(updatedCart));

        // Show UI Popup BEFORE the payment modal appears
        UI.showPopup({
          title: "Availability Update",
          type: "error",
          message: `
                <div class="text-center">
                    <p class="text-danger fw-bold">Some items were just sold out or removed:</p>
                    <p class="text-muted small">${itemNames}</p>
                    <p>We've updated your cart. Please check the new total before proceeding.</p>
                </div>`,
          actions: [
            {
              text: "Review Cart",
              class: "btn-primary rounded-pill w-100",
              onClick: () => {
                // Refresh the cart UI
                if (this.renderCheckoutSummary) this.renderCheckoutSummary();
                else window.location.reload();
              },
            },
          ],
        });
        return; // 🔥 STOP: Prevents the "Secure Payment" modal from opening
      }

      // 4️⃣ SUCCESS: Calculate Total and Trigger Payment UI
      let subtotal = 0;
      
      // Get the current cart content directly from storage using the key
      const freshCart = JSON.parse(localStorage.getItem(cartKey)) || [];

      freshCart.forEach((item) => {
        // Use the global getItemById instead of this.getItemById
        const data = getItemById(item.id);
        
        if (data && data.price) {
            // Ensure values are numbers before multiplying
            subtotal += parseFloat(data.price) * parseInt(item.qty);
        }
      });

      const activeCoupon = JSON.parse(localStorage.getItem("active_session_coupon")) || null;

      const discountAmount = activeCoupon
        ? Math.round(subtotal * (parseFloat(activeCoupon.discount) / 100))
        : 0;

      // Delivery: ₹49 if subtotal is under 1000
      const deliveryCharge = (subtotal > 0 && subtotal < 1000) ? 49 : 0;

      const finalTotal = subtotal - discountAmount + deliveryCharge;

      // Log to console for debugging
      console.log("Calculated Final Total:", finalTotal);

      // Trigger the payment modal with the final calculated number
      this.initiatePayment(finalTotal);
    },

    // =================================================
    // 💳 STEP 2: COMPLETE ORDER (Final Verification)
    // =================================================
    completeCheckout: function () {
      // Validation was handled in Step 1, proceed to animation
      this.showPaymentVerification();
    },

    // =================================================
    // 🔄 PAYMENT VERIFICATION ANIMATION
    // =================================================
    showPaymentVerification: function () {
      const selectedPayment =
        document.querySelector('input[name="payment"]:checked')?.value || "cod";
      const paymentMap = {
        card: "Credit / Debit Card",
        upi: "UPI / GPay / PhonePe",
        cod: "Cash on Delivery",
      };
      const paymentLabel = paymentMap[selectedPayment] || "Cash on Delivery";

      const modalFooter = document.querySelector(".modal-footer");
      if (modalFooter)
        modalFooter.style.setProperty("display", "none", "important");

      if (selectedPayment === "cod") {
        this.finalizeOrder(paymentLabel);
        return;
      }

      const modalBody = document.querySelector(".modal-body");
      if (modalBody) {
        modalBody.insertAdjacentHTML(
          "beforeend",
          `
            <div class="payment-loader-overlay"
                style="position:absolute; inset:0; background:rgba(255,255,255,0.95);
                display:flex; flex-direction:column; align-items:center;
                justify-content:center; z-index:3000; border-radius:15px;">
                <div style="width:50px; height:50px; border:5px solid #eee;
                    border-top:5px solid #6c5ce7; border-radius:50%;
                    animation:spin 1s linear infinite;"></div>
                <h5 class="fw-bold text-primary mt-3">Verifying Payment...</h5>
                <p class="text-muted small">Please do not refresh the page</p>
            </div>
            <style>
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            </style>`,
        );
      }

      setTimeout(() => {
        this.finalizeOrder(paymentLabel);
      }, 2500);
    },

    // =================================================
    // ✅ FINAL ORDER CREATION
    // =================================================
    finalizeOrder: function (paymentLabel) {
    window.__ORDER_COMPLETED__ = true;

    // ✅ FIX 1: Use the dynamic key to fetch the current user's items
    const cartKey = getUserCartKey(); 
    const currentCart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const activeCoupon = JSON.parse(localStorage.getItem("active_session_coupon")) || null;

    let subtotal = 0;
    const orderItems = currentCart.map((item) => {
        // ✅ FIX 2: Explicitly use the global helper to find the latest data
        const data = getItemById(item.id); 
        
        // ✅ FIX 3: Ensure price is treated as a number for correct subtotal calculation
        const itemPrice = data ? parseFloat(data.price) : 0;
        const itemQty = parseInt(item.qty);
        
        subtotal += itemPrice * itemQty;

        return {
            id: item.id,
            title: data ? data.title : "Unknown Item",
            qty: itemQty,
            price: itemPrice,
        };
    });

    const discount = activeCoupon
        ? Math.round(subtotal * (parseFloat(activeCoupon.discount) / 100))
        : 0;

    // ✅ LOGIC MATCH: Free delivery for orders 1000 and above
    const deliveryCharge = (subtotal > 0 && subtotal < 1000) ? 49 : 0;
    const grandTotal = subtotal - discount + deliveryCharge;

    const user = window.BookzoneAuth?.loadBookzoneUser();
    if (user) {
        const historyKey = `orders_${user.email.toLowerCase()}`;
        const history = JSON.parse(localStorage.getItem(historyKey)) || [];
        history.unshift({
            id: "BZ-" + Date.now(),
            date: new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            }),
            items: orderItems,
            total: grandTotal, // ✅ Now accurately saves the full price, not just delivery
            paymentMethod: paymentLabel,
            status: "Confirmed",
        });
        localStorage.setItem(historyKey, JSON.stringify(history));
    }

    // ✅ FIX 4: Clear the specific user cart key instead of the global one
    localStorage.setItem(cartKey, "[]");
    if (typeof saveCart === "function") saveCart([]);
    localStorage.removeItem("active_session_coupon");

    const modalFooter = document.querySelector(".modal-footer");
    if (modalFooter)
        modalFooter.style.setProperty("display", "flex", "important");

    UI.showPopup({
        title: 'Order Confirmed',
        hideCloseButton: true,
        backdrop: "static",
        keyboard: false,
        message: `
            <div class="text-center py-3">
                <i class="ri-checkbox-circle-fill text-success" style="font-size:4rem"></i>
                <h4 class="fw-bold mt-2">Your order has been placed successfully!</h4>
                <p class="text-muted mb-0">Payment Method: <b>${paymentLabel}</b></p>
                <p class="text-main mt-2">Total Paid: <b>₹${grandTotal}</b></p>
            </div>`,
        actions: [
            {
                text: "Go to Home",
                class: "btn-success rounded-pill w-100 py-2",
                onClick: () => {
                    document.getElementById("confetti-canvas")?.remove();
                    window.location.href = "index.html";
                },
            },
        ],
    });
    this.launchConfetti();
},

    // =================================================
    // 🎊 CONFETTI ENGINE
    // =================================================
    launchConfetti: function () {
      if (!document.getElementById("confetti-canvas")) {
        document.body.insertAdjacentHTML(
          "beforeend",
          `<canvas id="confetti-canvas" style="position:fixed; inset:0; pointer-events:none; z-index:2050;"></canvas>`,
        );
      }
      const canvas = document.getElementById("confetti-canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colors = ["#6c5ce7", "#a29bfe", "#55efc4", "#fab1a0", "#ffeaa7"];
      const particles = Array.from({ length: 150 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 7 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 6.28,
      }));
      let active = true;
      function draw() {
        if (!active) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speed;
          p.x += Math.sin(p.angle) * 2;
          if (p.y > canvas.height) p.y = -10;
        });
        requestAnimationFrame(draw);
      }
      draw();
      setTimeout(() => {
        active = false;
        canvas.remove();
      }, 3000);
    },
  };

  window.addEventListener("DOMContentLoaded", () => {
    window.UI?.updateCartCount();
  });
})();
