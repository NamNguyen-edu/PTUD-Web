const articleLoading =
    document.getElementById('article-loading');

const articleWrapper =
    document.getElementById('article-wrapper');

const articleError =
    document.getElementById('article-error');

function escapeHtml(str) {

    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function calculateReadingTime(content) {

    const words = content
        .replace(/<[^>]*>/g, '')
        .split(/\s+/)
        .length;

    const minutes = Math.max(
        1,
        Math.ceil(words / 200)
    );

    return `${minutes} min read`;
}

function renderTags(tags = []) {

    return tags.map(tag => `
        <span>${escapeHtml(tag)}</span>
    `).join('');
}

function renderRelatedArticles(articles = []) {

    return articles.map(article => `

        <div class="col-md-4 mb-4">

            <div
                class="article-card h-100 shadow-sm"
                style="cursor:pointer;"
                onclick="window.location.href='?page=article&slug=${article.slug}'"
            >

                <img
                    src="${article.thumbnail_url || 'https://picsum.photos/500/300'}"
                    class="img-fluid rounded mb-3"
                    style="height:200px;width:100%;object-fit:cover;"
                >

                <h5 class="fw-bold">
                    ${escapeHtml(article.title)}
                </h5>

                <p class="text-muted small">
                    ${escapeHtml(article.excerpt || '')}
                </p>

            </div>

        </div>

    `).join('');
}

function showError(message) {

    articleLoading.classList.add('d-none');

    articleError.classList.remove('d-none');

    articleError.innerHTML = message;
}

async function loadArticle() {

    try {

        const params = new URLSearchParams(
            window.location.search
        );

        const slug = params.get('slug');

        if (!slug) {
            showError('Thiếu slug bài viết');
            return;
        }

        const response = await fetch(
            `?action=article_detail&slug=${encodeURIComponent(slug)}`
        );

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.message || 'Không tải được bài viết'
            );
        }

        const article = result.data.article;

        document.title = article.title;

        document.getElementById('article-category').innerHTML =
            escapeHtml(
                article.categories[0] || 'News'
            );

        document.getElementById('article-title').innerHTML =
            escapeHtml(article.title);

        document.getElementById('article-author').innerHTML =
            `Tác giả: ${escapeHtml(article.author_name || 'NewsPulse')}`;

        document.getElementById('article-date').innerHTML =
            formatDate(article.published_at);

        document.getElementById('article-reading-time').innerHTML =
            calculateReadingTime(article.content);

        document.getElementById('article-thumbnail').src =
            article.thumbnail_url || 'https://picsum.photos/1200/600';

        document.getElementById('article-tags').innerHTML =
            renderTags(article.tags);

        document.getElementById('article-content').innerHTML =
            article.content;

        document.getElementById('article-views').innerHTML =
            article.view_count;

        document.getElementById('related-articles').innerHTML =
            renderRelatedArticles(
                result.data.related_articles
            );

        articleLoading.classList.add('d-none');

        articleWrapper.classList.remove('d-none');

    } catch (error) {

        console.error(error);

        showError(error.message);
    }
}

function bindActions() {

    const copyBtn = document.getElementById('copy-link-btn');

    const shareBtn = document.getElementById('share-btn');

    copyBtn.addEventListener('click', async () => {

        await navigator.clipboard.writeText(
            window.location.href
        );

        copyBtn.classList.add('active');

        copyBtn.innerHTML = '✅ Copied';

        setTimeout(() => {

            copyBtn.classList.remove('active');

            copyBtn.innerHTML = '🔗 Copy Link';

        }, 1500);
    });

    shareBtn.addEventListener('click', async () => {

        if (navigator.share) {

            await navigator.share({
                title: document.title,
                url: window.location.href
            });
        }
    });
}

loadArticle();
bindActions();
