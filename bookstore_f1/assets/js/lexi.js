/* =====================================================
   LEXI ASSISTANT MODULE - BookZone
   Floating AI Sidebar Assistant

   Responsibilities:
   - Chat UI handling
   - Persistent chat history (User Specific)
   - Smart keyword-based replies
   - Book search integration
   - Cart nudges & navigation help
===================================================== */

(function () {

  /* =====================================================
     DOM REFERENCES
  ===================================================== */

  const bubble = document.getElementById("lexi-bubble");
  const sidebar = document.getElementById("lexi-sidebar");
  const overlay = document.getElementById("lexi-overlay");
  const closeBtn = document.getElementById("lexi-close");
  const clearBtn = document.getElementById("lexi-clear");
  const input = document.getElementById("lexi-input");
  const sendBtn = document.getElementById("lexi-send");
  const messages = document.getElementById("lexi-messages");

  if (!bubble || !sidebar || !overlay) return;

  // ✅ FIX: User-specific storage key
  const getLexiKey = () => {
    const user = window.BookzoneAuth?.loadBookzoneUser();
    return user ? `lexi_chat_history_${user.email.toLowerCase()}` : "lexi_chat_history_guest";
  };

  let lexiContext = localStorage.getItem("lexi_context") || "";

  const lexiMap = {
    home: "index.html",
    library: "library.html",
    comics: "comics.html",
    offers: "offer.html",
    profile: "profile.html",
    checkout: "checkout.html",
  };

  /* =====================================================
     CHAT STORAGE (Persistent History)
  ===================================================== */

  function say(text, who = "lexi", save = true) {
    const div = document.createElement("div");
    div.className = `lexi-msg ${who}`;
    div.innerHTML = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;

    if (save) {
      const historyKey = getLexiKey();
      const history = JSON.parse(localStorage.getItem(historyKey)) || [];
      history.push({ text, who });
      localStorage.setItem(historyKey, JSON.stringify(history));
    }

    return div;
  }

  function loadChatHistory() {
    const historyKey = getLexiKey();
    const history = JSON.parse(localStorage.getItem(historyKey)) || [];

    messages.innerHTML = "";

    if (history.length > 0) {
      history.forEach((msg) => say(msg.text, msg.who, false));
    } else {
      greet();
    }
  }

  /* =====================================================
     UI HELPERS
  ===================================================== */

  function sayWithButtons(text, btnLabels) {
    say(text, "lexi", false);

    const container = document.createElement("div");
    container.className = "lexi-buttons-container";

    btnLabels.forEach((label) => {
      const btn = document.createElement("button");
      btn.className = "lexi-btn-chip";
      btn.innerText = label;

      btn.onclick = () => {
        // Keeps conversation flow visible
        say(label, "user");

        const typing = say("<i>Lexi is thinking...</i>", "lexi", false);

        setTimeout(() => {
          typing.remove();
          reply(label.toLowerCase());
        }, 800);
      };

      container.appendChild(btn);
    });

    messages.appendChild(container);
    messages.scrollTop = messages.scrollHeight;
  }

  function sayBookCard(book) {
    const detailsPage =
      book.category === "comics" || book.isComic
        ? `comics-series.html?seriesId=${book.id}`
        : `book-details.html?id=${book.id}`;

    const cardHtml = `
      <div class="lexi-book-card">
        <img src="${book.image}" 
             onerror="this.src='assets/img/default-book.png'">
        <div class="lexi-book-card-info">
          <div class="lexi-book-card-title">${book.title}</div>
          <div class="lexi-book-card-price">
            ${book.price === 0 ? "FREE" : "₹" + book.price}
          </div>
          <a href="${detailsPage}" 
             class="lexi-book-link">
             View Details →
          </a>
        </div>
      </div>
    `;

    say(cardHtml);
  }

  /* =====================================================
     GREETING LOGIC
  ===================================================== */

  function greet() {
    const user = window.BookzoneAuth?.loadBookzoneUser();
    const firstName = user ? user.name.split(" ")[0] : "";

    const welcome = firstName
      ? `Welcome back, <b>${firstName}</b>! 👋 Ready to find your next great read?`
      : "Hey 🙂 I’m <b>Lexi</b>. I can help you find books or guide you around BookZone.";

    sayWithButtons(welcome, [
      "Check Offers",
      "Free Classics",
      "My Cart",
    ]);
  }

  /* =====================================================
     BUSINESS LOGIC
  ===================================================== */

  function getCartNudge() {
    // ✅ SYNCED: Fetch cart based on current login state
    const user = window.BookzoneAuth?.loadBookzoneUser();
    const cartKey = user ? `cart_${user.email.toLowerCase()}` : "bookzone_guest_cart";
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    const subtotal = cart.reduce((sum, item) => {
      const book = window.Bookstore?.getBookById(item.id);
      return sum + (book ? book.price * item.qty : 0);
    }, 0);

    if (subtotal === 0)
      return "Your cart is empty. Want to see some <b>New Arrivals</b>?";

    if (subtotal < 1000)
      return `Your total is ₹${subtotal}. Spend ₹${1000 - subtotal} more for <b>FREE delivery</b>! 🚚`;

    if (subtotal < 1500)
      return `You have Free Delivery! Spend ₹${1500 - subtotal} more for a <b>5% discount</b>.`;

    return `Nice! Your cart is at ₹${subtotal}. You're eligible for our tiered rewards. 🎁`;
  }

  function reply(msg) {
    const lowerMsg = msg.toLowerCase();

    /* -----------------------------
       Technical & Security Queries
    -------------------------------- */

    if (
      lowerMsg.includes("save") ||
      lowerMsg.includes("server") ||
      lowerMsg.includes("how does")
    ) {
      say("Great technical question! 💻 <b>BookZone</b> is a serverless simulation. We use <b>LocalStorage</b> to save your data partitioned to your email, so it stays private and persistent.");
      return;
    }

    if (
      lowerMsg.includes("password") ||
      lowerMsg.includes("secure") ||
      lowerMsg.includes("safe")
    ) {
      say("Your security is a priority. 🔐 We use <b>SHA-256 hashing</b> for all passwords. Even I can't see your plain-text password!");
      return;
    }

    /* -----------------------------
       Policy & Info Pages
    -------------------------------- */

    if (
      lowerMsg.includes("return") ||
      lowerMsg.includes("refund") ||
      lowerMsg.includes("policy")
    ) {
      say("We have a 7-day return policy for physical books. Digital sessions are considered 'consumed' once you start reading. See the full <a href='info.html?type=returns'>Return Policy</a>.");
      return;
    }

    if (
      lowerMsg.includes("about") ||
      lowerMsg.includes("vision") ||
      lowerMsg.includes("careers")
    ) {
      const type = lowerMsg.includes("careers") ? "careers" : lowerMsg.includes("vision") ? "vision" : "about";
      say(`Learn more on our <a href='info.html?type=${type}'>${type.charAt(0).toUpperCase() + type.slice(1)} page</a>.`);
      return;
    }

    /* -----------------------------
       Reading History
    -------------------------------- */

    if (
      lowerMsg.includes("history") ||
      lowerMsg.includes("last read") ||
      lowerMsg.includes("reading")
    ) {
      const readingList = JSON.parse(localStorage.getItem("bookzone_continue_reading")) || [];

      if (readingList.length > 0) {
        const lastBookId = typeof readingList[0] === "object" ? readingList[0].id : readingList[0];
        const lastBook = window.Bookstore?.getBookById(lastBookId);
        say(`You were last reading <b>${lastBook ? lastBook.title : "a great book"}</b>! Continue in your <a href='library.html'>Library</a>.`);
      } else {
        say("Your reading history is empty! Visit the <a href='library.html'>Library</a> to start your first free classic.");
      }
      return;
    }

    /* -----------------------------
       Cart & Offers
    -------------------------------- */

    if (lowerMsg.includes("cart") || lowerMsg.includes("total") || lowerMsg.includes("delivery")) {
      say(getCartNudge());
      return;
    }

    if (lowerMsg.includes("offer") || lowerMsg.includes("discount")) {
      say("Enjoy exclusive savings automatically applied on eligible collections. Visit our <a href='offer.html'>Offers page</a> for details.");
      return;
    }

    /* -----------------------------
       Keyword Navigation Mapping
    -------------------------------- */

    const genreResponses = {
      free: "The <a href='library.html'>Library</a> has 20 free classics waiting for you. 📚",
      library: "The <a href='library.html'>Library</a> has 20 free classics waiting for you. 📚",
      manga: "Explore our <a href='comics.html'>Comics & Manga</a> collection!",
      comics: "Explore our <a href='comics.html'>Comics & Manga</a> collection!",
      offers: "Visit the <a href='offer.html'>Offers page</a> for active discounts.",
      featured: "Check our <a href='featured.html'>Editor's Choice</a> titles.",
      new: "View the latest releases on the <a href='new-arrival.html'>New Arrivals</a> page.",
      profile: "Manage orders and security in your <a href='profile.html'>Profile</a>.",
      account: "Visit your <a href='profile.html'>Account Dashboard</a>.",
      checkout: "Your <a href='checkout.html'>Checkout</a> is ready.",
      support: "Find help at our <a href='info.html?type=support'>Support</a> page.",
    };

    for (const [key, response] of Object.entries(genreResponses)) {
      if (lowerMsg.includes(key)) {
        say(response);
        return;
      }
    }

    /* -----------------------------
       Book Search
    -------------------------------- */

    const allBooks = window.Bookstore?.getAllBooks() || [];
    const match = allBooks.find((b) => lowerMsg.includes(b.title.toLowerCase()));

    if (match) {
      say(`Found it! <b>${match.title}</b> is a great choice.`);
      sayBookCard(match);
      return;
    }

    /* -----------------------------
       Fallback Responses
    -------------------------------- */

    const randomFollowUps = [
      "I'm still learning. Want to see <b>New Arrivals</b> or check your <b>Cart</b>?",
      "Looking for something specific, or should I show you the free classics?",
      "Need help with our <b>Return Policy</b> or active <b>Discounts</b>?",
      "Tell me a genre like <b>Space</b>, <b>Philosophy</b>, or <b>Technology</b>!",
    ];

    say(randomFollowUps[Math.floor(Math.random() * randomFollowUps.length)]);
  }

  /* =====================================================
     EVENT LISTENERS
  ===================================================== */

  bubble.onclick = () => {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    bubble.style.opacity = "0";
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      bubble.style.display = "none";
      loadChatHistory();
    }, 300);
  };

  const closeLexi = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    bubble.style.display = "block";
    setTimeout(() => (bubble.style.opacity = "1"), 10);
    document.body.style.overflow = "";
  };

  closeBtn.onclick = closeLexi;
  overlay.onclick = closeLexi;

  if (clearBtn) {
    clearBtn.onclick = () => {
      window.UI.showPopup({
        title: "Reset Conversation",
        message: "Are you sure you want to clear our chat history?",
        actions: [
          {
            text: "Clear History",
            class: "btn-danger rounded-pill",
            onClick: () => {
              // ✅ FIX: Clears only the current user's history
              localStorage.removeItem(getLexiKey());
              messages.innerHTML = "";
              greet();
              window.UI.showToast("Chat history cleared", "info");
            },
          },
          { text: "Cancel", class: "btn-secondary rounded-pill" },
        ],
      });
    };
  }

  sendBtn.onclick = handleInput;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleInput();
  });

  function handleInput() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    say(text, "user");

    const typingDiv = say("<i>Lexi is thinking...</i>", "lexi", false);

    setTimeout(() => {
      typingDiv.remove();
      reply(text);
    }, 1200);
  }

})();