let feed = document.getElementById("feed");
let loader = document.getElementById("loader");
let paginationWrapper = document.getElementById("pagination-wrapper");
let loadMoreBtn = document.getElementById("load-more-btn");

const navbar = document.querySelector('.navbar-custom');

let currentPage = 1;
let hasMore = true;
let loading = false;
let articlesCount = 0;
let currentCategory = "for-you";

const LIMIT_BEFORE_PAGINATION = 12;

let lastScrollTop = 0;
const scrollThreshold = 100;

/* =========================================================
   UTILITIES
========================================================= */

function escapeHtml(str) {

    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatViewCount(views) {

    views = Number(views || 0);

    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    }

    if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }

    return views;
}

function getImage(article, width = 800, height = 500) {

    return article.thumbnail_url
        ? article.thumbnail_url
        : `https://picsum.photos/${width}/${height}`;
}

function getRepoIndexPath() {
    const path = window.location.pathname;
    const match = path.match(/^(.*\/Repo)(?:\/.*)?$/);
    return match ? `${match[1]}/index.php` : '/index.php';
}

function getAppUrl(queryString) {
    const indexPath = getRepoIndexPath();
    return `${indexPath}${queryString.startsWith('?') ? queryString : `?${queryString}`}`;
}

function getArticleUrl(slug) {
    return getAppUrl(`?page=article&slug=${encodeURIComponent(slug)}`);
}

function goToArticle(event, slug) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (!slug) return;

    window.location.href = getArticleUrl(slug);
}

/* =========================================================
   SEARCH DROPDOWN
========================================================= */

function bindSearchDropdown() {

    const searchInput = document.getElementById('search-box');
    const dropdown = document.getElementById('search-dropdown');

    const searchForm = searchInput
        ? searchInput.closest('form')
        : null;

    if (!searchInput || !dropdown || !searchForm) {
        return;
    }

    let debounceTimer = null;

    const hideDropdown = () => {

        dropdown.classList.add('d-none');
        dropdown.innerHTML = '';
    };

    const renderSuggestions = (items) => {

        if (!items.length) {

            dropdown.innerHTML = `
                <div class="search-empty">
                    Không tìm thấy kết quả phù hợp.
                </div>
            `;

            dropdown.classList.remove('d-none');

            return;
        }

        dropdown.innerHTML = items.map(item => {

            const excerpt = item.excerpt
                ? item.excerpt.replace(/\s+/g, ' ').trim()
                : '';

            return `
                <div
                    class="search-item"
                    data-keyword="${encodeURIComponent(item.title)}"
                >

                    <div class="search-item-title">
                        ${escapeHtml(item.title)}
                    </div>

                    <div class="search-item-meta">
                        ${escapeHtml(excerpt.substring(0, 90))}
                        ${excerpt.length > 90 ? '...' : ''}
                    </div>

                </div>
            `;
        }).join('');

        dropdown.classList.remove('d-none');
    };

    const fetchSuggestions = (query) => {

        const trimmed = query.trim();

        if (trimmed.length < 2) {

            hideDropdown();

            return;
        }

        fetch(
            getAppUrl(`?page=search_suggestions&keyword=${encodeURIComponent(trimmed)}`)
        )
            .then(response => response.json())
            .then(data => {

                if (data && Array.isArray(data.items)) {

                    renderSuggestions(data.items);

                } else {

                    hideDropdown();
                }
            })
            .catch(() => hideDropdown());
    };

    searchInput.addEventListener('input', () => {

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {

            fetchSuggestions(searchInput.value);

        }, 250);
    });

    dropdown.addEventListener('click', (event) => {
        event.stopPropagation();
        const item = event.target.closest('.search-item');

        if (!item) return;

        const keyword = decodeURIComponent(
            item.dataset.keyword || ''
        );

        if (keyword) {
            hideDropdown();
            window.location.href =
                getAppUrl(`?page=search&keyword=${encodeURIComponent(keyword)}`);
        }
    });

    document.addEventListener('click', (event) => {

        if (!searchForm.contains(event.target)) {

            hideDropdown();
        }
    });

    searchInput.addEventListener('keydown', (event) => {

        if (event.key === 'Escape') {

            hideDropdown();
        }
    });
}

