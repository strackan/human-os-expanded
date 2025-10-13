		// Immediately scroll to top
		window.scrollTo(0, 0);
		
		console.log('Script file loaded!');
		
		// Also force on DOMContentLoaded
		document.addEventListener('DOMContentLoaded', function() {
		window.scrollTo(0, 0);
		});
		
		// And on full page load as backup
		window.addEventListener('load', function() {
		window.scrollTo(0, 0);
		});
		
		// ============================================
		// Scrolling Config - Edit this for each project
		// ============================================
		const SCROLL_CONFIG = {
		sections: [
		{ label: 'start', position: '0vh' },
		{ label: 'challenge', position: '100vh' },
		{ label: 'traditional-solutions', position: '200vh' },
		{ label: 'action', position: '300vh' },
		{ label: 'hi-renubu', position: '400vh' },
		{ label: 'how-it-works', position: '490vh' },
		{ label: 'contact', position: '590vh' }
		],
		
		// Optional settings (defaults shown)
		scrollSpeed: 600,
		scrollThreshold: 75,
		debounceDelay: 100,
		positionTolerance: '15vh' // Can also use vh for tolerance
		};
		
		// ============================================
		// AUTOMATIC SCROLL SYSTEM - No editing needed
		// ============================================
		document.addEventListener('DOMContentLoaded', function() {
		const { sections, scrollSpeed, scrollThreshold, debounceDelay, positionTolerance } = SCROLL_CONFIG;
		
		let currentStop = 0;
		let isScrolling = false;
		let lastScrollTime = 0;
		let processedSections = [];
		
		// Convert vh/percentage to pixels
		function convertToPixels(value) {
		if (typeof value === 'number') return value;
		
		if (typeof value === 'string') {
		if (value.includes('vh')) {
		const vh = parseFloat(value);
		return (vh / 100) * window.innerHeight;
		}
		if (value.includes('%')) {
		const percent = parseFloat(value);
		return (percent / 100) * document.documentElement.scrollHeight;
		}
		}
		
		return parseFloat(value) || 0;
		}
		
		// Calculate pixel positions from config
		function calculatePositions() {
		processedSections = sections.map(section => ({
		...section,
		pixelPosition: convertToPixels(section.position)
		}));
		}
		
		// Initial calculation
		calculatePositions();
		
		// Recalculate on window resize
		let resizeTimeout;
		window.addEventListener('resize', () => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
		calculatePositions();
		if (!isScrolling) {
		currentStop = getCurrentStop();
		}
		}, 250);
		});
		
		// Check if element is interactive
		function isInteractiveElement(element) {
		if (!element) return false;
		
		const interactiveSelectors = [
		'button', 'a', 'input', 'select', 'textarea',
		'[data-modal]', '[role="button"]', '.button',
		'[data-scroll-to]'
		];
		
		for (const selector of interactiveSelectors) {
		if (element.matches && element.matches(selector)) return true;
		}
		
		let parent = element.parentElement;
		while (parent && parent !== document.body) {
		for (const selector of interactiveSelectors) {
		if (parent.matches && parent.matches(selector)) return true;
		}
		parent = parent.parentElement;
		}
		
		return false;
		}
		
		// Smooth scroll to position
		function scrollToPosition(position) {
		if (isScrolling) return;
		
		isScrolling = true;
		lastScrollTime = Date.now();

		// Clamp position to valid scroll range
		const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
		const safePosition = Math.min(Math.max(0, position), maxScroll);

		window.scrollTo({
		top: safePosition,
		behavior: 'smooth'
		});
		
		setTimeout(() => {
		isScrolling = false;
		}, scrollSpeed);
		}
		
		// Get current section based on scroll position
		function getCurrentStop() {
		const scrollY = window.scrollY;
		const tolerance = convertToPixels(positionTolerance);
		
		for (let i = processedSections.length - 1; i >= 0; i--) {
		if (scrollY >= processedSections[i].pixelPosition - tolerance) {
		return i;
		}
		}
		return 0;
		}
		
		// Navigate to next/previous section
		function scrollToNextSection() {
		if (currentStop < processedSections.length - 1) {
		currentStop++;
		scrollToPosition(processedSections[currentStop].pixelPosition);
		}
		}
		
		function scrollToPreviousSection() {
		if (currentStop > 0) {
		currentStop--;
		scrollToPosition(processedSections[currentStop].pixelPosition);
		}
		}
		
		// Scroll to specific labeled section
		function scrollToSection(label) {
		const sectionIndex = processedSections.findIndex(s => s.label === label);
		if (sectionIndex !== -1) {
		currentStop = sectionIndex;
		scrollToPosition(processedSections[sectionIndex].pixelPosition);
		} else {
		console.warn(`Scroll section "${label}" not found`);
		}
		}
		
		// Wheel scroll handler
		function handleWheelScroll(e) {
		if (isInteractiveElement(e.target)) return;
		if (isScrolling) {
		e.preventDefault();
		return;
		}
		
		const now = Date.now();
		if (now - lastScrollTime < debounceDelay) return;
		
		currentStop = getCurrentStop();
		const delta = e.deltaY;
		const isSignificantScroll = Math.abs(delta) > scrollThreshold;
		
		if (isSignificantScroll) {
		e.preventDefault();
		e.stopPropagation();
		
		if (delta > 0) {
		scrollToNextSection();
		} else {
		scrollToPreviousSection();
		}
		}
		}
		
		// Keyboard navigation
		function handleKeyNavigation(e) {
		if (isScrolling) return;
		
		if (e.target.tagName === 'INPUT' ||
		e.target.tagName === 'TEXTAREA' ||
		e.target.isContentEditable) {
		return;
		}
		
		switch(e.key) {
		case 'ArrowDown':
		case 'PageDown':
		case ' ':
		e.preventDefault();
		scrollToNextSection();
		break;
		case 'ArrowUp':
		case 'PageUp':
		e.preventDefault();
		scrollToPreviousSection();
		break;
		}
		}
		
		// ============================================
		// AUTO-WIRE ALL SCROLL TRIGGERS
		// ============================================
		
		// Wire up any element with data-scroll-to="label"
		document.querySelectorAll('[data-scroll-to]').forEach(element => {
		const targetLabel = element.getAttribute('data-scroll-to');
		
		element.addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		scrollToSection(targetLabel);
		});
		
		element.style.cursor = 'pointer';
		
		if (element.tagName === 'A' && !element.getAttribute('href')) {
		element.setAttribute('href', 'javascript:void(0)');
		}
		});
		
		// Auto-detect and wire up down arrows to scroll to NEXT section
		const downArrowSelectors = [
		'.down-arrow', '.scroll-down', '.scroll-indicator',
		'[data-scroll="down"]', '.fa-chevron-down',
		'.fa-arrow-down', '.arrow-down', '[data-scroll="next"]'
		];
		
		downArrowSelectors.forEach(selector => {
		document.querySelectorAll(selector).forEach(arrow => {
		if (arrow.hasAttribute('data-scroll-to') ||
		arrow.hasAttribute('data-modal') ||
		arrow.closest('[data-modal]')) {
		return;
		}
		
		arrow.addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		scrollToNextSection();
		});
		
		arrow.style.cursor = 'pointer';
		arrow.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
		
		arrow.addEventListener('mouseenter', function() {
		this.style.transform = 'translateY(3px)';
		this.style.opacity = '0.7';
		});
		
		arrow.addEventListener('mouseleave', function() {
		this.style.transform = 'translateY(0)';
		this.style.opacity = '1';
		});
		});
		});
		
		// Generic down arrow detection (fallback)
		if (document.querySelectorAll(downArrowSelectors.join(',')).length === 0) {
		const potentialArrows = document.querySelectorAll('*');
		for (const element of potentialArrows) {
		if (element.hasAttribute('data-scroll-to') ||
		element.hasAttribute('data-modal') ||
		element.closest('[data-modal]')) {
		continue;
		}
		
		const text = element.textContent?.trim() || '';
		const innerHTML = element.innerHTML || '';
		
		if ((text === '↓' || text === '⬇' || text === '▼' ||
		innerHTML.includes('chevron') || innerHTML.includes('arrow-down')) &&
		element.children.length <= 2 && text.length < 50) {
		
		element.addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		scrollToNextSection();
		});
		
		element.style.cursor = 'pointer';
		element.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
		
		element.addEventListener('mouseenter', function() {
		this.style.transform = 'translateY(3px)';
		this.style.opacity = '0.7';
		});
		
		element.addEventListener('mouseleave', function() {
		this.style.transform = 'translateY(0)';
		this.style.opacity = '1';
		});
		
		if (element.tagName === 'A') {
		element.setAttribute('href', 'javascript:void(0)');
		}
		
		break;
		}
		}
		}
		
		// Event listeners
		document.addEventListener('wheel', handleWheelScroll, { passive: false });
		document.addEventListener('keydown', handleKeyNavigation);
		
		// Update current stop on manual scroll
		let scrollUpdateTimeout;
		window.addEventListener('scroll', () => {
		clearTimeout(scrollUpdateTimeout);
		scrollUpdateTimeout = setTimeout(() => {
		if (!isScrolling) {
		currentStop = getCurrentStop();
		}
		}, debounceDelay);
		});
		
		// Expose API for manual control
		window.scrollToSection = scrollToSection;
		
		// Add console helper for scrolling to vh/px positions
		window.scrollToVh = function(vh) {
		const pixels = (vh / 100) * window.innerHeight;
		window.scrollTo({
		top: pixels,
		behavior: 'smooth'
		});
		};
		
		window.scrollToPx = function(px) {
		window.scrollTo({
		top: px,
		behavior: 'smooth'
		});
		};
		
		// ============================================
		// CONVEYOR ANIMATION TRIGGER
		// ============================================
		const solutionsBody = document.querySelector('#solutions-body .inner');
		
		if (solutionsBody) {
		const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
		if (entry.isIntersecting) {
		// Element is visible, add animations
		solutionsBody.style.animation = 'fadeIn 1s ease-in forwards, conveyor-infinite 30s linear 3.5s infinite';
		
		// Stop observing after first trigger
		observer.unobserve(entry.target);
		}
		});
		}, {
		threshold: 0.1 // Trigger when 10% visible
		});
		
		// Start observing
		observer.observe(solutionsBody);
		}
		
		console.log('Conveyor animation observer initialized');
		
		console.log(`Scroll system initialized with ${processedSections.length} sections:`,
		processedSections.map(s => `${s.label} (${s.pixelPosition}px)`).join(', '));
		});
		