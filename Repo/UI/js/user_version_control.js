/**
 * UI/js/user_version_control.js
 * NewsPulse Professional Version Comparison Client Script
 */

(function () {
  'use strict';

  // State
  let articleId = 0;

  /* ─────────────────────────────────────────────
   * 1. View Toggle (Show Highlights vs Clean Text)
   * ───────────────────────────────────────────── */
  function initViewToggle() {
    const btns = document.querySelectorAll('.view-toggle button');
    if (!btns.length) return;

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const showClean = btn.dataset.view === 'clean';
        toggleDiffHighlights(showClean);
      });
    });
  }

  function toggleDiffHighlights(hide) {
    document.querySelectorAll('.version-prose').forEach(prose => {
      if (hide) {
        prose.classList.add('hide-diff');
      } else {
        prose.classList.remove('hide-diff');
      }
    });

    if (!document.getElementById('vc-diff-style')) {
      const style = document.createElement('style');
      style.id = 'vc-diff-style';
      style.textContent = `
        .hide-diff .diff-removed {
          display: none !important;
        }
        .hide-diff .diff-added {
          background: transparent !important;
          color: inherit !important;
          border-radius: 0 !important;
          padding: 0 !important;
          text-decoration: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /* ─────────────────────────────────────────────
   * 2. Live Version Comparison (AJAX)
   * ───────────────────────────────────────────── */
  function initVersionHistoryClick() {
    const items = document.querySelectorAll('.version-history-item');
    const restoreBtn = document.querySelector('.restore-btn');
    if (restoreBtn) {
      articleId = parseInt(restoreBtn.dataset.articleId || 0);
    }

    items.forEach(item => {
      item.addEventListener('click', async () => {
        const versionId = parseInt(item.dataset.versionId || 0);
        if (versionId <= 0 || articleId <= 0) return;

        // Toggle active states
        items.forEach(i => {
          i.classList.remove('active-item');
          const pill = i.querySelector('.version-pill');
          if (pill) {
            pill.classList.remove('active-pill');
            pill.classList.add('inactive-pill');
          }
        });

        item.classList.add('active-item');
        const activePill = item.querySelector('.version-pill');
        if (activePill) {
          activePill.classList.remove('inactive-pill');
          activePill.classList.add('active-pill');
        }

        const label = item.dataset.versionLabel || '';
        showToast(`<i class="fas fa-spinner fa-spin mr-1"></i> Đang so sánh ${label}...`, 'info');

        try {
          const res = await fetch(`?page=user-version-control&article_id=${articleId}&version_id=${versionId}&ajax=1`);
          const data = await res.json();

          if (data.success) {
            updateComparisonPanels(data.current, data.previous);
            showToast(`<i class="fas fa-check-circle text-success mr-1"></i> Đang hiển thị so sánh: <strong>${data.current.version_label}</strong>`, 'success');
          } else {
            showToast('Lỗi tải dữ liệu so sánh!', 'danger');
          }
        } catch (err) {
          console.error(err);
          showToast('Không kết nối được server!', 'danger');
        }
      });
    });
  }

  function updateComparisonPanels(current, previous) {
    // 1. Update Right Panel (Current Version)
    const rightCard = document.querySelector('.col-md-6:nth-child(2) .version-card');
    if (rightCard) {
      const badge = rightCard.querySelector('.version-badge');
      if (badge) badge.textContent = `Phiên bản ${current.version_label}`;
      
      const authorImg = rightCard.querySelector('.card-author img, .card-author-avatar-placeholder');
      if (authorImg) {
        if (authorImg.tagName === 'IMG') {
          authorImg.src = current.avatar_url;
        } else {
          authorImg.outerHTML = `<img src="${current.avatar_url}" class="rounded-circle shadow-sm" width="36" height="36">`;
        }
      }
      
      const authorName = rightCard.querySelector('.card-author-name');
      if (authorName) authorName.textContent = current.full_name;
      
      const authorDate = rightCard.querySelector('.card-author-date');
      if (authorDate) authorDate.textContent = current.created_at;
      
      const prose = rightCard.querySelector('.version-prose');
      if (prose) prose.innerHTML = current.diff_html;
    }

    // 2. Update Left Panel (Previous Version)
    const leftCard = document.querySelector('.col-md-6:nth-child(1) .version-card');
    if (leftCard) {
      const badge = leftCard.querySelector('.version-badge');
      if (badge) badge.textContent = `Phiên bản ${previous.version_label}`;
      
      const authorImg = leftCard.querySelector('.card-author img, .card-author-avatar-placeholder');
      if (authorImg) {
        if (authorImg.tagName === 'IMG') {
          authorImg.src = previous.avatar_url;
        } else {
          authorImg.outerHTML = `<img src="${previous.avatar_url}" class="rounded-circle shadow-sm" width="36" height="36">`;
        }
      }
      
      const authorName = leftCard.querySelector('.card-author-name');
      if (authorName) authorName.textContent = previous.full_name;
      
      const authorDate = leftCard.querySelector('.card-author-date');
      if (authorDate) authorDate.textContent = previous.created_at;
      
      const prose = leftCard.querySelector('.version-prose');
      if (prose) prose.innerHTML = previous.diff_html;
    }

    // 3. Update Meta counters
    const wordCountVal = document.getElementById('meta-word-count');
    if (wordCountVal) wordCountVal.textContent = current.word_count;

    const wordDeltaVal = document.getElementById('meta-word-delta');
    if (wordDeltaVal) {
      wordDeltaVal.textContent = current.word_delta;
      if (current.word_delta.startsWith('-')) {
        wordDeltaVal.className = 'meta-delta-neutral';
      } else {
        wordDeltaVal.className = 'meta-delta';
      }
    }

    const readTimeVal = document.getElementById('meta-read-time');
    if (readTimeVal) readTimeVal.textContent = current.read_time;

    const readTimeDeltaVal = document.getElementById('meta-read-time-delta');
    if (readTimeDeltaVal) readTimeDeltaVal.textContent = current.read_time_delta;

    const seoScoreVal = document.getElementById('meta-seo-score');
    if (seoScoreVal) seoScoreVal.textContent = `${current.seo_score}/100`;

    // 4. Update Restore button text
    const restoreBtn = document.querySelector('.restore-btn');
    if (restoreBtn) {
      restoreBtn.innerHTML = `<span class="material-symbols-outlined mr-1" style="font-size:1.15rem;">restore</span> Khôi phục ${current.version_label}`;
    }
  }

  /* ─────────────────────────────────────────────
   * 3. Restore draft version
   * ───────────────────────────────────────────── */
  function initRestoreButton() {
    const restoreBtn = document.querySelector('.restore-btn');
    if (!restoreBtn) return;

    restoreBtn.addEventListener('click', async () => {
      const active = document.querySelector('.version-history-item.active-item');
      if (!active) {
        showToast('Vui lòng chọn một phiên bản để khôi phục!', 'warning');
        return;
      }

      const versionId = active.dataset.versionId;
      const label = active.dataset.versionLabel;

      showConfirmModal(
        'Khôi phục bản nháp',
        `Bạn có chắc chắn muốn khôi phục nội dung bài viết về bản nháp <strong>${label}</strong> không? Bản soạn thảo hiện tại trên trang viết bài sẽ bị thay thế bằng nội dung bản nháp này.`,
        'Khôi phục ngay',
        async () => {
          try {
            const res = await fetch('?page=user_version_restore', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
              },
              body: new URLSearchParams({
                version_id: versionId
              })
            });

            const data = await res.json();

            if (data.success) {
              showToast('<i class="fas fa-check-circle text-success mr-1"></i> Khôi phục bản nháp thành công! Đang chuyển hướng...', 'success');
              setTimeout(() => {
                window.location.href = `?page=postnews&id=${articleId}`;
              }, 1500);
            } else {
              showToast(data.message || 'Khôi phục bản nháp thất bại!', 'danger');
            }
          } catch (err) {
            console.error(err);
            showToast('Lỗi kết nối máy chủ!', 'danger');
          }
        }
      );
    });
  }

  /* ─────────────────────────────────────────────
   * 4. Sleek Toast Notification
   * ───────────────────────────────────────────── */
  function showToast(message, type = 'info') {
    let container = document.getElementById('user-vc-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'user-vc-toast-container';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'info' ? 'primary' : type} shadow-sm border-0 d-flex align-items-center`;
    toast.style.cssText = `
      margin: 0;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 0.85rem;
      background: white;
      color: #334155;
      border-left: 4px solid var(--color-primary) !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06) !important;
      min-width: 250px;
      max-width: 380px;
      animation: vcSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    `;

    if (type === 'success') toast.style.borderLeftColor = '#10b981';
    if (type === 'danger') toast.style.borderLeftColor = '#ef4444';
    if (type === 'warning') toast.style.borderLeftColor = '#f59e0b';

    toast.innerHTML = `<div>${message}</div>`;
    container.appendChild(toast);

    // Slide in animation style
    if (!document.getElementById('vc-toast-keyframes')) {
      const style = document.createElement('style');
      style.id = 'vc-toast-keyframes';
      style.textContent = `
        @keyframes vcSlideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      toast.style.animation = 'vcSlideIn 0.2s reverse forwards';
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  }

  /* ─────────────────────────────────────────────
   * 5. Smooth Overlay Confirm Modal
   * ───────────────────────────────────────────── */
  function showConfirmModal(title, body, confirmLabel, onConfirm) {
    const old = document.getElementById('user-vc-confirm-modal');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'user-vc-confirm-modal';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    `;

    overlay.innerHTML = `
      <div class="glass-panel" style="
        background: white;
        width: 90%;
        max-width: 440px;
        padding: 24px;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        transform: translateY(20px);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">
        <h5 class="font-weight-bold mb-3" style="color: #0f172a; font-size: 1.15rem;">${title}</h5>
        <p style="color: #475569; font-size: 0.9rem; line-height: 1.5; margin-bottom: 24px;">${body}</p>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button id="vc-cancel" class="btn btn-link text-muted font-weight-bold" style="text-decoration:none; font-size:0.85rem; padding: 6px 16px;">Hủy</button>
          <button id="vc-confirm" class="btn btn-primary font-weight-bold" style="border-radius:20px; font-size:0.85rem; background:var(--color-primary); border:none; padding: 6px 20px;">${confirmLabel}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Fade in
    setTimeout(() => {
      overlay.style.opacity = '1';
      overlay.querySelector('.glass-panel').style.transform = 'translateY(0)';
    }, 10);

    const closeModal = () => {
      overlay.style.opacity = '0';
      overlay.querySelector('.glass-panel').style.transform = 'translateY(20px)';
      setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#vc-cancel').addEventListener('click', closeModal);

    overlay.querySelector('#vc-confirm').addEventListener('click', () => {
      closeModal();
      onConfirm();
    });
  }

  /* ─────────────────────────────────────────────
   * Init
   * ───────────────────────────────────────────── */
  function init() {
    initViewToggle();
    initVersionHistoryClick();
    initRestoreButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
