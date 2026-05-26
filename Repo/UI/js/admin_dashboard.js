
/**
 * Admin Dashboard — FIXED VERSION
 */

const API_URL = '/PTUD-Web/Repo/?page=get_dashboard_data';

let initialized = false;

function init() {
    if (initialized) return;
    initialized = true;
    loadDashboard();
}

document.addEventListener('appReady', init);
document.addEventListener('DOMContentLoaded', init);


// ======================================================
// FETCH DATA
// ======================================================

async function loadDashboard() {
    try {
        const res = await fetch(API_URL);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        console.log('[Dashboard API]', data);

        updateKPI(data.kpi || {});
        updateWorkflow(data.workflow_status || {});
        updateQueue(data.approval_queue || []);
        updateActivity(data.recent_activity || []);

        runCounterAnimation();

    } catch (err) {
        console.error(err);
        showErrorBanner(err.message);
    }
}


// ======================================================
// KPI
// ======================================================

function updateKPI(kpi) {

    const cards = document.querySelectorAll('.row.g-4.mb-5 > div');

    const values = [
        kpi.total_articles ?? 0,
        kpi.pending_approvals ?? 0,
        kpi.active_users ?? 0,
        kpi.avg_approval_time_min ?? 0
    ];

    cards.forEach((card, index) => {

        const counter = card.querySelector('.counter');

        if (!counter) return;

        counter.setAttribute('data-target', values[index]);
    });
}


// ======================================================
// WORKFLOW
// ======================================================

function updateWorkflow(workflow) {

    // =========================
    // CENTER LIVE NUMBER
    // =========================

    const liveCounter =
    document.querySelector('#live-counter');

    if (liveCounter) {
        liveCounter.setAttribute(
            'data-target',
            workflow.live_count ?? 0
        );
    }

    // =========================
    // LEGEND COUNTERS
    // =========================

    const workflowBox = document.querySelector(
        '.col-12.col-md-7'
    );

    if (workflowBox) {

        const counters = workflowBox.querySelectorAll('.counter');

        const values = [
            workflow.published ?? 0,
            workflow.draft ?? 0,
            workflow.archived ?? 0,
            workflow.pending ?? 0
        ];

        counters.forEach((counter, index) => {

            counter.setAttribute(
                'data-target',
                values[index]
            );
        });
    }

    // =========================
    // DONUT CHART
    // =========================

    updateDonut(
        workflow.published ?? 0,
        workflow.draft ?? 0
    );
}


function updateDonut(publishedPct, draftPct) {

    const circumference = 100.53;

    const paths = document.querySelectorAll('.chart-path');

    if (paths.length < 2) return;

    const publishedLength =
        (publishedPct / 100) * circumference;

    const draftLength =
        (draftPct / 100) * circumference;

    // Published arc
    paths[0].setAttribute(
        'stroke-dasharray',
        `${publishedLength} ${circumference}`
    );

    paths[0].setAttribute(
        'stroke-dashoffset',
        `0`
    );

    // Draft arc
    paths[1].setAttribute(
        'stroke-dasharray',
        `${draftLength} ${circumference}`
    );

    paths[1].setAttribute(
        'stroke-dashoffset',
        `${-publishedLength}`
    );
}


// ======================================================
// APPROVAL QUEUE
// ======================================================

