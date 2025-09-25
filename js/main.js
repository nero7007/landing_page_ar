/* ===========================
   ملف JavaScript الرئيسي
   Main JavaScript File
   =========================== */

(function() {
    'use strict';

    /* Performance and Compatibility Check */
    if (typeof window === 'undefined' || !document) {
        console.warn('Environment not supported');
        return;
    }

    /* ===========================
       1. متغيرات عامة
       Global Variables
       =========================== */
    const app = {
        // عناصر DOM الأساسية
        elements: {
            html: document.documentElement,
            body: document.body,
            navbar: document.querySelector('.navbar'),
            loadingScreen: document.getElementById('loading-screen'),
            backToTop: document.getElementById('backToTop'),
            themeToggle: document.getElementById('theme-toggle'),
            languageToggle: document.getElementById('language-toggle'),
            contactForm: document.getElementById('contactForm'),
            portfolioFilters: document.querySelectorAll('.portfolio-filters .btn'),
            portfolioItems: document.querySelectorAll('.portfolio-item')
        },

        // حالة التطبيق
        state: {
            currentLanguage: 'ar',
            currentTheme: 'light',
            isScrolled: false,
            isLoading: true,
            portfolioFilter: 'all'
        },

        // إعدادات
        config: {
            scrollOffset: 100,
            loadingDuration: 1500,
            animationDuration: 300,
            debounceDelay: 100,
            // تحسينات الأداء
            intersectionThreshold: 0.1,
            lazyLoadOffset: '50px',
            // إعدادات التوافق
            supportPassiveListeners: false,
            supportIntersectionObserver: false,
            supportRequestIdleCallback: false
        }
    };

    /* ===========================
       1.5. فحص التوافق
       Compatibility Check
       =========================== */
    const compatibility = {
        init: function() {
            // فحص دعم المستمعات السلبية
            try {
                const opts = Object.defineProperty({}, 'passive', {
                    get: function() {
                        app.config.supportPassiveListeners = true;
                        return true;
                    }
                });
                window.addEventListener('testPassive', null, opts);
                window.removeEventListener('testPassive', null, opts);
            } catch (e) {}

            // فحص دعم Intersection Observer
            app.config.supportIntersectionObserver = 'IntersectionObserver' in window;

            // فحص دعم requestIdleCallback
            app.config.supportRequestIdleCallback = 'requestIdleCallback' in window;

            console.log('🔍 Compatibility Check:', {
                passiveListeners: app.config.supportPassiveListeners,
                intersectionObserver: app.config.supportIntersectionObserver,
                requestIdleCallback: app.config.supportRequestIdleCallback
            });
        }
    };

    /* ===========================
       2. وظائف المساعدة
       Utility Functions
       =========================== */
    const utils = {
        // تأخير التنفيذ (Debounce) مع تحسينات الأداء
        debounce: function(func, wait, options = {}) {
            let timeout;
            let lastCallTime;
            const { leading = false, trailing = true, maxWait } = options;
            
            return function executedFunction(...args) {
                const now = Date.now();
                const isInvoking = leading && !timeout;
                
                if (maxWait && lastCallTime && (now - lastCallTime >= maxWait)) {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }
                    lastCallTime = now;
                    return func.apply(this, args);
                }
                
                const later = () => {
                    timeout = null;
                    lastCallTime = now;
                    if (trailing && !isInvoking) {
                        return func.apply(this, args);
                    }
                };
                
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                
                if (isInvoking) {
                    lastCallTime = now;
                    return func.apply(this, args);
                }
            };
        },

        // تنفيذ مؤجل للمهام غير الحرجة
        scheduleTask: function(task, priority = 'normal') {
            if (app.config.supportRequestIdleCallback && priority === 'low') {
                requestIdleCallback(task, { timeout: 5000 });
            } else if (priority === 'high') {
                task();
            } else {
                setTimeout(task, 0);
            }
        },

        // تحريك سلس للعنصر
        smoothScrollTo: function(element, duration = 1000) {
            const targetPosition = element.offsetTop - 80;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            let startTime = null;

            function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation.bind(this));
            }

            animation.bind(this);
            requestAnimationFrame(animation.bind(this));
        },

        // دالة تسهيل الحركة
        easeInOutQuad: function(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        },

        // إضافة فئة CSS مع تأخير
        addClassWithDelay: function(element, className, delay = 0) {
            setTimeout(() => {
                if (element) element.classList.add(className);
            }, delay);
        },

        // إزالة فئة CSS مع تأخير
        removeClassWithDelay: function(element, className, delay = 0) {
            setTimeout(() => {
                if (element) element.classList.remove(className);
            }, delay);
        },

        // فحص إذا كان العنصر ظاهر في الشاشة (محسن)
        isElementInViewport: function(element, threshold = 0) {
            if (!element || !element.getBoundingClientRect) return false;
            
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const windowWidth = window.innerWidth || document.documentElement.clientWidth;
            
            return (
                rect.top >= -threshold &&
                rect.left >= -threshold &&
                rect.bottom <= windowHeight + threshold &&
                rect.right <= windowWidth + threshold &&
                rect.width > 0 &&
                rect.height > 0
            );
        },

        // تحسين الذاكرة بإزالة المستمعات
        addEventListenerSafe: function(element, event, handler, options = {}) {
            if (!element || !element.addEventListener) return null;
            
            const safeOptions = app.config.supportPassiveListeners && options.passive ? 
                { ...options, passive: true } : options;
                
            element.addEventListener(event, handler, safeOptions);
            
            // إرجاع دالة للإزالة
            return () => {
                element.removeEventListener(event, handler, safeOptions);
            };
        },

        // تحميل الصور بكفاءة
        lazyLoadImage: function(img, src) {
            return new Promise((resolve, reject) => {
                if (!img || !src) {
                    reject(new Error('Invalid image or source'));
                    return;
                }
                
                const tempImg = new Image();
                tempImg.onload = () => {
                    img.src = src;
                    img.classList.add('loaded');
                    resolve(img);
                };
                tempImg.onerror = reject;
                tempImg.src = src;
            });
        },

        // تحديث عناوين URL دون إعادة تحميل
        updateURL: function(hash) {
            if (history.pushState) {
                history.pushState(null, null, hash);
            } else {
                location.hash = hash;
            }
        }
    };

    /* ===========================
       3. إدارة التحميل
       Loading Management
       =========================== */
    const loadingManager = {
        init: function() {
            this.showLoading();
            this.preloadCriticalResources();
            this.setupPerformanceMonitoring();
        },

        showLoading: function() {
            if (app.elements.loadingScreen) {
                app.elements.loadingScreen.style.display = 'flex';
                app.elements.body.classList.add('no-scroll');
            }
        },

        hideLoading: function() {
            setTimeout(() => {
                if (app.elements.loadingScreen) {
                    app.elements.loadingScreen.classList.add('fade-out');
                    
                    setTimeout(() => {
                        app.elements.loadingScreen.style.display = 'none';
                        app.elements.body.classList.remove('no-scroll');
                        app.state.isLoading = false;
                        
                        // تشغيل أنيميشن دخول الصفحة
                        this.triggerEntranceAnimations();
                    }, 500);
                }
            }, app.config.loadingDuration);
        },

        preloadCriticalResources: function() {
            const criticalResources = [
                // الخطوط الأساسية
                'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap',
                'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
            ];

            const nonCriticalResources = [
                // المكتبات غير الحرجة
                'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js'
            ];

            // تحميل الموارد الحرجة أولاً
            Promise.allSettled(
                criticalResources.map(resource => this.loadResource(resource))
            ).then((results) => {
                const failedCritical = results.filter(result => result.status === 'rejected');
                if (failedCritical.length > 0) {
                    console.warn('⚠️ Some critical resources failed to load:', failedCritical);
                }
                
                this.hideLoading();
                
                // تحميل الموارد غير الحرجة في الخلفية
                utils.scheduleTask(() => {
                    Promise.allSettled(
                        nonCriticalResources.map(resource => this.loadResource(resource))
                    ).then(() => {
                        console.log('✅ All resources loaded successfully');
                    });
                }, 'low');
            });
        },

        setupPerformanceMonitoring: function() {
            // مراقبة أداء التحميل
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        list.getEntries().forEach((entry) => {
                            if (entry.entryType === 'navigation') {
                                console.log('📈 Page Load Performance:', {
                                    'DOM Content Loaded': entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart + 'ms',
                                    'Load Complete': entry.loadEventEnd - entry.loadEventStart + 'ms',
                                    'Total Time': entry.loadEventEnd - entry.navigationStart + 'ms'
                                });
                            }
                        });
                    });
                    observer.observe({ type: 'navigation', buffered: true });
                } catch (e) {
                    console.warn('Performance monitoring not available');
                }
            }
        },

        loadResource: function(url) {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Resource timeout: ${url}`));
                }, 10000); // 10 ثوانٍ timeout

                const cleanup = () => {
                    clearTimeout(timeout);
                };

                if (url.includes('.css') || url.includes('fonts.googleapis.com')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = url;
                    link.onload = () => {
                        cleanup();
                        resolve();
                    };
                    link.onerror = () => {
                        cleanup();
                        reject(new Error(`Failed to load CSS: ${url}`));
                    };
                    document.head.appendChild(link);
                } else {
                    const script = document.createElement('script');
                    script.src = url;
                    script.async = true;
                    script.onload = () => {
                        cleanup();
                        resolve();
                    };
                    script.onerror = () => {
                        cleanup();
                        reject(new Error(`Failed to load script: ${url}`));
                    };
                    document.head.appendChild(script);
                }
            });
        },

        triggerEntranceAnimations: function() {
            // تشغيل مكتبة AOS إذا كانت متاحة
            utils.scheduleTask(() => {
                if (typeof AOS !== 'undefined') {
                    try {
                        AOS.init({
                            duration: 1000,
                            once: true,
                            offset: 50,
                            disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                        });
                        console.log('✨ AOS animations initialized');
                    } catch (e) {
                        console.warn('AOS initialization failed:', e);
                    }
                }
            }, 'low');

            // تشغيل أنيميشن مخصص للعناصر
            const animatedElements = document.querySelectorAll('[data-animate]');
            if (animatedElements.length > 0) {
                utils.scheduleTask(() => {
                    animatedElements.forEach((element, index) => {
                        setTimeout(() => {
                            if (element && element.classList) {
                                element.classList.add('animate-in');
                            }
                        }, index * 50); // تقليل التأخير للأداء
                    });
                }, 'normal');
            }
        }
    };

    /* ===========================
       4. إدارة التنقل
       Navigation Management
       =========================== */
    const navigationManager = {
        // متغيرات خاصة
        scrollListeners: [],
        
        init: function() {
            this.bindEvents();
            this.updateActiveLink();
            this.handleScrollEffect();
            this.setupIntersectionObserver();
        },

        bindEvents: function() {
            // معالج التمرير
            window.addEventListener('scroll', utils.debounce(() => {
                this.handleScrollEffect();
                this.updateActiveLink();
                backToTopManager.toggle();
            }, app.config.debounceDelay));

            // معالج النقر على الروابط
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.smoothScrollToSection(link.getAttribute('href'));
                });
            });

            // معالج إغلاق القائمة المحمولة عند النقر على رابط
            document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    
                    if (navbarToggler && !navbarToggler.classList.contains('collapsed')) {
                        navbarToggler.click();
                    }
                });
            });
            
            // معالجة أخطاء JavaScript
            utils.addEventListenerSafe(window, 'error', (e) => {
                console.error('❌ JavaScript Error:', e.error);
            });
            
            utils.addEventListenerSafe(window, 'unhandledrejection', (e) => {
                console.error('❌ Unhandled Promise Rejection:', e.reason);
            });
        },
        
        setupIntersectionObserver: function() {
            if (!app.config.supportIntersectionObserver) {
                console.warn('⚠️ Intersection Observer not supported, using fallback');
                return;
            }
            
            const observerOptions = {
                root: null,
                rootMargin: '-20% 0px -20% 0px',
                threshold: [0.1, 0.5, 0.9]
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        this.setActiveNavLink(entry.target.id);
                    }
                });
            }, observerOptions);
            
            // مراقبة جميع الأقسام
            document.querySelectorAll('section[id]').forEach(section => {
                observer.observe(section);
            });
        },
        
        setActiveNavLink: function(sectionId) {
            if (!sectionId) return;
            
            // إزالة جميع الفئات النشطة
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // إضافة الفئة النشطة للرابط المناسب
            const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        },
        
        destroy: function() {
            // تنظيف المستمعات
            this.scrollListeners.forEach(removeListener => {
                if (typeof removeListener === 'function') {
                    removeListener();
                }
            });
            this.scrollListeners = [];
        },

        handleScrollEffect: function() {
            const scrollY = window.scrollY;
            const shouldAddScrolled = scrollY > app.config.scrollOffset;

            if (shouldAddScrolled !== app.state.isScrolled) {
                app.state.isScrolled = shouldAddScrolled;
                
                if (app.elements.navbar) {
                    if (shouldAddScrolled) {
                        app.elements.navbar.classList.add('scrolled');
                    } else {
                        app.elements.navbar.classList.remove('scrolled');
                    }
                }
            }
        },

        updateActiveLink: function() {
            const sections = document.querySelectorAll('section[id]');
            let currentSectionId = '';

            sections.forEach(section => {
                const sectionTop = section.offsetTop - 150;
                const sectionHeight = section.offsetHeight;
                
                if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                    currentSectionId = section.getAttribute('id');
                }
            });

            // تحديث الروابط النشطة
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        },

        smoothScrollToSection: function(target) {
            const targetElement = document.querySelector(target);
            if (targetElement) {
                utils.smoothScrollTo(targetElement);
                utils.updateURL(target);
            }
        }
    };

    /* ===========================
       5. إدارة زر العودة للأعلى
       Back to Top Manager
       =========================== */
    const backToTopManager = {
        init: function() {
            if (app.elements.backToTop) {
                app.elements.backToTop.addEventListener('click', () => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });
            }
        },

        toggle: function() {
            if (app.elements.backToTop) {
                const shouldShow = window.scrollY > 300;
                
                if (shouldShow) {
                    app.elements.backToTop.classList.add('show');
                } else {
                    app.elements.backToTop.classList.remove('show');
                }
            }
        }
    };

    /* ===========================
       6. إدارة المعرض (Portfolio)
       Portfolio Manager
       =========================== */
    const portfolioManager = {
        init: function() {
            this.bindFilterEvents();
            this.showItems('all');
        },

        bindFilterEvents: function() {
            app.elements.portfolioFilters.forEach(filter => {
                filter.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const filterValue = filter.getAttribute('data-filter');
                    
                    // تحديث الأزرار النشطة
                    app.elements.portfolioFilters.forEach(btn => btn.classList.remove('active'));
                    filter.classList.add('active');
                    
                    // تصفية العناصر
                    this.showItems(filterValue);
                    
                    app.state.portfolioFilter = filterValue;
                });
            });
        },

        showItems: function(category) {
            app.elements.portfolioItems.forEach((item, index) => {
                const itemCategory = item.getAttribute('data-category');
                const shouldShow = category === 'all' || itemCategory === category;
                
                setTimeout(() => {
                    if (shouldShow) {
                        item.classList.remove('hidden');
                        item.style.display = 'block';
                    } else {
                        item.classList.add('hidden');
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                }, index * 50);
            });
        }
    };

    /* ===========================
       7. إدارة النموذج
       Form Manager
       =========================== */
    const formManager = {
        init: function() {
            if (app.elements.contactForm) {
                this.bindFormEvents();
                this.setupValidation();
            }
        },

        bindFormEvents: function() {
            app.elements.contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });

            // إضافة معالجة للتحقق الفوري
            const inputs = app.elements.contactForm.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
                
                input.addEventListener('input', () => {
                    if (input.classList.contains('is-invalid')) {
                        this.validateField(input);
                    }
                });
            });
        },

        setupValidation: function() {
            // تخصيص رسائل التحقق
            const form = app.elements.contactForm;
            form.setAttribute('novalidate', '');
        },

        validateField: function(field) {
            const isValid = field.checkValidity();
            
            if (isValid) {
                field.classList.remove('is-invalid');
                field.classList.add('is-valid');
            } else {
                field.classList.remove('is-valid');
                field.classList.add('is-invalid');
            }
            
            return isValid;
        },

        validateForm: function() {
            const form = app.elements.contactForm;
            const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
            let isFormValid = true;
            
            inputs.forEach(input => {
                const isFieldValid = this.validateField(input);
                if (!isFieldValid) {
                    isFormValid = false;
                }
            });
            
            return isFormValid;
        },

        handleSubmit: function() {
            if (this.validateForm()) {
                this.submitForm();
            } else {
                this.showValidationError();
            }
        },

        submitForm: function() {
            const submitBtn = app.elements.contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // تغيير نص الزر أثناء الإرسال
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>' + 
                (app.state.currentLanguage === 'ar' ? 'جاري الإرسال...' : 'Sending...');
            submitBtn.disabled = true;
            
            // محاكاة إرسال النموذج
            setTimeout(() => {
                this.showSuccessMessage();
                this.resetForm();
                
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        },

        showSuccessMessage: function() {
            const message = app.state.currentLanguage === 'ar' ? 
                'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' :
                'Your message has been sent successfully! We will contact you soon.';
                
            this.showAlert(message, 'success');
        },

        showValidationError: function() {
            const message = app.state.currentLanguage === 'ar' ? 
                'يرجى تصحيح الأخطاء في النموذج قبل الإرسال.' :
                'Please correct the errors in the form before submitting.';
                
            this.showAlert(message, 'error');
        },

        showAlert: function(message, type) {
            // تنظيف التنبيهات السابقة
            const existingAlerts = document.querySelectorAll('.form-alert');
            existingAlerts.forEach(alert => alert.remove());
            
            // إنشاء تنبيه محسن
            const alert = document.createElement('div');
            alert.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed form-alert`;
            alert.style.cssText = 'top: 100px; right: 20px; z-index: 1080; min-width: 300px; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
            
            const icon = type === 'success' ? '✅' : '⚠️';
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="me-2" style="font-size: 1.2em;">${icon}</span>
                    <div class="flex-grow-1">${message}</div>
                    <button type="button" class="btn-close" aria-label="Close"></button>
                </div>
            `;
            
            document.body.appendChild(alert);
            
            // إعداد حدث الإغلاق
            const closeBtn = alert.querySelector('.btn-close');
            utils.addEventListenerSafe(closeBtn, 'click', () => {
                alert.remove();
            });
            
            // إزالة تلقائية
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.style.opacity = '0';
                    alert.style.transform = 'translateX(100%)';
                    setTimeout(() => alert.remove(), 300);
                }
            }, 5000);
        },

        resetForm: function() {
            app.elements.contactForm.reset();
            
            // إزالة فئات التحقق
            const inputs = app.elements.contactForm.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.classList.remove('is-valid', 'is-invalid');
            });
        }
    };

    /* ===========================
       8. إدارة الأنيميشن
       Animation Manager
       =========================== */
    const animationManager = {
        init: function() {
            this.initScrollAnimations();
            this.initCounterAnimations();
        },

        initScrollAnimations: function() {
            // مراقب التقاطع للأنيميشن
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('animate-in');
                            observer.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '0px 0px -100px 0px'
                });

                // مراقبة العناصر القابلة للأنيميشن
                document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
                    observer.observe(el);
                });
            }
        },

        initCounterAnimations: function() {
            const counters = document.querySelectorAll('.stat-number');
            
            const animateCounter = (counter) => {
                const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;
                
                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = Math.floor(current) + '+';
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target + '+';
                    }
                };
                
                updateCounter();
            };

            // مراقب لتشغيل العدادات عند ظهورها
            if ('IntersectionObserver' in window) {
                const counterObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            animateCounter(entry.target);
                            counterObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.5 });

                counters.forEach(counter => counterObserver.observe(counter));
            }
        }
    };

    /* ===========================
       9. التهيئة الرئيسية
       Main Initialization
       =========================== */
    const init = function() {
        // فحص حالة DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startApp);
        } else {
            startApp();
        }
    };

    const startApp = function() {
        try {
            // تهيئة المديرين
            loadingManager.init();
            navigationManager.init();
            backToTopManager.init();
            portfolioManager.init();
            formManager.init();
            animationManager.init();

            // تحديث اللغة والثيم من التخزين المحلي
            const savedLanguage = localStorage.getItem('preferred-language') || 'ar';
            const savedTheme = localStorage.getItem('preferred-theme') || 'light';
            
            app.state.currentLanguage = savedLanguage;
            app.state.currentTheme = savedTheme;

            console.log('✅ تم تهيئة التطبيق بنجاح / App initialized successfully');
        } catch (error) {
            console.error('❌ خطأ في تهيئة التطبيق / App initialization error:', error);
        }
    };

    // تصدير الكائنات للاستخدام العام
    window.BusinessConsulting = {
        app: app,
        utils: utils,
        navigationManager: navigationManager,
        portfolioManager: portfolioManager,
        formManager: formManager,
        animationManager: animationManager
    };

    // بدء التطبيق
    init();

})();