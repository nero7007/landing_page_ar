/* ===========================
   نظام الأنيميشن المتطور
   Advanced Animation System
   =========================== */

(function() {
    'use strict';

    /* ===========================
       1. إعدادات الأنيميشن
       Animation Configuration
       =========================== */
    const animationConfig = {
        // إعدادات عامة
        settings: {
            duration: {
                fast: 200,
                normal: 300,
                slow: 500,
                verySlow: 1000
            },
            easing: {
                ease: 'ease',
                easeIn: 'ease-in',
                easeOut: 'ease-out',
                easeInOut: 'ease-in-out',
                cubic: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            delays: {
                none: 0,
                short: 100,
                medium: 200,
                long: 300
            }
        },

        // إعدادات Intersection Observer
        observerOptions: {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        },

        // فئات الأنيميشن
        animationClasses: {
            fadeIn: 'animate-fade-in',
            fadeInUp: 'animate-fade-in-up',
            fadeInDown: 'animate-fade-in-down',
            fadeInLeft: 'animate-fade-in-left',
            fadeInRight: 'animate-fade-in-right',
            slideInUp: 'animate-slide-in-up',
            slideInDown: 'animate-slide-in-down',
            slideInLeft: 'animate-slide-in-left',
            slideInRight: 'animate-slide-in-right',
            scaleIn: 'animate-scale-in',
            rotateIn: 'animate-rotate-in',
            bounceIn: 'animate-bounce-in',
            flipIn: 'animate-flip-in'
        }
    };

    /* ===========================
       2. مدير الأنيميشن الرئيسي
       Main Animation Manager
       =========================== */
    const AnimationManager = {
        // حالة النظام
        state: {
            isInitialized: false,
            observers: [],
            activeAnimations: new Map(),
            preferReducedMotion: false
        },

        // العناصر والمراقبون
        elements: {
            animatedElements: [],
            counters: [],
            progressBars: [],
            parallaxElements: []
        },

        /* ===========================
           تهيئة نظام الأنيميشن
           Initialize Animation System
           =========================== */
        init: function() {
            console.log('🎬 تهيئة نظام الأنيميشن / Initializing Animation System...');
            
            try {
                this.checkReducedMotionPreference();
                this.createAnimationStyles();
                this.initScrollAnimations();
                this.initCounterAnimations();
                this.initProgressBarAnimations();
                this.initParallaxEffects();
                this.initHoverEffects();
                this.bindEvents();
                
                this.state.isInitialized = true;
                console.log('✅ تم تهيئة نظام الأنيميشن بنجاح / Animation system initialized successfully');
            } catch (error) {
                console.error('❌ خطأ في تهيئة نظام الأنيميشن / Animation system initialization error:', error);
            }
        },

        /* ===========================
           فحص تفضيل تقليل الحركة
           Check Reduced Motion Preference
           =========================== */
        checkReducedMotionPreference: function() {
            if (window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
                this.state.preferReducedMotion = mediaQuery.matches;
                
                // مراقبة تغيير التفضيل
                mediaQuery.addEventListener('change', (e) => {
                    this.state.preferReducedMotion = e.matches;
                    this.updateAnimationsBasedOnPreference();
                });
            }
        },

        /* ===========================
           إنشاء أنماط الأنيميشن
           Create Animation Styles
           =========================== */
        createAnimationStyles: function() {
            if (document.getElementById('animation-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'animation-styles';
            style.textContent = `
                /* أنيميشن الظهور التدريجي */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fadeInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                @keyframes fadeInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                /* أنيميشن الانزلاق */
                @keyframes slideInUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                
                @keyframes slideInDown {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
                
                @keyframes slideInLeft {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                
                /* أنيميشن التحجيم */
                @keyframes scaleIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                
                /* أنيميشن الدوران */
                @keyframes rotateIn {
                    from { transform: rotate(-90deg) scale(0.8); opacity: 0; }
                    to { transform: rotate(0deg) scale(1); opacity: 1; }
                }
                
                /* أنيميشن الارتداد */
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.1); opacity: 1; }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }
                
                /* أنيميشن القلب */
                @keyframes flipIn {
                    from { transform: perspective(400px) rotateY(90deg); opacity: 0; }
                    to { transform: perspective(400px) rotateY(0deg); opacity: 1; }
                }
                
                /* فئات الأنيميشن */
                .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
                .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
                .animate-fade-in-down { animation: fadeInDown 0.6s ease-out forwards; }
                .animate-fade-in-left { animation: fadeInLeft 0.6s ease-out forwards; }
                .animate-fade-in-right { animation: fadeInRight 0.6s ease-out forwards; }
                .animate-slide-in-up { animation: slideInUp 0.6s ease-out forwards; }
                .animate-slide-in-down { animation: slideInDown 0.6s ease-out forwards; }
                .animate-slide-in-left { animation: slideInLeft 0.6s ease-out forwards; }
                .animate-slide-in-right { animation: slideInRight 0.6s ease-out forwards; }
                .animate-scale-in { animation: scaleIn 0.5s ease-out forwards; }
                .animate-rotate-in { animation: rotateIn 0.7s ease-out forwards; }
                .animate-bounce-in { animation: bounceIn 0.8s ease-out forwards; }
                .animate-flip-in { animation: flipIn 0.6s ease-out forwards; }
                
                /* إخفاء العناصر قبل الأنيميشن */
                [data-animate]:not(.animated) {
                    opacity: 0;
                    visibility: hidden;
                }
                
                [data-animate].animated {
                    opacity: 1;
                    visibility: visible;
                }
                
                /* تعطيل الأنيميشن للمستخدمين الذين يفضلون تقليل الحركة */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                    
                    [data-animate] {
                        opacity: 1 !important;
                        visibility: visible !important;
                        transform: none !important;
                    }
                }
                
                /* أنيميشن التحميل */
                .loading-pulse {
                    animation: pulse 1.5s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                /* أنيميشن الهز */
                .shake {
                    animation: shake 0.6s ease-in-out;
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `;
            
            document.head.appendChild(style);
        },

        /* ===========================
           تهيئة أنيميشن التمرير
           Initialize Scroll Animations
           =========================== */
        initScrollAnimations: function() {
            // البحث عن العناصر القابلة للأنيميشن
            this.elements.animatedElements = document.querySelectorAll('[data-animate]');
            
            if (this.elements.animatedElements.length === 0) return;
            
            // إنشاء Intersection Observer
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateElement(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, animationConfig.observerOptions);
            
            // مراقبة العناصر
            this.elements.animatedElements.forEach(element => {
                observer.observe(element);
            });
            
            this.state.observers.push(observer);
        },

        /* ===========================
           تحريك عنصر معين
           Animate Specific Element
           =========================== */
        animateElement: function(element) {
            if (this.state.preferReducedMotion) {
                element.classList.add('animated');
                return;
            }
            
            const animationType = element.getAttribute('data-animate');
            const delay = parseInt(element.getAttribute('data-delay')) || 0;
            const duration = element.getAttribute('data-duration') || 'normal';
            
            setTimeout(() => {
                // إضافة فئة الأنيميشن
                const animationClass = animationConfig.animationClasses[animationType] || animationConfig.animationClasses.fadeIn;
                element.classList.add(animationClass, 'animated');
                
                // تحديث مدة الأنيميشن
                if (duration !== 'normal') {
                    const durationMs = animationConfig.settings.duration[duration] || animationConfig.settings.duration.normal;
                    element.style.animationDuration = `${durationMs}ms`;
                }
                
                // تسجيل الأنيميشن النشط
                this.state.activeAnimations.set(element, {
                    type: animationType,
                    startTime: Date.now()
                });
                
                // إزالة الأنيميشن بعد الانتهاء
                const animationDuration = parseFloat(getComputedStyle(element).animationDuration) * 1000;
                setTimeout(() => {
                    this.state.activeAnimations.delete(element);
                }, animationDuration);
                
            }, delay);
        },

        /* ===========================
           تهيئة أنيميشن العدادات
           Initialize Counter Animations
           =========================== */
        initCounterAnimations: function() {
            this.elements.counters = document.querySelectorAll('[data-counter]');
            
            if (this.elements.counters.length === 0) return;
            
            const counterObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        counterObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            this.elements.counters.forEach(counter => {
                counterObserver.observe(counter);
            });
            
            this.state.observers.push(counterObserver);
        },

        /* ===========================
           تحريك العداد
           Animate Counter
           =========================== */
        animateCounter: function(element) {
            if (this.state.preferReducedMotion) {
                const target = parseInt(element.getAttribute('data-counter'));
                element.textContent = target;
                return;
            }
            
            const target = parseInt(element.getAttribute('data-counter'));
            const duration = parseInt(element.getAttribute('data-duration')) || 2000;
            const prefix = element.getAttribute('data-prefix') || '';
            const suffix = element.getAttribute('data-suffix') || '';
            
            let current = 0;
            const increment = target / (duration / 16);
            const startTime = Date.now();
            
            const updateCounter = () => {
                current += increment;
                const elapsed = Date.now() - startTime;
                
                if (elapsed < duration && current < target) {
                    element.textContent = prefix + Math.floor(current) + suffix;
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = prefix + target + suffix;
                }
            };
            
            updateCounter();
        },

        /* ===========================
           تهيئة أنيميشن أشرطة التقدم
           Initialize Progress Bar Animations
           =========================== */
        initProgressBarAnimations: function() {
            this.elements.progressBars = document.querySelectorAll('[data-progress]');
            
            if (this.elements.progressBars.length === 0) return;
            
            const progressObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateProgressBar(entry.target);
                        progressObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });
            
            this.elements.progressBars.forEach(progressBar => {
                progressObserver.observe(progressBar);
            });
            
            this.state.observers.push(progressObserver);
        },

        /* ===========================
           تحريك شريط التقدم
           Animate Progress Bar
           =========================== */
        animateProgressBar: function(element) {
            const targetWidth = element.getAttribute('data-progress') + '%';
            const duration = parseInt(element.getAttribute('data-duration')) || 1000;
            
            if (this.state.preferReducedMotion) {
                element.style.width = targetWidth;
                return;
            }
            
            element.style.transition = `width ${duration}ms ease-out`;
            element.style.width = targetWidth;
        },

        /* ===========================
           تهيئة تأثيرات المنظور
           Initialize Parallax Effects
           =========================== */
        initParallaxEffects: function() {
            this.elements.parallaxElements = document.querySelectorAll('[data-parallax]');
            
            if (this.elements.parallaxElements.length === 0 || this.state.preferReducedMotion) return;
            
            const handleScroll = this.throttle(() => {
                const scrollTop = window.pageYOffset;
                
                this.elements.parallaxElements.forEach(element => {
                    const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;
                    const yPos = -(scrollTop * speed);
                    element.style.transform = `translateY(${yPos}px)`;
                });
            }, 16);
            
            window.addEventListener('scroll', handleScroll, { passive: true });
        },

        /* ===========================
           تهيئة تأثيرات التمرير
           Initialize Hover Effects
           =========================== */
        initHoverEffects: function() {
            const hoverElements = document.querySelectorAll('[data-hover]');
            
            hoverElements.forEach(element => {
                const hoverType = element.getAttribute('data-hover');
                
                element.addEventListener('mouseenter', () => {
                    this.applyHoverEffect(element, hoverType, true);
                });
                
                element.addEventListener('mouseleave', () => {
                    this.applyHoverEffect(element, hoverType, false);
                });
            });
        },

        /* ===========================
           تطبيق تأثير التمرير
           Apply Hover Effect
           =========================== */
        applyHoverEffect: function(element, type, isEnter) {
            if (this.state.preferReducedMotion) return;
            
            switch (type) {
                case 'scale':
                    element.style.transform = isEnter ? 'scale(1.05)' : 'scale(1)';
                    break;
                case 'lift':
                    element.style.transform = isEnter ? 'translateY(-5px)' : 'translateY(0)';
                    element.style.boxShadow = isEnter ? '0 10px 25px rgba(0,0,0,0.15)' : '';
                    break;
                case 'rotate':
                    element.style.transform = isEnter ? 'rotate(3deg)' : 'rotate(0deg)';
                    break;
                case 'glow':
                    element.style.boxShadow = isEnter ? '0 0 20px rgba(59, 130, 246, 0.6)' : '';
                    break;
            }
        },

        /* ===========================
           ربط الأحداث
           Bind Events
           =========================== */
        bindEvents: function() {
            // إعادة تهيئة عند تغيير حجم النافذة
            window.addEventListener('resize', this.debounce(() => {
                this.handleResize();
            }, 300));
            
            // معالج تغيير الصفحة
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseAnimations();
                } else {
                    this.resumeAnimations();
                }
            });
        },

        /* ===========================
           معالج تغيير حجم النافذة
           Handle Resize
           =========================== */
        handleResize: function() {
            // إعادة حساب مواقع العناصر المتحركة
            this.elements.parallaxElements.forEach(element => {
                element.style.transform = '';
            });
        },

        /* ===========================
           إيقاف الأنيميشن مؤقتاً
           Pause Animations
           =========================== */
        pauseAnimations: function() {
            this.state.activeAnimations.forEach((animation, element) => {
                element.style.animationPlayState = 'paused';
            });
        },

        /* ===========================
           استئناف الأنيميشن
           Resume Animations
           =========================== */
        resumeAnimations: function() {
            this.state.activeAnimations.forEach((animation, element) => {
                element.style.animationPlayState = 'running';
            });
        },

        /* ===========================
           تحديث الأنيميشن حسب التفضيل
           Update Animations Based on Preference
           =========================== */
        updateAnimationsBasedOnPreference: function() {
            if (this.state.preferReducedMotion) {
                // تعطيل جميع الأنيميشن
                this.state.activeAnimations.forEach((animation, element) => {
                    element.style.animation = 'none';
                    element.classList.add('animated');
                });
            }
        },

        /* ===========================
           تشغيل أنيميشن مخصص
           Trigger Custom Animation
           =========================== */
        triggerAnimation: function(element, animationType, options = {}) {
            if (!element || this.state.preferReducedMotion) return;
            
            const {
                duration = 'normal',
                delay = 0,
                easing = 'ease-out',
                callback = null
            } = options;
            
            setTimeout(() => {
                const animationClass = animationConfig.animationClasses[animationType];
                if (animationClass) {
                    element.classList.add(animationClass, 'animated');
                    
                    // تطبيق الإعدادات المخصصة
                    element.style.animationDuration = `${animationConfig.settings.duration[duration]}ms`;
                    element.style.animationTimingFunction = easing;
                    
                    // استدعاء callback عند الانتهاء
                    if (callback) {
                        const animationDuration = animationConfig.settings.duration[duration];
                        setTimeout(callback, animationDuration);
                    }
                }
            }, delay);
        },

        /* ===========================
           وظائف مساعدة
           Utility Functions
           =========================== */
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /* ===========================
           تنظيف النظام
           Cleanup System
           =========================== */
        cleanup: function() {
            // إزالة جميع المراقبين
            this.state.observers.forEach(observer => {
                observer.disconnect();
            });
            
            // مسح الأنيميشن النشطة
            this.state.activeAnimations.clear();
            
            // إعادة تعيين الحالة
            this.state.isInitialized = false;
            
            console.log('🧹 تم تنظيف نظام الأنيميشن / Animation system cleaned up');
        }
    };

    /* ===========================
       3. تهيئة النظام
       System Initialization
       =========================== */
    const initAnimationSystem = function() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                AnimationManager.init();
            });
        } else {
            AnimationManager.init();
        }
    };

    /* ===========================
       4. تصدير للاستخدام العالمي
       Export for Global Usage
       =========================== */
    window.AnimationManager = AnimationManager;
    window.animationConfig = animationConfig;

    // تهيئة النظام
    initAnimationSystem();

})();