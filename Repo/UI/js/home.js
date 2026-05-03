let feed = document.getElementById("feed");
let currentCategory = "world";
let loading = false;

// INIT
loadCategory(null, "world");

function loadCategory(e, category) {
  currentCategory = category;

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
  });

  if (e) e.target.classList.add("active");

  feed.innerHTML = "";
  loadMore();
}

// ==========================
// GENERATE DATA FAKE
// ==========================

function generateFakeData() {
  return {
    category: currentCategory.toUpperCase(),
    time: "just now",
    title: `${currentCategory} headline ${Math.floor(Math.random() * 100)}`,
    desc: `Sample content for ${currentCategory}...`,
    tags: ["News", currentCategory],
    up: Math.floor(Math.random() * 500),
    down: Math.floor(Math.random() * 100)
  };
}

// ==========================
// LOAD MORE (USE COMPONENT)
// ==========================

function loadMore() {
  for (let i = 0; i < 5; i++) {
    let data = generateFakeData();
    feed.innerHTML += createArticle(data);
  }
}

// ==========================
// INFINITE SCROLL
// ==========================

window.addEventListener("scroll", () => {
  if (!loading && window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    loading = true;

    setTimeout(() => {
      loadMore();
      loading = false;
    }, 500);
  }
});