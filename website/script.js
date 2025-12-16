// ========================================
// Theme Toggle
// ========================================
const themeToggle = document.getElementById('themeToggle');
const themeToggleMobile = document.getElementById('themeToggleMobile');
const html = document.documentElement;

// Get saved theme or default to light (modern preference)
const savedTheme = localStorage.getItem('theme') || 'light';
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

// ========================================
// Convert Format Animation
// ========================================
const formatConversions = [
    { from: 'PDF', fromClass: 'format-pdf', to: 'IMG', toClass: 'format-img' },
    { from: 'Word', fromClass: 'format-word', to: 'PDF', toClass: 'format-pdf' },
    { from: 'JPG', fromClass: 'format-jpg', to: 'PNG', toClass: 'format-png' },
    { from: 'Excel', fromClass: 'format-excel', to: 'PDF', toClass: 'format-pdf' },
    { from: 'PNG', fromClass: 'format-png', to: 'JPG', toClass: 'format-jpg' },
    { from: 'PDF', fromClass: 'format-pdf', to: 'Word', toClass: 'format-word' }
];

let currentFormatIndex = 0;

function cycleFormats() {
    const fromBadge = document.querySelector('.format-from');
    const toBadge = document.querySelector('.format-to');
    
    if (!fromBadge || !toBadge) return;
    
    // Fade out
    fromBadge.style.opacity = '0';
    toBadge.style.opacity = '0';
    fromBadge.style.transform = 'scale(0.8)';
    toBadge.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
        currentFormatIndex = (currentFormatIndex + 1) % formatConversions.length;
        const conversion = formatConversions[currentFormatIndex];
        
        // Update text
        fromBadge.textContent = conversion.from;
        toBadge.textContent = conversion.to;
        
        // Update colors - remove old classes and add new ones
        fromBadge.className = 'file-badge format-from ' + conversion.fromClass;
        toBadge.className = 'file-badge alt format-to ' + conversion.toClass;
        
        // Fade in
        fromBadge.style.opacity = '1';
        toBadge.style.opacity = '1';
        fromBadge.style.transform = 'scale(1)';
        toBadge.style.transform = 'scale(1)';
    }, 400);
}

// Add transition styles to format badges
const formatBadges = document.querySelectorAll('.format-from, .format-to');
formatBadges.forEach(badge => {
    badge.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
});

// Initialize first format colors
const initFromBadge = document.querySelector('.format-from');
const initToBadge = document.querySelector('.format-to');
if (initFromBadge && initToBadge) {
    initFromBadge.classList.add('format-pdf');
    initToBadge.classList.add('format-img');
}

// Cycle formats every 4 seconds
setInterval(cycleFormats, 4000);


// ========================================
// Stats Counter Animation
// ========================================
function animateCounter(element, target, isDecimal = false) {
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        if (isDecimal) {
            element.textContent = current.toFixed(1);
        } else if (target >= 1000000) {
            element.textContent = (current / 1000000).toFixed(1) + 'M';
        } else if (target >= 1000) {
            element.textContent = Math.floor(current / 1000) + 'K';
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Observe stats section for animation trigger
const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-number').forEach(stat => {
                    const target = parseFloat(stat.dataset.target);
                    const isDecimal = stat.dataset.decimal === 'true';
                    animateCounter(stat, target, isDecimal);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    statsObserver.observe(statsSection);
}

// ========================================
// FAQ Accordion
// ========================================
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question?.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(otherItem => {
            otherItem.classList.remove('active');
        });
        
        // Toggle current item
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// Share animation is inline in HTML
