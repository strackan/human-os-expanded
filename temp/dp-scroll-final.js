// ============================================
// SNAP SCROLL SYSTEM - PRODUCTION VERSION
// ============================================

(function() {
    'use strict';

    // Force scroll to top on page load/refresh
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // ============================================
    // CONFIGURATION - Edit section positions here
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
    // SCROLL SYSTEM
    // ============================================
    let isScrolling = false;
    let lastScrollTime = 0;
    let currentSectionIndex = 0;

    // Function to snap to specific section
    function snapToSection(index) {
        const vh = window.innerHeight;
        const positionVh = SECTION_POSITIONS[index];
        const targetPosition = Math.round((positionVh / 100) * vh);

        // Clamp to valid scroll range
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const safePosition = Math.min(targetPosition, maxScroll);

        window.scrollTo({
            top: safePosition,
            behavior: 'smooth'
        });
    }

    // Check if element is interactive (button, link, input, etc.)
    function isInteractiveElement(element) {
        if (!element) return false;

        const tagName = element.tagName ? element.tagName.toLowerCase() : '';
        const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];

        if (interactiveTags.includes(tagName)) {
            return true;
        }

        if (element.hasAttribute && (element.hasAttribute('data-modal') ||
            element.getAttribute('role') === 'button')) {
            return true;
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

    // Prevent default scrolling (unless on interactive elements)
    document.addEventListener('wheel', function(e) {
        if (!isInteractiveElement(e.target)) {
            e.preventDefault();
        }
    }, { passive: false });

    // Handle wheel scroll intent - by triggering keyboard events
    document.addEventListener('wheel', function(e) {
        if (isInteractiveElement(e.target)) {
            return;
        }

        const now = Date.now();

        if (isScrolling || now - lastScrollTime < 150) {
            return;
        }

        if (Math.abs(e.deltaY) < 30) {
            return;
        }

        lastScrollTime = now;

        // Trigger the keyboard handler directly by dispatching a keyboard event
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

        if (e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.isContentEditable) {
            return;
        }

        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault();
            isScrolling = true;

            const targetSection = Math.min(SECTION_POSITIONS.length - 1, currentSectionIndex + 1);
            currentSectionIndex = targetSection;
            snapToSection(currentSectionIndex);

            setTimeout(() => { isScrolling = false; }, 1000);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            isScrolling = true;

            const targetSection = Math.max(0, currentSectionIndex - 1);
            currentSectionIndex = targetSection;
            snapToSection(currentSectionIndex);

            setTimeout(() => { isScrolling = false; }, 1000);
        }
    });

    console.log('✅ Snap scroll system initialized');

    // ============================================
    // KEYFRAME INJECTION
    // ============================================
    (function() {
        const styleSheets = [...document.styleSheets];
        let keyframesExist = false;

        try {
            for (const sheet of styleSheets) {
                const rules = [...sheet.cssRules || []];
                if (rules.some(rule => rule.name === 'conveyor-infinite')) {
                    keyframesExist = true;
                    break;
                }
            }
        } catch (e) {
            // Cross-origin stylesheet, can't check
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
    // CONVEYOR ANIMATION TRIGGER
    // ============================================
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
        console.log('✅ Conveyor animation observer initialized');
    }

})();