/* =========================================================
   LOAD HEADER / FOOTER
========================================================= */

function loadPageComponents() {
    // Server (ViewEngine) already rendered header and footer into placeholders.
    // Just activate search dropdown on the pre-rendered header.
    bindSearchDropdown();
}

/* =========================================================
   ARTICLE COMPONENTS
========================================================= */

/* =========================================================
   CREDIBILITY & VOTING / CATEGORY STYLING UTILITIES
========================================================= */

const pillColors = {
    'thời sự': { bg: '#fee2e2', text: '#dc2626' }, // Crimson
    'công nghệ': { bg: '#d1fae5', text: '#059669' }, // Emerald
    'kinh doanh': { bg: '#dbeafe', text: '#2563eb' }, // Blue
    'kinh tế': { bg: '#dbeafe', text: '#2563eb' }, // Light blue
    'tài chính': { bg: '#fef3c7', text: '#d97706' }, // Amber
    'ai': { bg: '#581c87', text: '#ffffff' }, // Deep Purple (white text)
    'trí tuệ nhân tạo': { bg: '#581c87', text: '#ffffff' },
    'startup': { bg: '#eff6ff', text: '#1e40af' },
    'giáo dục': { bg: '#faf5ff', text: '#7c3aed' },
    'đời sống': { bg: '#fdf2f8', text: '#db2777' }
};

function getPillStyle(name) {
    const lower = name.toLowerCase().trim();
    for (const key in pillColors) {
        if (lower === key || lower.includes(key)) {
            return pillColors[key];
        }
    }
    return { bg: '#f1f5f9', text: '#475569' };
}

function renderPills(categories = [], tags = []) {
    let html = '';
    
    // Chuyên mục (Categories) - ưu tiên hiển thị trước
    categories.slice(0, 2).forEach(cat => {
        const style = getPillStyle(cat);
        html += `
            <span class="category-pill shadow-sm" style="background-color: ${style.bg}; color: ${style.text}; font-weight: 600; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; display: inline-block;">
                ${escapeHtml(cat)}
            </span>
        `;
    });
    
    // Thẻ (Tags) - hiển thị như các hashtag phụ
    tags.slice(0, 2).forEach(tag => {
        const style = getPillStyle(tag);
        html += `
            <span class="tag-pill" style="background-color: ${style.bg}; color: ${style.text}; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; display: inline-block; opacity: 0.9;">
                ${escapeHtml(tag)}
            </span>
        `;
    });
    
    return `<div class="pill-container d-flex flex-wrap gap-2 mb-2">${html}</div>`;
}

function renderCredibilityBadge(upvoteCount, downvoteCount) {
    const up = Number(upvoteCount || 0);
    const down = Number(downvoteCount || 0);
    const total = up + down;
    if (total < 5) return ''; // Cần tối thiểu 5 lượt đánh giá để xác nhận độ tin cậy
    
    const ratio = up / total;
    if (ratio >= 0.8) {
        return `
            <div class="mb-2">
                <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold" style="font-size: 0.78rem;">
                    ✓ Tin cậy cao
                </span>
            </div>
        `;
    } else if (ratio < 0.5) {
        return `
            <div class="mb-2">
                <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 fw-semibold" style="font-size: 0.78rem;">
                    ⚠️ Nghi vấn/Sai lệch
                </span>
            </div>
        `;
    }
    return '';
}

function renderCardStats(article) {
    const up = Number(article.upvote_count || 0);
    const down = Number(article.downvote_count || 0);
    return `
        <div class="card-stats-row d-flex align-items-center gap-3 mt-auto pt-3 border-top text-muted small" style="font-size: 0.8rem;">
            <span class="stat-views d-flex align-items-center gap-1">
                👁 ${formatViewCount(article.view_count)} lượt xem
            </span>
            <span class="stat-upvotes text-success fw-bold d-flex align-items-center gap-1">
                ▲ ${formatViewCount(up)}
            </span>
            <span class="stat-downvotes text-danger fw-bold d-flex align-items-center gap-1">
                ▼ ${formatViewCount(down)}
            </span>
        </div>
    `;
}