function updateQueue(queue) {

    const tbody = document.querySelector(
        '.table-responsive tbody'
    );

    if (!tbody) return;

    if (!queue.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4"
                    class="text-center py-5 text-muted">
                    Không có bài viết chờ duyệt
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = queue.map(item => {

        const title =
            escapeHtml(item.title || '');

        const author =
            escapeHtml(item.author_name || '');

        const category =
            escapeHtml(
                item.primary_category || 'General'
            );

        const initials =
            getInitials(author);

        const deadline =
            formatDeadline(item.created_at);

        return `
            <tr>

                <td class="ps-4">
                    <div class="fw-bold text-truncate"
                        style="max-width:250px;">
                        ${title}
                    </div>

                    <div class="small text-muted">
                        ${category}
                    </div>
                </td>

                <td>
                    <div class="d-flex align-items-center gap-2">

                        <div
                            class="rounded-circle d-flex align-items-center justify-content-center fw-bold small bg-light flex-shrink-0"
                            style="width:28px;height:28px;">
                            ${initials}
                        </div>

                        <span class="small fw-medium text-nowrap">
                            ${author}
                        </span>

                    </div>
                </td>

                <td class="text-center">
                    <span class="badge-pill bg-primary bg-opacity-10 text-primary small">
                        Pending
                    </span>
                </td>

                <td class="text-end pe-4 fw-bold small text-nowrap
                    ${deadline.urgent ? 'text-danger' : 'text-muted'}">

                    ${deadline.label}

                </td>

            </tr>
        `;

    }).join('');
}


// ======================================================
// RECENT ACTIVITY
// ======================================================

const ACTIVITY_CONFIG = {

    article_published: {
        icon: 'publish',
        color: 'var(--bs-primary)',
        title: 'Article Published'
    },

    article_draft: {
        icon: 'edit',
        color: '#615b77',
        title: 'Draft Created'
    },

    article_rejected: {
        icon: 'close',
        color: '#9f403d',
        title: 'Article Rejected'
    },

    comment_added: {
        icon: 'comment',
        color: '#617aae',
        title: 'Comment Added'
    },

    user_registered: {
        icon: 'person_add',
        color: '#536073',
        title: 'New User'
    }
};


function updateActivity(activities) {

    const feed =
        document.querySelector('.activity-feed');

    if (!feed) return;

    if (!activities.length) {

        feed.innerHTML = `
            <div class="text-center text-muted py-5">
                Chưa có hoạt động nào
            </div>
        `;

        return;
    }

    feed.innerHTML = activities.map(item => {

        const cfg =
            ACTIVITY_CONFIG[item.type] || {
                icon: 'info',
                color: '#aaa',
                title: 'Activity'
            };

        return `
            <div class="activity-item">

                <div class="activity-dot"
                    style="background-color:${cfg.color};">

                    <span class="material-symbols-outlined"
                        style="font-size:10px;">
                        ${cfg.icon}
                    </span>

                </div>

                <div>

                    <div class="fw-bold small mb-1">
                        ${cfg.title}
                    </div>

                    <p class="small text-muted mb-1">

                        ${escapeHtml(item.actor || '')}

                        -

                        ${escapeHtml(item.target || '')}

                    </p>

                    <div class="text-uppercase text-muted fw-black"
                        style="font-size:0.6rem;opacity:.5;">

                        ${timeAgo(item.created_at)}

                    </div>

                </div>

            </div>
        `;

    }).join('');
}


// ======================================================
// COUNTER ANIMATION
// ======================================================

function runCounterAnimation() {

    const counters =
        document.querySelectorAll('.counter');

    counters.forEach(counter => {

        const target =
            parseFloat(
                counter.getAttribute('data-target')
            ) || 0;

        const isDecimal =
            counter.hasAttribute('data-decimal');

        const suffix =
            counter.getAttribute('data-suffix') || '';

        const duration = 1200;

        const startTime = performance.now();

        function animate(currentTime) {

            const elapsed =
                currentTime - startTime;

            const progress =
                Math.min(elapsed / duration, 1);

            const eased =
                1 - Math.pow(1 - progress, 3);

            const value =
                target * eased;

            counter.textContent =
                (
                    isDecimal
                        ? value.toFixed(1)
                        : Math.floor(value)
                ) + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                counter.textContent =
                    (
                        isDecimal
                            ? target.toFixed(1)
                            : target
                    ) + suffix;
            }
        }

        requestAnimationFrame(animate);
    });
}


// ======================================================
// HELPERS
// ======================================================

function getInitials(name = '') {

    return name
        .split(' ')
        .map(n => n[0] || '')
        .join('')
        .substring(0, 2)
        .toUpperCase();
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

    const diff =
        Math.floor(
            (Date.now() - new Date(dateString))
            / 1000
        );

    if (diff < 60)
        return 'Vừa xong';

    if (diff < 3600)
        return `${Math.floor(diff / 60)} phút trước`;

    if (diff < 86400)
        return `${Math.floor(diff / 3600)} giờ trước`;

    return `${Math.floor(diff / 86400)} ngày trước`;
}


function formatDeadline(createdAt) {

    if (!createdAt) {
        return {
            label: 'N/A',
            urgent: false
        };
    }

    const hours =
        (Date.now() - new Date(createdAt))
        / 3600000;

    if (hours > 22) {
        return {
            label: 'Quá hạn!',
            urgent: true
        };
    }

    if (hours > 18) {
        return {
            label: '< 2h left',
            urgent: true
        };
    }

    if (hours > 12) {
        return {
            label: 'Today',
            urgent: false
        };
    }

    return {
        label: 'Tomorrow',
        urgent: false
    };
}


function showErrorBanner(msg) {

    const main =
        document.querySelector('main');

    if (!main) return;

    const div =
        document.createElement('div');

    div.className =
        'alert alert-danger m-3';

    div.innerHTML = `
        <strong>Lỗi:</strong>
        ${escapeHtml(msg)}
    `;

    main.prepend(div);
}

