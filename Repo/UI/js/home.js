let feed = document.getElementById("feed");
let loader = document.getElementById("loader");
let paginationWrapper = document.getElementById("pagination-wrapper");
let loadMoreBtn = document.getElementById("load-more-btn");
let currentCategory = "world";
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar-custom');
const scrollThreshold = 100; // Khoảng cách cuộn tối thiểu để bắt đầu ẩn navbar
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
    // Chỉ chạy infinite scroll nếu:
    // 1. Không đang load
    // 2. Chưa đạt giới hạn 10 bài
    // 3. Đã cuộn xuống gần cuối trang
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Kiểm tra hướng cuộn
    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
        // Cuộn xuống -> Ẩn
        navbar.classList.add('navbar-hidden');
    } else {
        // Cuộn lên -> Hiện
        navbar.classList.remove('navbar-hidden');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    if (!loading && articlesCount < LIMIT_BEFORE_PAGINATION &&
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {

        loading = true;
        loader.classList.remove('d-none');

        setTimeout(() => {
            loadMore();
            loading = false;
        }, 500);
    }
});