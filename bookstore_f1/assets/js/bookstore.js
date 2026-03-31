// assets/js/bookstore.js
(function () {
  "use strict";

  /* =====================================================
      BOOKSTORE INITIALIZATION
      Flag to prevent dependency-order crashes in other scripts
  ===================================================== */
  window.__BOOKSTORE_READY__ = false;

  /* =====================================================
      DATA ARRAYS
  ===================================================== */
  const BOOKS = [];
  
  const categories = [
    "Fiction", "Non-Fiction", "Technology", "Psychology", "Finance",
    "History", "Science", "Self Help", "Education", "Health",
    "Biography", "Autobiography", "Business", "Marketing",
    "Entrepreneurship", "Philosophy", "Sociology", "Politics",
    "Economics", "Environment", "Art & Design", "Creative Writing",
    "Personal Development", "Productivity", "Spirituality",
  ];

  const BOOK_TITLES = [
    "The Silent Horizon", "Echoes of Tomorrow", "Mind Over Matter",
    "The Last Algorithm", "Beyond the Pages", "Fragments of Reality",
    "The Thinking Code", "Shadows of Knowledge", "Infinite Paths",
    "The Hidden Pattern", "Whispers in Time", "Neural Dreams",
    "Blueprint of Thought", "The Human Paradox", "Digital Souls",
    "Chronicles of Logic", "The Learning Curve", "Parallel Minds",
    "The Unknown Variable", "Future Proof", "Code of Consciousness",
    "The Final Chapter", "Beyond the Binary", "The Psychology Effect",
    "Signals and Noise", "The Rational Mind", "Data and Destiny",
    "The Knowledge Vault", "Algorithmic Life", "The Creative Process",
    "Thinking in Systems", "The Innovation Loop", "Silent Decisions",
    "The Logic Tree", "Inside the Mind", "Patterns of Success",
    "The Cognitive Shift", "Designing Thought", "The Power of Focus",
    "Human and Machine", "The Abstract Truth", "Deep Learning Paths",
    "The Mindful Code", "Structures of Reason", "The Mental Model",
    "Engineering Ideas", "The Thought Factory", "Numbers and Narratives",
    "The Strategic Brain", "Layers of Insight", "The Conceptual Age",
    "Reason and Reality", "The Knowledge Machine", "Thinking Forward",
    "The Silent Framework", "The Digital Intellect", "Paths of Progress",
    "The Idea Blueprint", "The Logical Horizon", "Cognition Unlocked",
  ];

  const AUTHORS = [
    "Daniel Wright", "Sophia Turner", "Amit Verma", "Rohan Mehta",
    "Emily Carter", "Jonathan Reeves", "Neha Sharma", "Arjun Patel",
    "Olivia Brooks", "Michael Anderson", "Priya Nair", "David Collins",
    "Sara Mitchell", "Kunal Joshi", "Laura Bennett", "Rahul Khanna",
    "Emma Richardson", "Vikram Rao", "James Walker", "Ananya Iyer",
    "Lucas Morgan", "Pooja Malhotra", "Benjamin Scott", "Nikhil Bansal",
    "Isabella Foster", "Chris Donovan", "Meera Kapoor", "Thomas Reed",
    "Ayesha Siddiqui", "Andrew Miller", "Simran Kaur", "Matthew Harris",
    "Sanjay Deshpande", "Natalie Cooper", "Harsh Vardhan", "Kevin Peterson",
    "Ritu Aggarwal", "Daniel Brooks", "Sneha Kulkarni", "Robert Hughes",
    "Ishaan Malhotra", "Jason Wright", "Kavita Menon", "Mark Thompson",
    "Alok Singhal", "Hannah Price", "Suresh Iyer", "Steven Adams",
    "Naina Gupta", "Paul Robertson", "Aditya Sengupta", "Rachel Moore",
    "Mohit Jain", "Eric Lawson", "Shalini Verma", "Victor Alvarez",
    "Tanvi Desai", "Ryan Cooper", "Manish Arora", "Clara Watson",
    "Deepak Soni", "Julian Baker", "Preeti Chawla", "Noah Simmons",
    "Aarav Shah", "Patrick Lewis", "Swati Mishra", "George Campbell",
    "Rakesh Tiwari", "Liam O'Connor", "Pallavi Kulkarni", "Henry Collins",
    "Siddharth Roy", "Elena Martinez",
  ];

  /* =====================================================
      LIBRARY BOOKS (20 TOTAL)
  ===================================================== */
  const LIBRARY_BOOKS = [
    { id: "lib-1", title: "Pride and Prejudice", author: "Jane Austen", category: "Fiction", price: 249, image: "assets/img/books/book-1.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/1342/1342-h/1342-h.htm", type: "library", description: "A classic novel of manners." },
    { id: "lib-2", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", category: "Mystery", price: 299, image: "assets/img/books/book-2.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/1661/1661-h/1661-h.htm", type: "library", description: "Detective stories featuring Sherlock Holmes." },
    { id: "lib-3", title: "The Time Machine", author: "H. G. Wells", category: "Science Fiction", price: 199, image: "assets/img/books/book-3.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/35/35-h/35-h.htm", type: "library", description: "A pioneering sci-fi novel." },
    { id: "lib-4", title: "Dracula", author: "Bram Stoker", category: "Horror", price: 299, image: "assets/img/books/book-4.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/345/345-h/345-h.htm", type: "library", description: "The original vampire novel." },
    { id: "lib-5", title: "Frankenstein", author: "Mary Shelley", category: "Horror", price: 249, image: "assets/img/books/book-5.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/84/84-h/84-h.htm", type: "library", description: "A cautionary tale of science." },
    { id: "lib-6", title: "The Art of War", author: "Sun Tzu", category: "Philosophy", price: 199, image: "assets/img/books/book-6.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/132/132-h/132-h.htm", type: "library", description: "Ancient military strategy." },
    { id: "lib-7", title: "The Prince", author: "Niccolò Machiavelli", category: "Politics", price: 249, image: "assets/img/books/book-7.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/1232/1232-h/1232-h.htm", type: "library", description: "A treatise on power." },
    { id: "lib-8", title: "Alice’s Adventures in Wonderland", author: "Lewis Carroll", category: "Children", price: 199, image: "assets/img/books/book-8.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/11/11-h/11-h.htm", type: "library", description: "Fantasy adventure." },
    { id: "lib-9", title: "Treasure Island", author: "Robert Louis Stevenson", category: "Adventure", price: 249, image: "assets/img/books/book-9.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/120/120-h/120-h.htm", type: "library", description: "Pirate adventure story." },
    { id: "lib-10", title: "Moby-Dick", author: "Herman Melville", category: "Adventure", price: 299, image: "assets/img/books/book-10.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/2701/2701-h/2701-h.htm", type: "library", description: "Tale of obsession." },
    { id: "lib-11", title: "Great Expectations", author: "Charles Dickens", category: "Fiction", price: 250, image: "assets/img/books/book-11.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/1400/1400-h/1400-h.htm", type: "library", description: "The growth and development of Pip." },
    { id: "lib-12", title: "Jane Eyre", author: "Charlotte Brontë", category: "Fiction", price: 260, image: "assets/img/books/book-12.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/1260/1260-h/1260-h.htm", type: "library", description: "A story of passion and independence." },
    { id: "lib-13", title: "The Odyssey", author: "Homer", category: "History", price: 280, image: "assets/img/books/book-13.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/1727/1727-h/1727-h.htm", type: "library", description: "The journey of Odysseus." },
    { id: "lib-14", title: "Sense and Sensibility", author: "Jane Austen", category: "Fiction", price: 240, image: "assets/img/books/book-14.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/161/161-h/161-h.htm", type: "library", description: "The Dashwood sisters' fortunes." },
    { id: "lib-15", title: "Grimms' Fairy Tales", author: "Jacob Grimm", category: "Children", price: 180, image: "assets/img/books/book-15.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/2591/2591-h/2591-h.htm", type: "library", description: "Classic folk and fairy tales." },
    { id: "lib-16", title: "The Republic", author: "Plato", category: "Philosophy", price: 300, image: "assets/img/books/book-16.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/1497/1497-h/1497-h.htm", type: "library", description: "Justice and the order of the city-state." },
    { id: "lib-17", title: "Metamorphosis", author: "Franz Kafka", category: "Fiction", price: 210, image: "assets/img/books/book-17.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/5200/5200-h/5200-h.htm", type: "library", description: "A man turns into a giant insect." },
    { id: "lib-18", title: "The Iliad", author: "Homer", category: "History", price: 290, image: "assets/img/books/book-18.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/6130/6130-h/6130-h.htm", type: "library", description: "The siege of Troy." },
    { id: "lib-19", title: "Beyond Good and Evil", author: "Friedrich Nietzsche", category: "Philosophy", price: 275, image: "assets/img/books/book-19.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/4363/4363-h/4363-h.htm", type: "library", description: "A critique of moral concepts." },
    { id: "lib-20", title: "Dubliners", author: "James Joyce", category: "Fiction", price: 230, image: "assets/img/books/book-20.png", isLibrary: true, readUrl: "https://www.gutenberg.org/files/2814/2814-h/2814-h.htm", type: "library", description: "A collection of 15 short stories." }
  ];

  /* =====================================================
      PAID BOOKS GENERATION (80 TOTAL)
  ===================================================== */
  for (let i = 1; i <= 60; i++) {
    BOOKS.push({
      id: `book-${i}`,
      title: BOOK_TITLES[i - 1] || `Book Title ${i}`,
      author: AUTHORS[i - 1] || `Author ${i}`,
      category: categories[i % categories.length],
      price: 299 + (i % 6) * 100,
      image: `assets/img/books/book-${i}.png`,
      // ✅ FIX: Mark items that have valid image assets for search filtering
      hasValidAsset: i <= 60,
      featured: i <= 20,
      isFeatured: i <= 20,
      newArrival: i > 20 && i <= 40,
      offer: i > 40 && i <= 60,
      isLibrary: false,
      type: "book",
      description: `Immerse yourself in "${BOOK_TITLES[i - 1] || `Book Title ${i}`}".`,
    });
  }

  /* =====================================================
      COMIC SERIES GENERATION
  ===================================================== */
  const COMIC_SERIES_DATA = [
    ["naruto", "Naruto", "Masashi Kishimoto"], ["aot", "Attack on Titan", "Hajime Isayama"],
    ["onepiece", "One Piece", "Eiichiro Oda"], ["bleach", "Bleach", "Tite Kubo"],
    ["jojo", "JoJo's Bizarre Adventure", "Hirohiko Araki"], ["batman", "Batman", "DC Comics"],
    ["spiderman", "Spider-Man", "Marvel Comics"], ["superman", "Superman", "DC Comics"],
    ["ironman", "Iron Man", "Marvel Comics"], ["avengers", "The Avengers", "Marvel Comics"],
    ["doraemon", "Doraemon", "Fujiko F. Fujio"], ["shinchan", "Shinchan", "Yoshito Usui"],
    ["pokemon", "Pokemon Adventures", "Satoshi Tajiri"], ["ben10", "Ben 10", "Cartoon Network"],
    ["tomjerry", "Tom & Jerry", "Hanna-Barbera"], ["monster", "Monster", "Naoki Urasawa"],
    ["deathnote", "Death Note", "Tsugumi Ohba"], ["dragonball", "Dragon Ball", "Akira Toriyama"],
    ["hulk", "The Hulk", "Marvel Comics"], ["flash", "The Flash", "DC Comics"]
  ];

  const COMICS = COMIC_SERIES_DATA.map((c, idx) => {
    const volumes = [];
    const volumeCount = 5 + (idx % 6);
    for (let v = 1; v <= volumeCount; v++) {
      volumes.push({
        volumeId: `${c[0]}-vol-${v}`,
        title: `${c[1]} Vol. ${v}`,
        author: c[2], 
        category: "comics", 
        price: 199,
        image: `assets/img/comics/${c[0]}/${c[0]}-vol${v}.jpg`,
        parentSeries: `comic-${c[0]}`,
        type: "comic-volume",
      });
    }

    return {
      id: `comic-${c[0]}`,
      title: c[1],
      author: c[2],
      category: "comics",
      image: `assets/img/comics/${c[0]}/${c[0]}-series.jpg`,
      description: `${c[1]} is a popular comic series.`,
      volumes,
      totalPrice: volumes.reduce((sum, v) => sum + v.price, 0),
      isComic: true,
      type: "comic-series",
    };
  });

  /* =====================================================
      PUBLIC API EXPOSURE
  ===================================================== */
  window.Bookstore = {
    getBooks: () => BOOKS,
    getLibraryBooks: () => LIBRARY_BOOKS,
    getComics: () => COMICS,
    
    getAllBooks: () => {
        const formattedComics = COMICS.map(series => ({
            ...series,
            price: series.totalPrice 
        }));
        return [...BOOKS, ...LIBRARY_BOOKS, ...formattedComics];
    },

    getFeaturedBooks: () => BOOKS.filter((b) => b.featured).slice(0, 20),
    getNewArrivalBooks: () => BOOKS.filter((b) => b.newArrival).slice(0, 20),
    getOfferBooks: () => BOOKS.filter((b) => b.offer).slice(0, 20),

    // ✅ FIXED: Standardized lookup for "Buy Again" button and details pages
    getBookById(id) {
      if (!id) return null;
      let book = [...BOOKS, ...LIBRARY_BOOKS].find((b) => b.id === id);
      if (book) return book;

      let series = COMICS.find((c) => c.id === id);
      if (series) return { ...series, price: series.totalPrice };

      for (const s of COMICS) {
        const vol = s.volumes.find((v) => v.volumeId === id);
        if (vol) return vol;
      }

      if (id.startsWith("series:")) {
        const sid = id.replace("series:", "");
        const s = COMICS.find((c) => c.id === sid);
        if (s) return { id, title: `${s.title} (Full Series)`, price: s.totalPrice, image: s.image, category: "comics", type: "comic-series" };
      }
      return null;
    },

    getComicSeriesById(id) {
      return COMICS.find((c) => c.id === id);
    },
  };

  window.__BOOKSTORE_READY__ = true;
})();