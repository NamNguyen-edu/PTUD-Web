let feed = document.getElementById("feed");
let loader = document.getElementById("loader");
let paginationWrapper = document.getElementById("pagination-wrapper");
let loadMoreBtn = document.getElementById("load-more-btn");
let currentCategory = "world";
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar-custom');
const scrollThreshold = 100; // Khoảng cách cuộn tối thiểu để bắt đầu ẩn navbar
let loading = false;
let blockCounter = 0;

// Setting Pagination limit
let articlesCount = 0; 
const LIMIT_BEFORE_PAGINATION = 10; // After 10 articles, stop infinite scroll and show "Load More" button

// Khởi tạo lần đầu
loadMore();
loadMoreBtn.addEventListener("click", () => {
    paginationWrapper.classList.add("d-none"); // Ẩn nút đi
    articlesCount = 0; // Reset bộ đếm để cho phép cuộn tiếp 10 bài nữa
    loadMore(); 
});
// Hàm loadCategory được gọi khi người dùng chọn một category mới
// function loadCategory(e, category) {
//     currentCategory = category;
//     document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
//     if (e) e.target.classList.add("active");
//     feed.innerHTML = "";
//     blockCounter = 0;
//     articlesCount = 0; // Reset đếm khi đổi category
//     paginationWrapper.classList.add("d-none");
//     loadMore();
// }

function generateFakeData() {
    const tags = ["AI", "Business", "Tech", "Global", "Finance"];
    const randomTag = tags[Math.floor(Math.random() * tags.length)];
    const id = Math.floor(Math.random() * 1000);
    
    // Màu sắc tag theo yêu cầu
    let tagStyle = "background: #B7D8F7; color: #333;"; // Default
    if (randomTag === "AI") tagStyle = "background: #1e3a8a; color: white;"; 
    if (randomTag === "Business") tagStyle = "background: #198754; color: white;";

    return {
        title: `${randomTag}: Headline number ${id} regarding ${currentCategory} trends`,
        tag: randomTag,
        tagStyle: tagStyle,
        img: `https://picsum.photos/seed/${id}/800/500`,
        up: Math.floor(Math.random() * 900),
        down: Math.floor(Math.random() * 100)
    };
}

// Layout Block 1: 3 bài viết ngang (Col-md-4)
function blockGrid3() {
    const d = [generateFakeData(), generateFakeData(), generateFakeData()];
    return `
    <div class="row mb-5">
        ${d.map(item => `
            <div class="col-md-4">
                <div class="article-card h-100 shadow-sm">
                    <img src="${item.img}" class="img-fluid rounded mb-3" style="height:200px; width:100%; object-fit:cover;">
                    <span class="tag" style="${item.tagStyle}">${item.tag}</span>
                    <h5 class="fw-bold mt-2">${item.title}</h5>
                    <div class="vote-box small">
                        <span class="vote up">▲ ${item.up}</span>
                        <span class="vote down">▼ ${item.down}</span>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>`;
}

// Layout Block 2: 1 bài bự dọc, 2 bài ngang nhỏ bên cạnh
function blockMixed() {
    const big = generateFakeData();
    const s1 = generateFakeData();
    const s2 = generateFakeData();
    return `
    <div class="row mb-5">
        <div class="col-lg-8">
            <div class="article-card p-0 overflow-hidden shadow-sm h-100 position-relative">
                <img src="${big.img}" class="w-100" style="height:450px; object-fit:cover;">
                <div class="position-absolute bottom-0 p-4 text-white w-100" style="background: linear-gradient(transparent, rgba(0,0,0,0.9));">
                    <span class="tag" style="${big.tagStyle}">${big.tag}</span>
                    <h2 class="fw-bold">${big.title}</h2>
                    <div class="vote-box">▲ ${big.up} ▼ ${big.down}</div>
                </div>
            </div>
        </div>
        <div class="col-lg-4 d-flex flex-column justify-content-between">
            <div class="article-card mb-3 shadow-sm">
                <img src="${s1.img}" class="img-fluid rounded mb-2" style="height:120px; width:100%; object-fit:cover;">
                <h6 class="fw-bold">${s1.title}</h6>
                <div class="vote-box small">▲ ${s1.up}</div>
            </div>
            <div class="article-card shadow-sm">
                <img src="${s2.img}" class="img-fluid rounded mb-2" style="height:120px; width:100%; object-fit:cover;">
                <h6 class="fw-bold">${s2.title}</h6>
                <div class="vote-box small">▲ ${s2.up}</div>
            </div>
        </div>
    </div>`;
}

// Layout Block 3: Banner ngang (Dùng màu #B7D8F7)
function blockBanner() {
    return `
    <div class="row mb-5">
        <div class="col-12 p-5 rounded-4 text-center shadow-sm" style="background: #B7D8F7; border: 2px dashed #0d6efd;">
            <h2 class="fw-bold">Don't miss the latest AI updates!</h2>
            <p>Join 50,000+ readers and stay ahead of the curve.</p>
            <button class="btn btn-dark rounded-pill px-4">Subscribe Now</button>
        </div>
    </div>`;
}

function loadMore() {
    if (articlesCount >= LIMIT_BEFORE_PAGINATION) {
        paginationWrapper.classList.remove("d-none");
        return; // Dừng không load nữa cho đến khi nhấn nút
    }

    let html = "";
    if (blockCounter % 3 === 0) html = blockGrid3();
    else if (blockCounter % 3 === 1) html = blockMixed();
    else html = blockBanner();

    feed.insertAdjacentHTML('beforeend', html);
    blockCounter++;
    
    // Tăng bộ đếm. Lưu ý: 1 block có thể chứa nhiều bài. 
    // Nếu bạn muốn đếm chính xác 10 bài, hãy tăng theo số bài trong block.
    articlesCount += 3; 
}

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
            loader.classList.add('d-none');

            // Sau khi load xong, kiểm tra lại xem đã chạm mốc 10 chưa để hiện nút
            if (articlesCount >= LIMIT_BEFORE_PAGINATION) {
                paginationWrapper.classList.remove("d-none");
            }
        }, 700);
    }
});