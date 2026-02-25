// Paste this into your browser console to track VH position

function showVH() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const currentVH = (scrollY / vh) * 100;

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Current Position:
   ${Math.round(currentVH)}vh (${scrollY}px)

📐 Viewport: ${vh}px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    return {
        vh: Math.round(currentVH),
        exactVh: currentVH.toFixed(2),
        pixels: scrollY,
        viewportHeight: vh
    };
}

// Auto-update on scroll
let tracking = false;

function startTracking() {
    if (tracking) {
        console.log('Already tracking!');
        return;
    }

    tracking = true;
    console.log('🟢 VH Tracker started! Scroll to see updates...');

    window.addEventListener('scroll', function trackScroll() {
        const scrollY = window.scrollY;
        const vh = window.innerHeight;
        const currentVH = (scrollY / vh) * 100;

        console.log(`📍 ${Math.round(currentVH)}vh (${scrollY}px)`);
    });
}

function stopTracking() {
    tracking = false;
    console.log('🔴 VH Tracker stopped');
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VH POSITION TRACKER

Commands:
  showVH()         - Show current position once
  startTracking()  - Show position continuously as you scroll
  stopTracking()   - Stop continuous tracking

Try: showVH()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Make functions available globally
window.showVH = showVH;
window.startTracking = startTracking;
window.stopTracking = stopTracking;

// Show current position immediately
showVH();