function renderArticleCard(article) {
    return `
        <div class="col-md-4 mb-4">
            <a
                class="article-card h-100 shadow-sm d-flex flex-column"
                style="cursor:pointer; text-decoration:none; color:inherit; background:#fff; border-radius:12px; overflow:hidden; border:1px solid #edf2f7; transition:all 0.2s;"
                href="${getArticleUrl(article.slug)}"
            >
                <div class="overflow-hidden" style="height:220px; width:100%;">
                    <img
                        src="${getImage(article)}"
                        loading="lazy"
                        class="w-100 h-100 object-fit-cover card-img-top"
                        style="transition: transform 0.3s;"
                    >
                </div>
                <div class="p-3 d-flex flex-column flex-grow-1">
                    ${renderCredibilityBadge(article.upvote_count, article.downvote_count)}
                    
                    <h5 class="fw-bold line-clamp-2 mb-2" style="font-size: 1.1rem; line-height: 1.4; color: #1a202c;">
                        ${escapeHtml(article.title)}
                    </h5>
                    
                    ${renderPills(article.categories, article.tags)}
                    
                    <p class="text-muted small line-clamp-3 mb-3" style="line-height: 1.5; font-size: 0.85rem;">
                        ${escapeHtml(article.excerpt || '')}
                    </p>
                    
                    ${renderCardStats(article)}
                </div>
            </a>
        </div>
    `;
}

function renderGridBlock(articles) {
    return `
        <div class="row mb-4">
            ${articles.map(renderArticleCard).join('')}
        </div>
    `;
}

function renderHeroBlock(article) {
    const up = Number(article.upvote_count || 0);
    const down = Number(article.downvote_count || 0);
    
    // Tự sinh badge tin cậy cao trên Hero image
    const badgeHtml = renderCredibilityBadge(article.upvote_count, article.downvote_count);
    
    return `
        <div class="row mb-5">
            <div class="col-lg-12">
                <a
                    class="article-card p-0 overflow-hidden shadow-sm position-relative d-block"
                    style="cursor:pointer; text-decoration:none; color:inherit; border-radius: 16px;"
                    href="${getArticleUrl(article.slug)}"
                >
                    <img
                        src="${getImage(article, 1200, 600)}"
                        loading="lazy"
                        class="w-100"
                        style="height:520px;object-fit:cover;"
                    >
                    <div
                        class="position-absolute bottom-0 p-4 text-white w-100 d-flex flex-column"
                        style="background:linear-gradient(transparent, rgba(0,0,0,0.92));"
                    >
                        ${badgeHtml}
                        
                        <h1 class="fw-bold display-6 mb-3" style="line-height: 1.2;">
                            ${escapeHtml(article.title)}
                        </h1>
                        
                        ${renderPills(article.categories, article.tags)}
                        
                        <p class="mt-2 fs-5 opacity-90 line-clamp-2" style="font-size: 1rem; max-width: 800px; line-height: 1.6;">
                            ${escapeHtml(article.excerpt || '')}
                        </p>
                        
                        <div class="d-flex align-items-center gap-4 mt-3 small opacity-75">
                            <span>👁 ${formatViewCount(article.view_count)} lượt xem</span>
                            <span class="text-success fw-bold">▲ ${formatViewCount(up)}</span>
                            <span class="text-danger fw-bold">▼ ${formatViewCount(down)}</span>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    `;
}

