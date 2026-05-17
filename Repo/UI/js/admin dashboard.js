/**
 * Admin Dashboard — Data Loader
 * Kết nối PHP API → HTML dashboard
 */

const API_URL = '/?action=get_dashboard_data';// KHỞI CHẠY: thử cả appReady lẫn DOMContentLoaded
// ─────────────────────────────────────────────
let initialized = false;

function init() {
    if (initialized) return;
    initialized = true;
    loadDashboard();
}

document.addEventListener('appReady', init);
document.addEventListener('DOMContentLoaded', init);


// ─────────────────────────────────────────────
// FETCH DỮ LIỆU CHÍNH
// ─────────────────────────────────────────────
async function loadDashboard() {
    try {
        const res = await fetch(API_URL);

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        const data = await res.json();
        console.log('[Dashboard] Dữ liệu nhận được:', data);

        updateKPI(data.kpi);
        updateWorkflow(data.workflow_status);
        updateQueue(data.approval_queue);
        updateActivity(data.recent_activity);
        runCounterAnimation();

    } catch (err) {
        console.error('[Dashboard] Lỗi fetch:', err);
        showErrorBanner(err.message);
    }
}


// ─────────────────────────────────────────────
// 1. KPI CARDS — dùng data-kpi attribute
// ─────────────────────────────────────────────
function updateKPI(kpi) {
    if (!kpi) return;

    // Map: data-kpi value → giá trị từ API
    const map = {
        'total_articles':    kpi.total_articles,
        'pending_approvals': kpi.pending_approvals,
        'active_users':      kpi.active_users,
        'avg_approval_time': kpi.avg_approval_time_min,
    };

    Object.entries(map).forEach(([key, value]) => {
        const el = document.querySelector(`[data-kpi="${key}"] .counter`);
        if (el) el.setAttribute('data-target', value ?? 0);
    });

    // Fallback: nếu HTML chưa có data-kpi, dùng thứ tự các card
    const counters = document.querySelectorAll('.row.g-4.mb-5 .counter');
    const values   = [kpi.total_articles, kpi.pending_approvals, kpi.active_users, kpi.avg_approval_time_min];
    counters.forEach((el, i) => {
        if (values[i] !== undefined) el.setAttribute('data-target', values[i]);
    });
}


// ─────────────────────────────────────────────
// 2. WORKFLOW STATUS — donut chart + legend
// ─────────────────────────────────────────────
function updateWorkflow(workflow) {
    if (!workflow) return;

    // Số live ở giữa vòng tròn
    const liveEl = document.querySelector('.position-absolute .counter');
    if (liveEl) liveEl.setAttribute('data-target', workflow.live_count ?? 0);

    // Cập nhật SVG donut (2 arc: published + draft)
    updateDonut(workflow.published ?? 0, workflow.draft ?? 0);

    // 4 ô legend (Approved / Draft / Rejected / Review)
    // HTML có thứ tự: Approved=published, Draft=draft, Rejected=archived, Review=pending
    const legendCounters = document.querySelectorAll('.col-12.col-md-7 .counter, [class*="col-md-7"] .counter');
    const legendValues   = [
        workflow.published ?? 0,
        workflow.draft     ?? 0,
        workflow.archived  ?? 0,
        workflow.pending   ?? 0,
    ];
    legendCounters.forEach((el, i) => {
        if (legendValues[i] !== undefined) el.setAttribute('data-target', legendValues[i]);
    });
}

function updateDonut(publishedPct, draftPct) {
    const circumference = 100.53; // 2 * π * r=16

    const paths = document.querySelectorAll('.chart-path');
    if (paths.length < 2) return;

    const pub   = (publishedPct / 100) * circumference;
    const drift = (draftPct    / 100) * circumference;
    const gap   = circumference;     // phần còn lại (dùng offset)

    // Arc 1: published (xanh)
    paths[0].setAttribute('stroke-dasharray', `${pub.toFixed(2)}, ${circumference}`);
    paths[0].setAttribute('stroke-dashoffset', `${circumference}`);

    // Arc 2: draft (tím), offset bằng phần đã vẽ bởi arc 1
    const offset2 = circumference - pub;
    paths[1].setAttribute('stroke-dasharray', `${drift.toFixed(2)}, ${circumference}`);
    paths[1].setAttribute('stroke-dashoffset', `${offset2.toFixed(2)}`);
}


