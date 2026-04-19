  document.addEventListener('DOMContentLoaded', () => {
        // 1. Counter Animation
        const animateCounters = () => {
            const counters = document.querySelectorAll('.counter');
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const decimal = +counter.getAttribute('data-decimal') || 0;
                const suffix = counter.getAttribute('data-suffix') || '';
                const duration = 2000; // ms
                const startTime = performance.now();
                
                const updateCounter = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Ease out cubic
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    
                    const currentVal = (easeProgress * target).toFixed(decimal);
                    
                    // Format with commas if large number
                    const formattedVal = parseFloat(currentVal).toLocaleString(undefined, {
                        minimumFractionDigits: decimal,
                        maximumFractionDigits: decimal
                    });
                    
                    counter.innerText = formattedVal + suffix;
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    }
                };
                
                requestAnimationFrame(updateCounter);
            });
        };

        // 2. Sidebar Toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const body = document.body;
        
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.innerWidth > 991.98) {
                body.classList.toggle('sidebar-collapsed');
            } else {
                document.getElementById('sidebar').classList.toggle('show');
            }
        });

        // 3. Dynamic Chart Animation
        const initChart = () => {
            const paths = document.querySelectorAll('.chart-path');
            paths.forEach(path => {
                const dashArray = path.getAttribute('stroke-dasharray').split(',')[0];
                // Reset offset to match dashArray (hidden) then animate to 0 or appropriate offset
                const offset = 100 - parseInt(dashArray);
                setTimeout(() => {
                    path.style.strokeDashoffset = offset;
                }, 100);
            });
        };

        // 4. Interaction Feedback
        const initFeedback = () => {
            const interactives = document.querySelectorAll('.btn, .nav-link, .fab, .card, .table-hover tbody tr');
            interactives.forEach(el => {
                el.addEventListener('click', function(e) {
                    // Simple console feedback for demo
                    console.log('Interaction:', this.innerText || 'Element clicked');
                    
                    // Ripple effect could be added here if needed
                });
            });
        };

        // Initialize All
        animateCounters();
        initChart();
        initFeedback();

        // Mobile sidebar close on click outside
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth <= 991.98 && sidebar.classList.contains('show') && !sidebar.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        });

        // Close mobile sidebar on link click
        document.querySelectorAll('#sidebar .nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 991.98) {
                    document.getElementById('sidebar').classList.remove('show');
                }
            });
        });
    });