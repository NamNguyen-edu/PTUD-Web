// DOM Elements
const wrapper = document.getElementById("category-wrapper");
const feed = document.getElementById("feed");
const loader = document.getElementById("loader");
const paginationWrapper = document.getElementById("pagination-wrapper");
const loadMoreBtn = document.getElementById("load-more-btn");

// Category State
const slug = wrapper ? wrapper.getAttribute("data-slug") : "";
let currentPage = 1;
let hasMore = true;
let loading = false;
let articlesCount = 0;
const LIMIT_BEFORE_PAGINATION = 12;

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

function getArticleUrl(articleSlug) {
    return getAppUrl(`?page=article&slug=${encodeURIComponent(articleSlug)}`);
}

/* =========================================================
   LAYOUT RENDERERS
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
    
    // Chuyên mục (Categories)
    categories.slice(0, 2).forEach(cat => {
        const style = getPillStyle(cat);
        html += `
            <span class="category-pill shadow-sm" style="background-color: ${style.bg}; color: ${style.text}; font-weight: 600; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; display: inline-block;">
                ${escapeHtml(cat)}
            </span>
        `;
    });
    
    // Thẻ (Tags)
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
                        style="height:480px;object-fit:cover;"
                    >
                    <div
                        class="position-absolute bottom-0 p-4 text-white w-100 d-flex flex-column"
                        style="background:linear-gradient(transparent, rgba(0,0,0,0.88));"
                    >
                        ${badgeHtml}
                        
                        <h1 class="fw-bold display-6 mb-3" style="line-height: 1.2;">
                            ${escapeHtml(article.title)}
                        </h1>
                        
                        ${renderPills(article.categories, article.tags)}
                        
                        <p class="mt-2 fs-5 text-light opacity-90 d-none d-md-block line-clamp-2" style="font-size: 1rem; line-height: 1.6;">
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
    return `
        <div class="row mb-5">
            <div class="col-lg-8 mb-4 mb-lg-0">
                <a
                    class="article-card h-100 shadow-sm overflow-hidden d-flex flex-column"
                    style="cursor:pointer; text-decoration:none; color:inherit; border-radius: 16px; background: #fff; border:1px solid #edf2f7;"
                    href="${getArticleUrl(bigArticle.slug)}"
                >
                    <div style="height:400px; width:100%; overflow:hidden;">
                        <img
                            src="${getImage(bigArticle, 1000, 600)}"
                            loading="lazy"
                            class="w-100 h-100 object-fit-cover"
                        >
                    </div>
                    <div class="p-4 d-flex flex-column flex-grow-1">
                        ${renderCredibilityBadge(bigArticle.upvote_count, bigArticle.downvote_count)}
                        
                        <h2 class="fw-bold mb-3" style="font-size: 1.5rem; color: #1a202c;">
                            ${escapeHtml(bigArticle.title)}
                        </h2>
                        
                        ${renderPills(bigArticle.categories, bigArticle.tags)}
                        
                        <p class="text-muted mt-2 small line-clamp-3 mb-4" style="line-height: 1.6; font-size: 0.9rem;">
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
                            style="cursor:pointer; text-decoration:none; color:inherit; border-radius: 12px; background: #fff; border:1px solid #edf2f7;"
                            href="${getArticleUrl(article.slug)}"
                        >
                            ${renderCredibilityBadge(article.upvote_count, article.downvote_count)}
                            
                            <h5 class="fw-bold line-clamp-2 mb-2" style="font-size: 1.05rem; line-height: 1.4; color: #1a202c;">
                                ${escapeHtml(article.title)}
                            </h5>
                            
                            ${renderPills(article.categories, article.tags)}
                            
                            <p class="text-muted small line-clamp-2 mb-3" style="line-height:1.5; font-size:0.8rem;">
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

function renderDynamicLayout(articles) {
    if (!articles.length) return;
    const layoutType = currentPage % 3;
    let html = '';

    if (layoutType === 1 && articles[0]) {
        html += renderHeroBlock(articles[0]);
        if (articles.slice(1).length > 0) {
            html += renderGridBlock(articles.slice(1));
        }
    } else if (layoutType === 2 && articles.length >= 3) {
        html += renderMixedBlock(articles[0], articles.slice(1, 3));
        if (articles.slice(3).length > 0) {
            html += renderGridBlock(articles.slice(3));
        }
    } else {
        html += renderGridBlock(articles);
    }

    feed.insertAdjacentHTML('beforeend', html);
}

function showFeedError(message) {
    if (!feed) return;
    feed.innerHTML = `
        <div class="alert alert-danger text-center py-4">
            ${escapeHtml(message)}
        </div>
    `;
}

/* =========================================================
   API FEED RETRIEVAL
========================================================= */

async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    loader.classList.remove('d-none');

    try {
        const response = await fetch(
            getAppUrl(`?page=category_feed&slug=${encodeURIComponent(slug)}&page_num=${currentPage}`)
        );
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Không thể tải dữ liệu');
        }

        const articles = result.data.items || [];

        if (!articles.length) {
            hasMore = false;
            paginationWrapper.classList.add('d-none');
            if (currentPage === 1) {
                feed.innerHTML = `<div class="text-center py-5 text-muted">Chưa có bài viết nào thuộc chuyên mục này.</div>`;
            }
            return;
        }

        renderDynamicLayout(articles);
        currentPage++;
        articlesCount += articles.length;
        hasMore = result.data.has_more;

        if (articlesCount >= LIMIT_BEFORE_PAGINATION && hasMore) {
            hasMore = false;
            paginationWrapper.classList.remove('d-none');
        }

    } catch (error) {
        console.error(error);
        if (currentPage === 1) {
            showFeedError('Không thể tải bài viết. Vui lòng thử lại sau.');
        }
        hasMore = false;
    } finally {
        loading = false;
        loader.classList.add('d-none');
    }
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        paginationWrapper.classList.add('d-none');
        hasMore = true;
        loadMore();
    });
}

window.addEventListener('scroll', () => {
    if (
        !loading &&
        hasMore &&
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 400
    ) {
        loadMore();
    }
});

// Dynamic Loader Trigger on Mount
document.addEventListener("DOMContentLoaded", () => {
    // Set dynamic body background color based on category slug
    const themeColors = {
        'cong-nghe': '#f4fbf7', // Soft Emerald Mint tint
        'kinh-doanh': '#fdfaf2', // Soft Amber Cream tint
        'thoi-su': '#fdf5f5'     // Soft Crimson Rose tint
    };
    if (slug && themeColors[slug]) {
        document.body.style.setProperty('background', themeColors[slug], 'important');
    }

    // Tải Header/Footer từ file components gốc giống các trang khác
    const BASE = "/PTUD-Web/Repo/UI";
    
    // Tải Header
    fetch(BASE + "/components/header.html")
        .then(response => response.text())
        .then(data => {
            const el = document.getElementById("header-placeholder");
            if (el) {
                el.innerHTML = data;
                
                // Nạp script xử lý login/profile cho header
                const headerScript = document.createElement('script');
                headerScript.src = BASE + '/js/header_user.js';
                headerScript.defer = true;
                headerScript.onload = function() {
                    if (window.initHeaderUser) window.initHeaderUser();
                };
                document.head.appendChild(headerScript);
            }
        });

    // Tải Footer
    fetch(BASE + "/components/footer.html")
        .then(response => response.text())
        .then(data => {
            const el = document.getElementById("footer-placeholder");
            if (el) el.innerHTML = data;
        });

    // Load category feed
    if (feed) {
        loadMore();
    }
});
