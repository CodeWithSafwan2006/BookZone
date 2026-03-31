------BookZone – Premium E-Commerce Bookstore-----
BookZone is a high-fidelity, front-end-driven e-commerce platform designed for bibliophiles and comic enthusiasts. It features a robust simulated backend architecture that manages authentication, inventory, and transactions through persistent browser storage, providing a seamless experience without the need for a live server.

------Detailed Project Structure------
The application is organized into specialized modules to separate data management, business logic, and user interface concerns.

-------Core Logic & Data Systems------
assets/js/bookstore.js: The central data engine. It programmatically generates the primary inventory of 80 paid books, manages the 20-book Library collection, and structures comic series relationships.
assets/js/cart.js: Manages the shopping life cycle. It handles adding/removing items, quantity adjustments, coupon validation, and renders the dynamic checkout summary.
assets/js/ui.js: The global interface orchestrator. It handles flying cart animations, search logic, theme toggling, and reading history tracking.

------Authentication & User Management------
assets/js/login.js: Handles session management and user authentication. It integrates Google One Tap login and manages local account creation, including the custom avatar selection system.
assets/js/reset-password.js: Provides the logic for identifying existing users and securely updating passwords using SHA-256 hashing.
login.html & register.html: The front-end entry points for users, featuring optimized forms and Google Identity Services integration.

------Administrative Control Layer------
assets/js/admin.js: The backend logic for administrators. Includes functions for moderating reviews, managing book availability status, and creating promotional coupons.
admin.html: The dashboard interface for admins. It features a Live Status Manager to hide books from the store and a Promotion Manager to activate festival-wide discounts.
User-Facing Storefront Pages
index.html: The main landing page featuring curated sections for Featured Books, New Arrivals, and Popular Comics.
library.html: A specialized portal for free online reading. It includes a Finish Reading dashboard that tracks the last four books accessed by the user.
book-details.html: Provides deep-dive information for individual titles, including a premium review system with Verified Buyer badges and helpfulness voting.
profile.html: A personal hub where users can track their bookmarks, order history, and submitted reviews.

------Design & Assets------
assets/css/styles.css: The master stylesheet featuring the Omni-Fix premium theme. It defines CSS variables for the light/dark mode system, 3D ribbon badges, and skeleton shimmer animations.

------Key Features------
Massive Inventory: 60 programmatically generated paid books, 20 public domain classics, and 20 comic series.
Hybrid Authentication: Standard email/password registration with SHA-256 hashing alongside Google One Tap integration.
Smart E-Commerce: Persistent cart with automated delivery charges (Free over ₹1000) and a master coupon engine.
Advanced Reviews: Social proofing through Verified Buyer badges and community-driven helpfulness voting.
Real-time Admin Control: Immediate store updates for book availability and store-wide festival discounts.

------Technical Stack------
Layer : Technology
Styling : "Bootstrap 5.3.2, Remix Icons, Custom CSS Variables"
Core Logic : "Vanilla JavaScript (ES6+), CryptoJS (SHA-256 Encryption)"
Persistence : "LocalStorage & SessionStorage for data, reviews, and sessions"
Integrations : "Google Identity Services API, Project Gutenberg"