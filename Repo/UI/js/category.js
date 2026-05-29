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

function renderTagList(tags) {
    if (!tags || !tags.length) return '';
    return tags.map(tag => `
        <span class="badge badge-theme me-1" style="font-size: 0.75rem;">
            #${escapeHtml(tag)}
        </span>
    `).join('');
}

function renderArticleCard(article) {
    return `
        <div class="col-md-4 mb-4">
            <a
                class="article-card h-100 shadow-sm d-block p-3"
                style="cursor:pointer; text-decoration:none; color:inherit; border-radius: 12px; background: #fff;"
                href="${getArticleUrl(article.slug)}"
            >
                <img
                    src="${getImage(article)}"
                    loading="lazy"
                    class="img-fluid rounded mb-3"
                    style="height:200px;width:100%;object-fit:cover;"
                >
                <div class="mb-2">
                    ${renderTagList(article.tags)}
                </div>
                <h5 class="fw-bold line-clamp-2" style="font-size: 1.1rem; line-height: 1.4; color: #1e293b;">
                    ${escapeHtml(article.title)}
                </h5>
                <p class="text-muted small line-clamp-3">
                    ${escapeHtml(article.excerpt || '')}
                </p>
                <div class="vote-box small mt-3">
                    <span class="vote up text-theme">
                        👁 ${formatViewCount(article.view_count)}
                    </span>
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
                        class="position-absolute bottom-0 p-4 text-white w-100"
                        style="background:linear-gradient(transparent, rgba(0,0,0,0.88));"
                    >
                        <div class="mb-2">
                            ${renderTagList(article.tags)}
                        </div>
                        <h1 class="fw-bold display-6">
                            ${escapeHtml(article.title)}
                        </h1>
                        <p class="mt-2 fs-5 text-light opacity-90 d-none d-md-block">
                            ${escapeHtml(article.excerpt || '')}
                        </p>
                        <div class="vote-box mt-3">
                            👁 ${formatViewCount(article.view_count)}
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
                    class="article-card h-100 shadow-sm overflow-hidden d-block"
                    style="cursor:pointer; text-decoration:none; color:inherit; border-radius: 16px; background: #fff;"
                    href="${getArticleUrl(bigArticle.slug)}"
                >
                    <img
                        src="${getImage(bigArticle, 1000, 600)}"
                        loading="lazy"
                        class="w-100"
                        style="height:400px;object-fit:cover;"
                    >
                    <div class="p-4">
                        <div class="mb-2">
                            ${renderTagList(bigArticle.tags)}
                        </div>
                        <h2 class="fw-bold">
                            ${escapeHtml(bigArticle.title)}
                        </h2>
                        <p class="text-muted mt-3">
                            ${escapeHtml(bigArticle.excerpt || '')}
                        </p>
                    </div>
                </a>
            </div>
            <div class="col-lg-4">
                ${sideArticles.map(article => `
                    <a
                        class="article-card shadow-sm mb-3 d-block p-3"
                        style="cursor:pointer; text-decoration:none; color:inherit; border-radius: 12px; background: #fff;"
                        href="${getArticleUrl(article.slug)}"
                    >
                        <div class="mb-2">
                            ${renderTagList(article.tags)}
                        </div>
                        <h5 class="fw-bold line-clamp-2">
                            ${escapeHtml(article.title)}
                        </h5>
                        <p class="text-muted small line-clamp-2">
                            ${escapeHtml(article.excerpt || '')}
                        </p>
                        <div class="vote-box small mt-2">
                            👁 ${formatViewCount(article.view_count)}
                        </div>
                    </a>
                `).join('')}
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