function renderMixedBlock(bigArticle, sideArticles) {
    const bigUp = Number(bigArticle.upvote_count || 0);
    const bigDown = Number(bigArticle.downvote_count || 0);
    
    return `
        <div class="row mb-5">
            <div class="col-lg-8">
                <a
                    class="article-card h-100 shadow-sm overflow-hidden d-flex flex-column"
                    style="cursor:pointer; text-decoration:none; color:inherit; background:#fff; border-radius:16px; border:1px solid #edf2f7;"
                    href="${getArticleUrl(bigArticle.slug)}"
                >
                    <div style="height:430px; width:100%; overflow:hidden;">
                        <img
                            src="${getImage(bigArticle, 1000, 600)}"
                            loading="lazy"
                            class="w-100 h-100 object-fit-cover"
                        >
                    </div>
                    <div class="p-4 d-flex flex-column flex-grow-1">
                        ${renderCredibilityBadge(bigArticle.upvote_count, bigArticle.downvote_count)}
                        
                        <h2 class="fw-bold mb-3" style="font-size: 1.6rem; color: #1a202c;">
                            ${escapeHtml(bigArticle.title)}
                        </h2>
                        
                        ${renderPills(bigArticle.categories, bigArticle.tags)}
                        
                        <p class="text-muted mt-2 small line-clamp-3 mb-4" style="line-height:1.6; font-size:0.92rem;">
                            ${escapeHtml(bigArticle.excerpt || '')}
                        </p>
                        
                        ${renderCardStats(bigArticle)}
                    </div>
                </a>
            </div>
            
            <div class="col-lg-4 d-flex flex-column gap-3">
                ${sideArticles.map(article => {
                    const up = Number(article.upvote_count || 0);
                    const down = Number(article.downvote_count || 0);
                    return `
                        <a
                            class="article-card shadow-sm d-flex flex-column p-4 flex-grow-1"
                            style="cursor:pointer; text-decoration:none; color:inherit; background:#fff; border-radius:16px; border:1px solid #edf2f7;"
                            href="${getArticleUrl(article.slug)}"
                        >
                            ${renderCredibilityBadge(article.upvote_count, article.downvote_count)}
                            
                            <h5 class="fw-bold line-clamp-2 mb-2" style="font-size: 1.05rem; line-height: 1.4; color: #1a202c;">
                                ${escapeHtml(article.title)}
                            </h5>
                            
                            ${renderPills(article.categories, article.tags)}
                            
                            <p class="small text-muted line-clamp-2 mb-3" style="line-height:1.5; font-size:0.8rem;">
                                ${escapeHtml(article.excerpt || '')}
                            </p>
                            
                            <div class="d-flex align-items-center gap-3 mt-auto pt-2 border-top text-muted small" style="font-size: 0.75rem;">
                                <span>👁 ${formatViewCount(article.view_count)}</span>
                                <span class="text-success fw-bold">▲ ${formatViewCount(up)}</span>
                                <span class="text-danger fw-bold">▼ ${formatViewCount(down)}</span>
                            </div>
                        </a>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function showFeedError(message) {
    if (!feed) return;

    feed.innerHTML = `
        <div class="alert alert-danger text-center py-4">
            ${escapeHtml(message)}
        </div>
    `;
}

function renderDynamicLayout(articles) {

    if (!articles.length) {
        return;
    }

    const layoutType = currentPage % 3;

    let html = '';

    if (layoutType === 1 && articles[0]) {

        html += renderHeroBlock(articles[0]);

        if (articles.slice(1).length > 0) {

            html += renderGridBlock(
                articles.slice(1)
            );
        }

    } else if (layoutType === 2 && articles.length >= 3) {

        html += renderMixedBlock(
            articles[0],
            articles.slice(1, 3)
        );

        if (articles.slice(3).length > 0) {

            html += renderGridBlock(
                articles.slice(3)
            );
        }

    } else {

        html += renderGridBlock(articles);
    }

    feed.insertAdjacentHTML('beforeend', html);
}

/* =========================================================
   CATEGORY
========================================================= */

function loadCategory(event, category) {

    currentCategory = category;

    currentPage = 1;
    hasMore = true;
    loading = false;
    articlesCount = 0;

    feed.innerHTML = '';

    paginationWrapper.classList.add('d-none');

    document.querySelectorAll('.nav-link')
        .forEach(link => {
            link.classList.remove('active');
        });

    if (event) {
        event.target.classList.add('active');
    }

    loadMore();
}

/* =========================================================
   LOAD MORE
========================================================= */

async function loadMore() {

    if (loading || !hasMore) {
        return;
    }

    loading = true;

    loader.classList.remove('d-none');

    try {

        let url = '';
        if (currentCategory === 'for-you') {
            let topicsStr = '';
            try {
                const prefs = localStorage.getItem('newsPulse_UserPrefs');
                if (prefs) {
                    const parsed = JSON.parse(prefs);
                    if (parsed && Array.isArray(parsed.topics)) {
                        topicsStr = parsed.topics.join(',');
                    }
                }
            } catch (e) {
                console.error("Error reading UserPrefs:", e);
            }
            url = getAppUrl(`?page=for_you_feed&page_num=${currentPage}&topics=${encodeURIComponent(topicsStr)}`);
        } else if (currentCategory === 'trending') {
            url = getAppUrl(`?page=trending_feed&page_num=${currentPage}`);
        } else {
            url = getAppUrl(`?page=home_feed&page_num=${currentPage}&category=${encodeURIComponent(currentCategory)}`);
        }

        const response = await fetch(url);

        const result = await response.json();

        if (!result.success) {

            throw new Error(
                result.message || 'Không thể tải dữ liệu'
            );
        }

        const articles = result.data.items || [];

        if (!articles.length) {

            hasMore = false;

            paginationWrapper.classList.add('d-none');

            return;
        }

        renderDynamicLayout(articles);

        currentPage++;

        articlesCount += articles.length;

        hasMore = result.data.has_more;

        if (
            articlesCount >= LIMIT_BEFORE_PAGINATION &&
            hasMore
        ) {

            hasMore = false;

            paginationWrapper.classList.remove('d-none');
        }

    } catch (error) {

        console.error(error);

        if (currentPage === 1) {
            showFeedError('Không thể tải bài viết. Vui lòng kiểm tra kết nối cơ sở dữ liệu hoặc thử lại sau.');
        }

        hasMore = false;

    } finally {

        loading = false;

        loader.classList.add('d-none');
    }
}

/* =========================================================
   LOAD MORE BUTTON
========================================================= */

loadMoreBtn.addEventListener('click', () => {

    paginationWrapper.classList.add('d-none');

    hasMore = true;

    loadMore();
});

/* =========================================================
   INFINITE SCROLL
========================================================= */

window.addEventListener('scroll', () => {

    let scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop;

    if (
        scrollTop > lastScrollTop &&
        scrollTop > scrollThreshold
    ) {

        navbar.classList.add('navbar-hidden');

    } else {

        navbar.classList.remove('navbar-hidden');
    }

    lastScrollTop =
        scrollTop <= 0
            ? 0
            : scrollTop;

    if (
        !loading &&
        hasMore &&
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 400
    ) {

        loadMore();
    }
});

function renderHotNewsCardStats(article) {
    const up = Number(article.upvote_count || 0);
    const down = Number(article.downvote_count || 0);
    return `
        <div class="card-stats-row d-flex align-items-center gap-3 mt-auto pt-2 text-muted small" style="font-size: 0.78rem;">
            <span class="stat-views d-flex align-items-center gap-1">
                👁 ${formatViewCount(article.view_count)} lượt xem
            </span>
            <span class="stat-upvotes text-success fw-bold d-flex align-items-center gap-1">
                ▲ ${formatViewCount(up)}
            </span>
            <span class="stat-downvotes text-danger fw-bold d-flex align-items-center gap-1">
                ▼ ${formatViewCount(down)}
            </span>
        </div>
    `;
}

async function loadHotNews() {
    const container = document.getElementById('hot-news-container');
    if (!container) return;
    try {
        const response = await fetch(getAppUrl('?page=hot_news'));
        const result = await response.json();
        if (result.success && result.items && result.items.length > 0) {
            const badges = [
                '<span class="position-absolute badge bg-warning text-dark font-weight-bold shadow-sm" style="top: 20px; left: 20px; font-size: 0.78rem; border-radius: 6px; z-index: 10; padding: 4px 8px;">TOP 1</span>',
                '<span class="position-absolute badge bg-secondary text-white font-weight-bold shadow-sm" style="top: 20px; left: 20px; font-size: 0.78rem; border-radius: 6px; z-index: 10; padding: 4px 8px;">TOP 2</span>',
                '<span class="position-absolute badge bg-danger text-white font-weight-bold shadow-sm" style="top: 20px; left: 20px; font-size: 0.78rem; border-radius: 6px; z-index: 10; padding: 4px 8px;">TOP 3</span>',
                '<span class="position-absolute badge bg-dark text-white font-weight-bold shadow-sm" style="top: 20px; left: 20px; font-size: 0.78rem; border-radius: 6px; z-index: 10; padding: 4px 8px;">TOP 4</span>'
            ];
            container.innerHTML = result.items.map((article, idx) => {
                const badge = badges[idx] || '';
                return `
                    <div class="col-md-3 mb-3">
                        <a 
                            href="${getArticleUrl(article.slug)}" 
                            class="article-card shadow-sm d-flex flex-column h-100 text-decoration-none text-dark sidebar-item position-relative p-0 overflow-hidden"
                            style="border-radius: 12px; transition: transform 0.2s; background: #fff; border: 1px solid #edf2f7;"
                        >
                            ${badge}
                            <div class="overflow-hidden w-100" style="height: 140px;">
                                <img 
                                    src="${getImage(article, 300, 200)}" 
                                    class="w-100 h-100 object-fit-cover card-img-top" 
                                    style="transition: transform 0.3s;"
                                >
                            </div>
                            <div class="p-3 d-flex flex-column flex-grow-1">
                                <h6 class="fw-bold line-clamp-2 mb-2" style="font-size: 0.95rem; line-height: 1.4; color: #1a202c;">
                                    ${escapeHtml(article.title)}
                                </h6>
                                
                                ${renderPills(article.categories, article.tags)}
                                
                                ${renderHotNewsCardStats(article)}
                            </div>
                        </a>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<div class="col text-muted small">Không có tin nóng nào hôm nay.</div>';
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="col text-danger small">Không thể tải tin nóng.</div>';
    }
}

/* =========================================================
   INITIALIZE
========================================================= */

if (document.getElementById('feed')) {
    loadPageComponents();
    loadHotNews();
    loadMore();
    initMegaMenu();
}

/* =========================================================
   MEGA MENU DYNAMIC LOAD
========================================================= */
function initMegaMenu() {
    const navItems = document.querySelectorAll('.navbar-custom .nav-item');

    navItems.forEach(item => {
        const category = item.dataset.category;
        if (!category) return;

        const container = item.querySelector('.mega-articles-container');
        const navLink = item.querySelector('.nav-link');
        let loaded = false;

        const loadMegaData = async () => {
            if (loaded) return;
            try {
                const response = await fetch(getAppUrl(`?page=mega_menu&category=${category}`));
                const result = await response.json();
                if (result.success && result.items && result.items.length > 0) {
                    container.innerHTML = result.items.map(article => `
                        <div class="col-md-4">
                            <a href="${getArticleUrl(article.slug)}" class="text-decoration-none text-dark d-block mega-item-card" style="transition: transform 0.2s;">
                                <img src="${article.thumbnail_url}" class="img-fluid rounded mb-2" style="height: 100px; width: 100%; object-fit: cover;">
                                <div class="fw-bold small line-clamp-2" style="font-size: 0.85rem; line-height: 1.3; color: #1e293b;">${escapeHtml(article.title)}</div>
                                <small class="text-muted" style="font-size: 0.75rem;">${article.published_time_ago}</small>
                            </a>
                        </div>
                    `).join('');
                    loaded = true;
                } else {
                    container.innerHTML = `<div class="col text-muted small">Không có bài viết mới nào.</div>`;
                }
            } catch (err) {
                console.error(err);
                container.innerHTML = `<div class="col text-danger small">Lỗi tải dữ liệu.</div>`;
            }
        };

        // Desktop: Hover
        item.addEventListener('mouseenter', loadMegaData);

        // Mobile: Click
        if (navLink) {
            navLink.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const isActive = item.classList.contains('active-mega');
                    
                    navItems.forEach(i => i.classList.remove('active-mega'));
                    
                    if (!isActive) {
                        item.classList.add('active-mega');
                        loadMegaData();
                    }
                }
            });
        }
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!e.target.closest('.nav-item')) {
                navItems.forEach(item => item.classList.remove('active-mega'));
            }
        }
    });
}