// ─────────────────────────────────────────────
// 3. APPROVAL QUEUE — render bảng
// ─────────────────────────────────────────────
function updateQueue(queue) {
    const tbody = document.querySelector('.table-responsive tbody');
    if (!tbody) return;

    if (!queue || queue.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-5">
                    <span class="material-symbols-outlined d-block mb-2" style="font-size:2rem;opacity:.3">check_circle</span>
                    Tất cả bài viết đã được duyệt! 🎉
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = queue.map(item => {
        const initials = getInitials(item.author_name);
        const deadline = formatDeadline(item.created_at);
        const category = escapeHtml(item.primary_category || 'Chưa phân loại');
        const title    = escapeHtml(item.title);
        const author   = escapeHtml(item.author_name);

        return `
        <tr>
            <td class="ps-4">
                <div class="fw-bold text-truncate" style="max-width:250px;">${title}</div>
                <div class="small text-muted">${category}</div>
            </td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold small bg-light flex-shrink-0"
                         style="width:28px;height:28px;">${initials}</div>
                    <span class="small fw-medium text-nowrap">${author}</span>
                </div>
            </td>
            <td class="text-center">
                <span class="badge-pill bg-primary bg-opacity-10 text-primary small">Pending</span>
            </td>
            <td class="text-end pe-4 fw-bold small text-nowrap ${deadline.urgent ? 'text-danger' : 'text-muted'}">
                ${deadline.label}
            </td>
        </tr>`;
    }).join('');
}


// ─────────────────────────────────────────────
// 4. RECENT ACTIVITY — render feed
// ─────────────────────────────────────────────
const ACTIVITY_CONFIG = {
    article_published: { icon: 'publish',    color: 'var(--bs-primary)', title: 'Article Published',  
                         desc: (a,t) => `${a} published <span class="text-primary fw-bold">"${t}"</span>` },
    article_draft:     { icon: 'edit',       color: '#615b77',           title: 'New Draft Created',   
                         desc: (a,t) => `${a} started <span class="fw-bold text-dark">"${t}"</span>` },
    article_rejected:  { icon: 'close',      color: '#9f403d',           title: 'Article Rejected',    
                         desc: (a,t) => `${a} rejected <span class="text-danger fw-bold">"${t}"</span>` },
    comment_added:     { icon: 'comment',    color: '#617aae',           title: 'New Comment',         
                         desc: (a,t) => `${a} commented on <span class="fw-bold">"${t}"</span>` },
    user_registered:   { icon: 'person_add', color: '#536073',           title: 'New Collaborator',    
                         desc: (a,t) => `${a} joined as <span class="fw-bold">${t}</span>` },
};

function updateActivity(activities) {
    const feed = document.querySelector('.activity-feed');
    if (!feed) return;

    if (!activities || activities.length === 0) {
        feed.innerHTML = '<p class="text-muted small text-center py-3">Chưa có hoạt động nào.</p>';
        return;
    }

    feed.innerHTML = activities.map(item => {
        const cfg    = ACTIVITY_CONFIG[item.type] || { icon: 'info', color: '#aaa', title: 'Activity', desc: (a) => a };
        const actor  = escapeHtml(item.actor  || '');
        const target = escapeHtml(item.target || '');

        return `
        <div class="activity-item">
            <div class="activity-dot" style="background-color:${cfg.color};">
                <span class="material-symbols-outlined" style="font-size:10px;">${cfg.icon}</span>
            </div>
            <div>
                <div class="fw-bold small mb-1">${cfg.title}</div>
                <p class="small text-muted mb-1">${cfg.desc(actor, target)}</p>
                <div class="text-uppercase text-muted fw-black" style="font-size:0.6rem;opacity:.5;">
                    ${timeAgo(item.created_at)}
                </div>
            </div>
        </div>`;
    }).join('');
}


// ─────────────────────────────────────────────
// 5. COUNTER ANIMATION
// ─────────────────────────────────────────────
function runCounterAnimation() {
    document.querySelectorAll('.counter').forEach(el => {
        const target    = parseFloat(el.getAttribute('data-target') || 0);
        const isDecimal = el.getAttribute('data-decimal') === '1';
        const suffix    = el.getAttribute('data-suffix') || '';
        const duration  = 1200; // ms
        const start     = performance.now();

        function tick(now) {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutCubic
            const eased    = 1 - Math.pow(1 - progress, 3);
            const current  = target * eased;

            el.textContent = (isDecimal ? current.toFixed(1) : Math.ceil(current)) + suffix;

            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = (isDecimal ? target.toFixed(1) : target) + suffix;
        }

        el.textContent = '0' + suffix;
        requestAnimationFrame(tick);
    });
}


// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function getInitials(name = '') {
    return name.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase() || '??';
}

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function timeAgo(dateString) {
    if (!dateString) return 'N/A';
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff <    60) return 'Vừa xong';
    if (diff <  3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}

function formatDeadline(createdAt) {
    if (!createdAt) return { label: 'N/A', urgent: false };
    const hoursOld = (Date.now() - new Date(createdAt)) / 3600000;
    if (hoursOld > 22) return { label: 'Quá hạn!',   urgent: true  };
    if (hoursOld > 18) return { label: '< 2h left',   urgent: true  };
    if (hoursOld > 12) return { label: 'Today',       urgent: false };
    return                     { label: 'Tomorrow',   urgent: false };
}

function showErrorBanner(msg) {
    const main = document.querySelector('main') || document.body;
    const banner = document.createElement('div');
    banner.className = 'alert alert-danger alert-dismissible m-3';
    banner.role = 'alert';
    banner.innerHTML = `
        <strong>Không thể tải dữ liệu:</strong> ${escapeHtml(msg)}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    main.prepend(banner);
}