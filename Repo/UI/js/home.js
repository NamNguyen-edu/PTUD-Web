let feed = document.getElementById("feed");
let loader = document.getElementById("loader");
let paginationWrapper = document.getElementById("pagination-wrapper");
let loadMoreBtn = document.getElementById("load-more-btn");

const navbar = document.querySelector('.navbar-custom');

let currentPage = 1;
let hasMore = true;
let loading = false;
let articlesCount = 0;
let currentCategory = "world";

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

function goToArticle(slug) {

    if (!slug) return;

    window.location.href =
        `?page=article&slug=${encodeURIComponent(slug)}`;
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
            `?action=search_suggestions&keyword=${encodeURIComponent(trimmed)}`
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

        const item = event.target.closest('.search-item');

        if (!item) return;

        const keyword = decodeURIComponent(
            item.dataset.keyword || ''
        );

        if (keyword) {

            window.location.href =
                `?page=search&keyword=${encodeURIComponent(keyword)}`;
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

    const headerPlaceholder =
        document.getElementById('header-placeholder');

    const footerPlaceholder =
        document.getElementById('footer-placeholder');

    if (!headerPlaceholder || !footerPlaceholder) {
        return;
    }

    fetch('UI/components/header.html')
        .then(response => {

            if (!response.ok) {

                throw new Error('Không thể load header');
            }

            return response.text();
        })
        .then(html => {

            html = html.replace(
                /href="\.\.\/html\/Login\.html"/g,
                'href="?page=login"'
            );

            html = html.replace(
                /href="\.\.\/html\/SignUp\.html"/g,
                'href="?page=signup"'
            );

            html = html.replace(
                /href="\.\.\/html\/profile\.html"/g,
                'href="?page=profile"'
            );

            headerPlaceholder.innerHTML = html;

            bindSearchDropdown();
        })
        .catch(err => console.error(err));

    fetch('UI/components/footer.html')
        .then(response => {

            if (!response.ok) {

                throw new Error('Không thể load footer');
            }

            return response.text();
        })
        .then(html => {

            footerPlaceholder.innerHTML = html;
        })
        .catch(err => console.error(err));
}

/* =========================================================
   ARTICLE COMPONENTS
========================================================= */

function renderTagList(tags = []) {

    return tags.map(tag => `
        <span class="tag me-1">
            ${escapeHtml(tag)}
        </span>
    `).join('');
}

function renderArticleCard(article) {

    return `
        <div class="col-md-4 mb-4">

            <div
                class="article-card h-100 shadow-sm"
                style="cursor:pointer;"
                onclick="goToArticle('${escapeHtml(article.slug)}')"
            >

                <img
                    src="${getImage(article)}"
                    class="img-fluid rounded mb-3"
                    style="height:220px;width:100%;object-fit:cover;"
                >

                <div class="mb-2">
                    ${renderTagList(article.tags)}
                </div>

                <h5 class="fw-bold">
                    ${escapeHtml(article.title)}
                </h5>

                <p class="text-muted small">
                    ${escapeHtml(article.excerpt || '')}
                </p>

                <div class="vote-box small mt-3">
                    <span class="vote up">
                        👁 ${formatViewCount(article.view_count)}
                    </span>
                </div>

            </div>

        </div>
    `;
}

function renderGridBlock(articles) {

    return `
        <div class="row mb-5">
            ${articles.map(renderArticleCard).join('')}
        </div>
    `;
}

function renderHeroBlock(article) {

    return `
        <div class="row mb-5">

            <div class="col-lg-12">

                <div
                    class="article-card p-0 overflow-hidden shadow-sm position-relative"
                    style="cursor:pointer;"
                    onclick="goToArticle('${escapeHtml(article.slug)}')"
                >

                    <img
                        src="${getImage(article, 1200, 600)}"
                        class="w-100"
                        style="height:520px;object-fit:cover;"
                    >

                    <div
                        class="position-absolute bottom-0 p-4 text-white w-100"
                        style="background:linear-gradient(transparent, rgba(0,0,0,0.92));"
                    >

                        <div class="mb-3">
                            ${renderTagList(article.tags)}
                        </div>

                        <h1 class="fw-bold display-5">
                            ${escapeHtml(article.title)}
                        </h1>

                        <p class="mt-3 fs-5">
                            ${escapeHtml(article.excerpt || '')}
                        </p>

                        <div class="vote-box mt-3">
                            👁 ${formatViewCount(article.view_count)}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderMixedBlock(bigArticle, sideArticles) {

    return `
        <div class="row mb-5">

            <div class="col-lg-8">

                <div
                    class="article-card h-100 shadow-sm overflow-hidden"
                    style="cursor:pointer;"
                    onclick="goToArticle('${escapeHtml(bigArticle.slug)}')"
                >

                    <img
                        src="${getImage(bigArticle, 1000, 600)}"
                        class="w-100"
                        style="height:430px;object-fit:cover;"
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
                </div>
            </div>

            <div class="col-lg-4">

                ${sideArticles.map(article => `

                    <div
                        class="article-card shadow-sm mb-3"
                        style="cursor:pointer;"
                        onclick="goToArticle('${escapeHtml(article.slug)}')"
                    >

                        <div class="mb-2">
                            ${renderTagList(article.tags)}
                        </div>

                        <h5 class="fw-bold">
                            ${escapeHtml(article.title)}
                        </h5>

                        <p class="small text-muted">
                            ${escapeHtml(article.excerpt || '')}
                        </p>

                        <div class="vote-box small mt-2">
                            👁 ${formatViewCount(article.view_count)}
                        </div>

                    </div>

                `).join('')}

            </div>
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

        const response = await fetch(
            `?action=home_feed&page=${currentPage}&category=${encodeURIComponent(currentCategory)}`
        );

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

/* =========================================================
   INITIALIZE
========================================================= */

loadPageComponents();
loadMore();