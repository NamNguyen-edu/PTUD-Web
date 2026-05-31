// UI/js/version-control.js

/**
 * version-control.js
 * UX enhancements for the Version Control / History Comparison page.
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
   * 1. View toggle
   * ───────────────────────────────────────────── */
  function initViewToggle() {
    const btns = document.querySelectorAll('.view-toggle button');
    if (!btns.length) return;

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const showAll = btn.textContent.trim() === 'Hiện tất cả';
        toggleDiffHighlights(!showAll);
      });
    });
  }

  function toggleDiffHighlights(show) {
    document.querySelectorAll('.version-prose').forEach(prose => {
      if (show) {
        prose.classList.remove('hide-diff');
      } else {
        prose.classList.add('hide-diff');
      }
    });

    if (!document.getElementById('vc-diff-style')) {
      const style = document.createElement('style');
      style.id = 'vc-diff-style';
      style.textContent = `
        .hide-diff .diff-removed,
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
   * 2. Version history click
   * ───────────────────────────────────────────── */
  function initVersionHistoryClick() {
    const items = document.querySelectorAll('.version-history-item');

    items.forEach(item => {
      item.style.cursor = 'pointer';

      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active-item'));
        item.classList.add('active-item');

        const versionLabel =
          item.dataset.versionLabel || '';

        const restoreBtn = document.querySelector('.restore-btn');

        if (restoreBtn && versionLabel) {
          restoreBtn.dataset.version = versionLabel;

          restoreBtn.innerHTML = `
            <span class="material-symbols-outlined" style="font-size:1rem;">
              restore
            </span>
            Khôi phục ${versionLabel}
          `;
        }

        showToast(`Đang so sánh với ${versionLabel}`, 'info');
      });
    });
  }

  /* ─────────────────────────────────────────────
   * 3. Restore button
   * ───────────────────────────────────────────── */
  function initRestoreButton() {
    const restoreBtn =
    document.querySelector('.restore-btn');

if (restoreBtn) {

    restoreBtn.addEventListener(
        'click',
        async () => {

            const articleId =
                restoreBtn.dataset.articleId;

            const active =
                document.querySelector(
                    '.version-history-item.active-item'
                );

            if (!active) {

                alert('Chưa chọn version');
                return;
            }

            const versionId =
                active.dataset.versionId;

            try {

                const res = await fetch(
                    '?page=version_restore',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/x-www-form-urlencoded;charset=UTF-8'
                        },
                        body: new URLSearchParams({
                            version_id: versionId
                        })
                    }
                );

                const data = await res.json();

                if (data.success) {

                    alert(
                        'Khôi phục thành công'
                    );

                    location.reload();

                } else {

                    alert(
                        'Khôi phục thất bại'
                    );
                }

            } catch (err) {

                console.error(err);

                alert('Lỗi server');
            }
        }
    );
}

document
.querySelectorAll(
    '.version-history-item'
)
.forEach(item => {

    item.addEventListener(
        'click',
        () => {

            document
            .querySelectorAll(
                '.version-history-item'
            )
            .forEach(i =>
                i.classList.remove(
                    'active-item'
                )
            );

            item.classList.add(
                'active-item'
            );
        }
    );
});
  }
  /* ─────────────────────────────────────────────
   * 4. Floating bar
   * ───────────────────────────────────────────── */
  function initFloatingBar() {
    const editBtn = document.getElementById('btn-edit');
    const previewBtn = document.getElementById('btn-preview');
    const deleteBtn = document.getElementById('btn-delete');

    const getArticleId = () => {
      const restoreBtn = document.querySelector('.restore-btn');
      return restoreBtn ? restoreBtn.dataset.articleId : '';
    };

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const articleId = getArticleId();
        window.location.href = `?page=postnews&id=${articleId}`;
      });
    }

    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        const articleId = getArticleId();
        window.open(`?page=article&id=${articleId}`, '_blank');
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        showConfirmModal(
          'Huỷ phiên bản',
          'Bạn có chắc muốn huỷ phiên bản hiện tại?',
          'Huỷ phiên bản',
          () => {
            showToast('Đã huỷ phiên bản.', 'warning');
          },
          'danger'
        );
      });
    }
  }

  /* ─────────────────────────────────────────────
   * 5. Toast
   * ───────────────────────────────────────────── */
  function showToast(message, type = 'info') {
    let container = document.getElementById('vc-toast-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'vc-toast-container';

      container.style.cssText = `
        position: fixed;
        bottom: 90px;
        right: 24px;
        z-index: 9999;
      `;

      document.body.appendChild(container);
    }

    const toast = document.createElement('div');

    toast.style.cssText = `
      background: white;
      padding: 12px 16px;
      margin-top: 10px;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,.12);
      font-size: 14px;
    `;

    toast.innerHTML = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /* ─────────────────────────────────────────────
   * 6. Confirm Modal
   * ───────────────────────────────────────────── */
  function showConfirmModal(
    title,
    body,
    confirmLabel,
    onConfirm
  ) {
    const old = document.getElementById('vc-confirm-modal');

    if (old) old.remove();

    const overlay = document.createElement('div');

    overlay.id = 'vc-confirm-modal';

    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;

    overlay.innerHTML = `
      <div style="
        background:white;
        width:90%;
        max-width:420px;
        padding:24px;
        border-radius:14px;
      ">
        <h5>${title}</h5>
        <p>${body}</p>

        <div style="
          display:flex;
          justify-content:flex-end;
          gap:10px;
        ">
          <button id="vc-cancel" class="btn btn-light">
            Huỷ
          </button>

          <button id="vc-confirm" class="btn btn-primary">
            ${confirmLabel}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay
      .querySelector('#vc-cancel')
      .addEventListener('click', () => {
        overlay.remove();
      });

    overlay
      .querySelector('#vc-confirm')
      .addEventListener('click', () => {
        overlay.remove();
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
    initFloatingBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();