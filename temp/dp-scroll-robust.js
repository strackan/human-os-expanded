// ============================================
// SNAP SCROLL SYSTEM - ROBUST CROSS-BROWSER VERSION
// ============================================

(function() {
    'use strict';

    // Wait for Carrd to finish loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100); // Give Carrd a moment
    }

    function init() {
        // Force scroll to top on page load/refresh
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        // ============================================
        // CONFIGURATION
        // ============================================
        const SECTION_POSITIONS = [
            0,      // start
            100,    // challenge
            200,    // traditional-solutions
            300,    // action
            400,    // hi-renubu
            490,    // how-it-works
            590     // contact
        ];

        // ============================================
        // STATE
        // ============================================
        let isScrolling = false;
        let lastScrollTime = 0;
        let currentSectionIndex = 0;
        let viewportHeight = window.innerHeight;

        // Update viewport height on resize (mobile browsers)
        window.addEventListener('resize', function() {
            viewportHeight = window.innerHeight;
        });

        // ============================================
        // SCROLL FUNCTIONS
        // ============================================

        // Function to snap to specific section
        function snapToSection(index) {
            const positionVh = SECTION_POSITIONS[index];
            const targetPosition = Math.round((positionVh / 100) * viewportHeight);

            // Clamp to valid scroll range
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
            const safePosition = Math.min(Math.max(0, targetPosition), maxScroll);

            console.log(`Scrolling to section ${index}: ${positionVh}vh = ${safePosition}px`);

            window.scrollTo({
                top: safePosition,
                behavior: 'smooth'
            });
        }

        // Check if element is interactive
        function isInteractiveElement(element) {
            if (!element) return false;

            const tagName = element.tagName ? element.tagName.toLowerCase() : '';
            const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'form'];

            if (interactiveTags.includes(tagName)) {
                return true;
            }

            if (element.hasAttribute) {
                if (element.hasAttribute('data-modal') ||
                    element.getAttribute('role') === 'button' ||
                    element.getAttribute('onclick')) {
                    return true;
                }
            }

            // Check parents (up to 3 levels)
            let parent = element.parentElement;
            let depth = 0;
            while (parent && depth < 3) {
                const parentTag = parent.tagName ? parent.tagName.toLowerCase() : '';
                if (interactiveTags.includes(parentTag) ||
                    parent.hasAttribute('data-modal') ||
                    parent.getAttribute('role') === 'button') {
                    return true;
                }
                parent = parent.parentElement;
                depth++;
            }

            return false;
        }

        // ============================================
        // EVENT HANDLERS
        // ============================================

        // Prevent default scrolling (unless on interactive elements)
        document.addEventListener('wheel', function(e) {
            if (!isInteractiveElement(e.target)) {
                e.preventDefault();
            }
        }, { passive: false });

        // Handle wheel scroll - triggers keyboard navigation
        document.addEventListener('wheel', function(e) {
            if (isInteractiveElement(e.target)) {
                return;
            }

            const now = Date.now();

            // Debounce
            if (isScrolling || now - lastScrollTime < 200) {
                return;
            }

            // Threshold
            if (Math.abs(e.deltaY) < 25) {
                return;
            }

            lastScrollTime = now;

            // Trigger keyboard handler
            const keyToSimulate = e.deltaY > 0 ? 'ArrowDown' : 'ArrowUp';
            const keyboardEvent = new KeyboardEvent('keydown', {
                key: keyToSimulate,
                code: keyToSimulate,
                keyCode: keyToSimulate === 'ArrowDown' ? 40 : 38,
                which: keyToSimulate === 'ArrowDown' ? 40 : 38,
                bubbles: true,
                cancelable: true
            });

            document.dispatchEvent(keyboardEvent);
        }, { passive: true });

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (isScrolling) return;

            // Don't intercept if in form field
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable) {
                return;
            }

            let handled = false;
            let newIndex = currentSectionIndex;

            if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
                e.preventDefault();
                newIndex = Math.min(SECTION_POSITIONS.length - 1, currentSectionIndex + 1);
                handled = true;
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                newIndex = Math.max(0, currentSectionIndex - 1);
                handled = true;
            }

            if (handled && newIndex !== currentSectionIndex) {
                isScrolling = true;
                currentSectionIndex = newIndex;
                snapToSection(currentSectionIndex);

                setTimeout(() => {
                    isScrolling = false;
                }, 1200); // Longer timeout for reliability
            }
        });

        // ============================================
        // KEYFRAME INJECTION
        // ============================================
        (function() {
            const styleSheets = [...document.styleSheets];
            let keyframesExist = false;

            try {
                for (const sheet of styleSheets) {
                    try {
                        const rules = [...(sheet.cssRules || [])];
                        if (rules.some(rule => rule.name === 'conveyor-infinite')) {
                            keyframesExist = true;
                            break;
                        }
                    } catch (e) {
                        // Cross-origin stylesheet
                    }
                }
            } catch (e) {
                // Fail silently
            }

            if (!keyframesExist) {
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    @keyframes conveyor-infinite {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-305vw); }
                    }
                `;
                document.head.appendChild(style);
                console.log('✅ Keyframes injected');
            }
        })();

        // ============================================
        // CONVEYOR ANIMATION
        // ============================================
        setTimeout(function() {
            const solutionsBody = document.querySelector('#solutions-body .inner');

            if (solutionsBody) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            solutionsBody.style.animation = 'conveyor-infinite 30s linear 3.5s infinite';
                            observer.unobserve(entry.target);
                            console.log('✅ Conveyor animation triggered');
                        }
                    });
                }, {
                    threshold: 0.1
                });

                observer.observe(solutionsBody);
                console.log('✅ Conveyor observer ready');
            }
        }, 500); // Wait for DOM to settle

        console.log('✅ Snap scroll system initialized');
    }
})();
