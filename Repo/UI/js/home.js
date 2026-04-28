let feed = document.getElementById("feed");
let currentCategory = "world";
let loading = false;

// Load default
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

function createItem() {
  let div = document.createElement("div");
  div.className = "article-item";

  let up = Math.floor(Math.random() * 500);
  let down = Math.floor(Math.random() * 100);
  let trust = 60 + Math.floor(Math.random() * 40);
  let colors = ["bg-1", "bg-2", "bg-3", "bg-4", "bg-5"];
  let random = colors[Math.floor(Math.random() * colors.length)];
  div.classList.add(random);

  div.innerHTML = `
    <div class="meta">${currentCategory.toUpperCase()} • just now</div>

    <div class="article-title">
      ${currentCategory} headline ${Math.floor(Math.random() * 100)}
    </div>

    <p>Sample content for ${currentCategory}...</p>

    <div class="vote-box">
      <span class="vote up">▲ ${up}</span>
      <span class="vote down">▼ ${down}</span>
      • <span class="text-success">${trust}% Trust</span>
    </div>
  `;

  return div;
}

function loadMore() {
  for (let i = 0; i < 5; i++) {
    feed.appendChild(createItem());
  }
}

// Infinite scroll
window.addEventListener("scroll", () => {
  if (!loading && window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    loading = true;

    setTimeout(() => {
      loadMore();
      loading = false;
    }, 500);
  }
});

function applyRandomColors() {
  let colors = ["bg-1", "bg-2", "bg-3", "bg-4", "bg-5"];

  document.querySelectorAll(".article-item").forEach(item => {
    let random = colors[Math.floor(Math.random() * colors.length)];
    item.classList.add(random);
  });
}

// chạy khi load
window.addEventListener("load", applyRandomColors);