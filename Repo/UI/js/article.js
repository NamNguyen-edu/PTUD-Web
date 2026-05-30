const articleLoading = document.getElementById('article-loading');
const articleWrapper = document.getElementById('article-wrapper');
const articleError = document.getElementById('article-error');
const commentFormContainer = document.getElementById('comment-form-container');
const commentList = document.getElementById('comment-list');
const commentCount = document.getElementById('comment-count');
const commentError = document.getElementById('comment-error');

let currentUser = { logged: false };
let currentSlug = null;

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

    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
}

function renderTags(tags = []) {
    return tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
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
                <h5 class="fw-bold">${escapeHtml(article.title)}</h5>
                <p class="text-muted small">${escapeHtml(article.excerpt || '')}</p>
            </div>
        </div>
    `).join('');
}

function showError(message) {
    articleLoading.classList.add('d-none');
    articleError.classList.remove('d-none');
    articleError.innerHTML = escapeHtml(message);
}

function showCommentError(message) {
    commentError.classList.remove('d-none');
    commentError.innerHTML = escapeHtml(message);
    setTimeout(() => {
        commentError.classList.add('d-none');
    }, 5000);
}

function renderCommentForm() {
    if (!currentUser.logged) {
        commentFormContainer.innerHTML = `
            <div class="alert alert-info">
                Bạn cần <a href="?page=login">đăng nhập</a> để bình luận.
            </div>
        `;
        return;
    }

    commentFormContainer.innerHTML = `
        <div class="comment-box">
            <textarea
                id="article-comment-input"
                placeholder="Viết bình luận của bạn ở đây..."
            ></textarea>
            <div class="comment-actions">
                <button id="submit-comment-btn" class="btn btn-primary btn-sm">Gửi bình luận</button>
            </div>
        </div>
    `;
}

function renderComments(comments = []) {
    commentCount.innerText = `${comments.length} bình luận`;

    if (!comments.length) {
        commentList.innerHTML = `
            <div class="text-muted">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</div>
        `;
        return;
    }

    commentList.innerHTML = comments.map(comment => renderCommentItem(comment)).join('');
}

function renderCommentItem(comment, depth = 0) {
    const repliesHtml = Array.isArray(comment.replies)
        ? comment.replies.map(reply => renderCommentItem(reply, depth + 1)).join('')
        : '';

    return `
        <div class="comment-item${depth > 0 ? ' comment-reply' : ''}" style="margin-left:${depth * 20}px;">
            <div class="comment-avatar">${escapeHtml((comment.author_name || 'U').charAt(0))}</div>
            <div class="comment-body">
                <div class="comment-meta">
                    <span class="comment-author">${escapeHtml(comment.author_name)}</span>
                    <span class="comment-date">${formatDate(comment.created_at)}</span>
                </div>
                <div class="comment-content">${escapeHtml(comment.content)}</div>
                <button
                    type="button"
                    class="btn btn-link btn-sm comment-reply-btn"
                    data-comment-id="${comment.comment_id}"
                >
                    Trả lời
                </button>
                <div class="reply-form-container" id="reply-form-${comment.comment_id}"></div>
                ${repliesHtml}
            </div>
        </div>
    `;
}

function createReplyForm(parentId) {
    return `
        <div class="reply-box">
            <textarea
                id="reply-input-${parentId}"
                placeholder="Viết trả lời..."
            ></textarea>
            <div class="comment-actions">
                <button type="button" class="btn btn-primary btn-sm submit-reply-btn" data-parent-id="${parentId}">Gửi trả lời</button>
                <button type="button" class="btn btn-secondary btn-sm cancel-reply-btn" data-parent-id="${parentId}">Hủy</button>
            </div>
        </div>
    `;
}

async function submitComment(parentId = null) {
    const input = parentId
        ? document.getElementById(`reply-input-${parentId}`)
        : document.getElementById('article-comment-input');

    if (!input) {
        showCommentError('Không tìm thấy ô nhập bình luận.');
        return;
    }

    const content = input.value.trim();
    if (!content) {
        showCommentError('Nội dung bình luận không được để trống.');
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.set('slug', currentSlug);
        formData.set('content', content);
        if (parentId !== null) {
            formData.set('parent_id', String(parentId));
        }

        const response = await fetch('?page=add_article_comment', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            showCommentError(result.message || 'Không thể gửi bình luận.');
            return;
        }

        if (parentId !== null) {
            const container = document.getElementById(`reply-form-${parentId}`);
            if (container) container.innerHTML = '';
        } else {
            document.getElementById('article-comment-input').value = '';
        }

        await loadArticle();
    } catch (error) {
        console.error(error);
        showCommentError('Lỗi khi gửi bình luận. Vui lòng thử lại.');
    }
}

function toggleReplyForm(commentId) {
    const container = document.getElementById(`reply-form-${commentId}`);
    if (!container) return;

    if (container.innerHTML.trim() === '') {
        container.innerHTML = createReplyForm(commentId);
    } else {
        container.innerHTML = '';
    }
}

function updateCredibilityBadge(up, down) {
    const badgeEl = document.getElementById('article-credibility-badge');
    if (!badgeEl) return;
    const total = up + down;
    if (total < 5) {
        badgeEl.innerHTML = '';
        return;
    }
    const ratio = up / total;
    if (ratio >= 0.8) {
        badgeEl.innerHTML = `
            <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold" style="font-size: 0.85rem; display: inline-block;">
                ✓ Tin cậy cao
            </span>
        `;
    } else if (ratio < 0.5) {
        badgeEl.innerHTML = `
            <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 fw-semibold" style="font-size: 0.85rem; display: inline-block;">
                ⚠️ Nghi vấn/Sai lệch
            </span>
        `;
    } else {
        badgeEl.innerHTML = '';
    }
}

function updateVoteButtons(userVote, upCount, downCount) {
    const btnUp = document.getElementById('btn-upvote');
    const btnDown = document.getElementById('btn-downvote');
    const lblUp = document.getElementById('detail-upvotes');
    const lblDown = document.getElementById('detail-downvotes');
    
    if (lblUp) lblUp.innerText = upCount;
    if (lblDown) lblDown.innerText = downCount;
    
    if (!btnUp || !btnDown) return;
    
    
    btnUp.className = "btn btn-outline-success px-4 py-2 rounded-pill d-flex align-items-center gap-2 transition-all";
    btnDown.className = "btn btn-outline-danger px-4 py-2 rounded-pill d-flex align-items-center gap-2 transition-all";
    
    if (userVote === 'up') {
        btnUp.classList.remove('btn-outline-success');
        btnUp.classList.add('btn-success', 'text-white');
    } else if (userVote === 'down') {
        btnDown.classList.remove('btn-outline-danger');
        btnDown.classList.add('btn-danger', 'text-white');
    }
}

async function handleVoteClick(type) {
    if (!currentUser || !currentUser.logged) {
        alert('Bạn cần đăng nhập để đánh giá độ tin cậy của bài viết.');
        return;
    }
    
    try {
        const formData = new URLSearchParams();
        formData.set('slug', currentSlug);
        formData.set('type', type);
        
        const response = await fetch('?page=vote_article', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (!result.success) {
            alert(result.message || 'Không thể thực hiện đánh giá.');
            return;
        }
        
        
        updateVoteButtons(result.user_vote, result.upvotes, result.downvotes);
        updateCredibilityBadge(result.upvotes, result.downvotes);
        
    } catch (error) {
        console.error(error);
        alert('Đã xảy ra lỗi kết nối khi bình chọn.');
    }
}

async function loadArticle() {
    try {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('slug');

        if (!slug) {
            showError('Thiếu slug bài viết');
            return;
        }

        currentSlug = slug;

        const response = await fetch(`?page=article_detail&slug=${encodeURIComponent(slug)}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Không tải được bài viết');
        }

        const article = result.data.article;
        currentUser = result.data.current_user || { logged: false };

        document.title = article.title;
        document.getElementById('article-category').innerHTML = escapeHtml(article.categories[0] || 'News');
        document.getElementById('article-title').innerHTML = escapeHtml(article.title);
        document.getElementById('article-author').innerHTML = `Tác giả: ${escapeHtml(article.author_name || 'NewsPulse')}`;
        document.getElementById('article-date').innerHTML = formatDate(article.published_at);
        document.getElementById('article-reading-time').innerHTML = calculateReadingTime(article.content);
        document.getElementById('article-thumbnail').src = article.thumbnail_url || 'https://picsum.photos/1200/600';
        document.getElementById('article-tags').innerHTML = renderTags(article.tags);
        document.getElementById('article-content').innerHTML = article.content;
        document.getElementById('article-views').innerHTML = article.view_count;
        document.getElementById('related-articles').innerHTML = renderRelatedArticles(result.data.related_articles);

        
        const upCount = Number(article.upvote_count || 0);
        const downCount = Number(article.downvote_count || 0);
        updateVoteButtons(article.user_vote, upCount, downCount);
        updateCredibilityBadge(upCount, downCount);

        renderCommentForm();
        renderComments(result.data.comments || []);

        articleLoading.classList.add('d-none');
        articleWrapper.classList.remove('d-none');
    } catch (error) {
        console.error(error);
        showError(error.message);
    }
}

function bindActions() {
    
    const btnUp = document.getElementById('btn-upvote');
    const btnDown = document.getElementById('btn-downvote');
    
    if (btnUp) {
        btnUp.addEventListener('click', () => handleVoteClick('up'));
    }
    
    if (btnDown) {
        btnDown.addEventListener('click', () => handleVoteClick('down'));
    }

    commentFormContainer.addEventListener('click', event => {
        if (event.target.matches('#submit-comment-btn')) {
            event.preventDefault();
            submitComment();
        }
    });

    commentList.addEventListener('click', event => {
        if (event.target.matches('.comment-reply-btn')) {
            const commentId = event.target.dataset.commentId;
            toggleReplyForm(commentId);
        }

        if (event.target.matches('.submit-reply-btn')) {
            const parentId = Number(event.target.dataset.parentId);
            submitComment(parentId);
        }

        if (event.target.matches('.cancel-reply-btn')) {
            const parentId = Number(event.target.dataset.parentId);
            const container = document.getElementById(`reply-form-${parentId}`);
            if (container) container.innerHTML = '';
        }
    });
}

(async function () {
    await loadArticle();
    bindActions();
})();