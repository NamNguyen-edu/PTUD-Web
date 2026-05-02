// ==========================
// ARTICLE COMPONENT
// ==========================

function createArticle(data) {
  return `
    <div class="article-component">

      <div class="article-content">
        <div class="meta">${data.category} • ${data.time}</div>

        <h3 class="title">${data.title}</h3>

        <p class="desc">${data.desc}</p>

        <div class="bottom">
          <div class="tags">
            ${data.tags.map(tag => `<span>${tag}</span>`).join("")}
          </div>

          <div class="vote-box">
            <span class="vote up">▲ ${data.up}</span>
            <span class="vote down">▼ ${data.down}</span>
          </div>
        </div>
      </div>

      <div class="article-thumb"></div>

    </div>
  `;
}


// ==========================
// FULL ARTICLE DETAIL
// ==========================

function renderArticle(data) {
  return `
    <div class="article-container">

      <div class="category">${data.category}</div>

      <h1 class="article-title">${data.title}</h1>

      <div class="meta">${data.author} • ${data.time}</div>

      <div class="article-image"></div>

      <div class="tags">
        ${data.tags.map(t => `<span>${t}</span>`).join("")}
      </div>

      <div class="article-content">
        ${data.content.map(p => `<p>${p}</p>`).join("")}
      </div>

      <div class="vote-box">
        <span class="vote up">▲ ${data.up}</span>
        <span class="vote down">▼ ${data.down}</span>
      </div>

    </div>
  `;
}


// ==========================
// BOOKMARK & FAVORITE SYSTEM
// ==========================

// Storage keys
const BOOKMARKS_KEY = 'newspulse_bookmarks';
const FAVORITES_KEY = 'newspulse_favorites';

// Get current article ID (based on title or URL)
function getArticleId() {
  const title = document.querySelector('.article-title')?.textContent || 'article';
  return title.toLowerCase().replace(/\s+/g, '-').substring(0, 50);
}

// Get saved bookmarks from localStorage
function getBookmarks() {
  const saved = localStorage.getItem(BOOKMARKS_KEY);
  return saved ? JSON.parse(saved) : [];
}

// Get saved favorites from localStorage
function getFavorites() {
  const saved = localStorage.getItem(FAVORITES_KEY);
  return saved ? JSON.parse(saved) : [];
}

// Save bookmarks to localStorage
function saveBookmarks(bookmarks) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

// Save favorites to localStorage
function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// Toggle bookmark
function toggleBookmark() {
  const articleId = getArticleId();
  const bookmarks = getBookmarks();
  const btn = document.getElementById('bookmark-btn');
  
  if (bookmarks.includes(articleId)) {
    // Remove bookmark
    const index = bookmarks.indexOf(articleId);
    bookmarks.splice(index, 1);
    saveBookmarks(bookmarks);
    btn.classList.remove('active');
    showNotification('✓ Đã xóa khỏi danh sách Lưu', 'info');
  } else {
    // Add bookmark
    bookmarks.push(articleId);
    saveBookmarks(bookmarks);
    btn.classList.add('active');
    showNotification('✓ Đã lưu bài viết vào mục "Lưu"', 'success');
  }
}

// Toggle favorite
function toggleFavorite() {
  const articleId = getArticleId();
  const favorites = getFavorites();
  const btn = document.getElementById('favorite-btn');
  
  if (favorites.includes(articleId)) {
    // Remove favorite
    const index = favorites.indexOf(articleId);
    favorites.splice(index, 1);
    saveFavorites(favorites);
    btn.classList.remove('active');
    showNotification('✓ Đã xóa khỏi danh sách Thích', 'info');
  } else {
    // Add favorite
    favorites.push(articleId);
    saveFavorites(favorites);
    btn.classList.add('active');
    showNotification('❤ Đã lưu bài viết vào mục "Yêu thích"', 'success');
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };
  
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${iconMap[type]}</span>
      <span class="notification-message">${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-hide notification after 3 seconds
  setTimeout(() => {
    notification.classList.add('hide');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Initialize bookmark button
  const bookmarkBtn = document.getElementById('bookmark-btn');
  if (bookmarkBtn) {
    const articleId = getArticleId();
    if (getBookmarks().includes(articleId)) {
      bookmarkBtn.classList.add('active');
    }
    bookmarkBtn.addEventListener('click', toggleBookmark);
  }
  
  // Initialize favorite button
  const favoriteBtn = document.getElementById('favorite-btn');
  if (favoriteBtn) {
    const articleId = getArticleId();
    if (getFavorites().includes(articleId)) {
      favoriteBtn.classList.add('active');
    }
    favoriteBtn.addEventListener('click', toggleFavorite);
  }
});