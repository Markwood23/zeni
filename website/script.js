// ========================================
// Theme Toggle
// ========================================
const themeToggle = document.getElementById('themeToggle');
const themeToggleMobile = document.getElementById('themeToggleMobile');
const html = document.documentElement;

// Get saved theme or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);

function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update mobile toggle icon
    const mobileIcon = document.querySelector('.theme-toggle-mobile .theme-icon');
    if (mobileIcon) {
        mobileIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

themeToggle?.addEventListener('click', toggleTheme);
themeToggleMobile?.addEventListener('click', toggleTheme);

// ========================================
// Mobile Menu Toggle
// ========================================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');

mobileMenuBtn?.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
});

// Close mobile menu when clicking a link
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenu?.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
        mobileMenu?.classList.remove('active');
        mobileMenuBtn?.classList.remove('active');
    }
});

// ========================================
// Smooth Scroll
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ========================================
// Navbar Effects
// ========================================
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        navbar.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = 'none';
    }
});

// ========================================
// Scroll Animations
// ========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.bento-card, .step-card, .ai-card, .download-card').forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(el);
});

// Add animation class styles
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// ========================================
// Console Easter Egg
// ========================================
console.log('%c🚀 Zeni', 'font-size: 24px; font-weight: bold; color: #017DE9;');
console.log('%cSmart Document Workspace for Students', 'font-size: 14px; color: #6B7280;');
console.log('%cInterested in joining our team? Email us at careers@zenigh.online', 'font-size: 12px; color: #9CA3AF;');
