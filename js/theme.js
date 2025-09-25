/* ===========================
   نظام إدارة الثيمات المتطور
   Advanced Theme Management System
   =========================== */

(function() {
    'use strict';

    /* ===========================
       1. إعدادات الثيم
       Theme Configuration
       =========================== */
    const themeConfig = {
        // الثيمات المدعومة
        availableThemes: ['light', 'dark'],
        
        // الثيم الافتراضي
        defaultTheme: 'light',
        
        // مفاتيح التخزين
        storageKeys: {
            theme: 'preferred-theme',
            systemPreference: 'prefers-system-theme'
        },
        
        // فئات CSS للثيمات
        themeClasses: {
            light: 'theme-light',
            dark: 'theme-dark'
        },
        
        // إعدادات الانتقال
        transition: {
            duration: 300,
            easing: 'ease-in-out'
        }
    };

    /* ===========================
       2. مدير الثيم الرئيسي
       Main Theme Manager
       =========================== */
    const ThemeManager = {
        // الحالة الحالية
        state: {
            currentTheme: themeConfig.defaultTheme,
            isTransitioning: false,
            systemPreference: 'light',
            followSystemPreference: false
        },

        // العناصر المهمة
        elements: {
            html: document.documentElement,
            body: document.body,
            themeToggle: document.getElementById('theme-toggle'),
            themeIcon: document.getElementById('theme-icon')
        },

        /* ===========================
           تهيئة نظام الثيم
           Initialize Theme System
           =========================== */
        init: function() {
            console.log('🎨 تهيئة نظام الثيمات / Initializing Theme System...');
            
            try {
                this.detectSystemPreference();
                this.loadSavedTheme();
                this.bindEvents();
                this.setupThemeToggle();
                this.watchSystemPreference();
                
                console.log('✅ تم تهيئة نظام الثيمات بنجاح / Theme system initialized successfully');
            } catch (error) {
                console.error('❌ خطأ في تهيئة نظام الثيمات / Theme system initialization error:', error);
            }
        },

        /* ===========================
           كشف تفضيل النظام
           Detect System Preference
           =========================== */
        detectSystemPreference: function() {
            if (window.matchMedia) {
                const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
                this.state.systemPreference = darkModeQuery.matches ? 'dark' : 'light';
                
                // تسجيل تفضيل النظام
                console.log(`🖥️ تفضيل النظام / System preference: ${this.state.systemPreference}`);
            }
        },

        /* ===========================
           تحميل الثيم المحفوظ
           Load Saved Theme
           =========================== */
        loadSavedTheme: function() {
            try {
                const savedTheme = localStorage.getItem(themeConfig.storageKeys.theme);
                const followSystem = localStorage.getItem(themeConfig.storageKeys.systemPreference) === 'true';
                
                this.state.followSystemPreference = followSystem;
                
                if (followSystem) {
                    // استخدام تفضيل النظام
                    this.state.currentTheme = this.state.systemPreference;
                } else if (savedTheme && themeConfig.availableThemes.includes(savedTheme)) {
                    // استخدام الثيم المحفوظ
                    this.state.currentTheme = savedTheme;
                } else {
                    // استخدام الثيم الافتراضي
                    this.state.currentTheme = themeConfig.defaultTheme;
                }
                
                this.applyTheme(false); // بدون أنيميشن في البداية
            } catch (error) {
                console.warn('تعذر تحميل الثيم المحفوظ / Could not load saved theme:', error);
                this.state.currentTheme = themeConfig.defaultTheme;
                this.applyTheme(false);
            }
        },

        /* ===========================
           ربط الأحداث
           Bind Events
           =========================== */
        bindEvents: function() {
            // زر تغيير الثيم
            if (this.elements.themeToggle) {
                this.elements.themeToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleTheme();
                });
            }

            // اختصارات لوحة المفاتيح
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + Shift + D لتغيير الثيم
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });

            // معالج تغيير تفضيل النظام
            if (window.matchMedia) {
                const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
                darkModeQuery.addEventListener('change', (e) => {
                    this.handleSystemPreferenceChange(e.matches ? 'dark' : 'light');
                });
            }
        },

        /* ===========================
           إعداد زر تغيير الثيم
           Setup Theme Toggle
           =========================== */
        setupThemeToggle: function() {
            this.updateThemeToggleIcon();
            
            if (this.elements.themeToggle) {
                // إضافة تلميح
                this.updateThemeToggleTooltip();
            }
        },

        /* ===========================
           مراقبة تفضيل النظام
           Watch System Preference
           =========================== */
        watchSystemPreference: function() {
            if (window.matchMedia) {
                const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
                
                darkModeQuery.addEventListener('change', (e) => {
                    const newSystemPreference = e.matches ? 'dark' : 'light';
                    this.state.systemPreference = newSystemPreference;
                    
                    // تطبيق الثيم الجديد فقط إذا كان المستخدم يتبع تفضيل النظام
                    if (this.state.followSystemPreference) {
                        this.switchToTheme(newSystemPreference, true);
                    }
                });
            }
        },

        /* ===========================
           تبديل الثيم
           Toggle Theme
           =========================== */
        toggleTheme: function() {
            if (this.state.isTransitioning) return;
            
            const newTheme = this.state.currentTheme === 'light' ? 'dark' : 'light';
            this.switchToTheme(newTheme, true);
            
            // إيقاف متابعة تفضيل النظام عند التبديل اليدوي
            this.state.followSystemPreference = false;
            this.saveThemePreferences();
        },

        /* ===========================
           التبديل إلى ثيم محدد
           Switch to Specific Theme
           =========================== */
        switchToTheme: function(theme, withAnimation = true) {
            if (!themeConfig.availableThemes.includes(theme) || 
                theme === this.state.currentTheme) {
                return;
            }

            console.log(`🎨 تغيير الثيم إلى / Switching theme to: ${theme}`);

            this.state.isTransitioning = true;
            this.state.currentTheme = theme;

            if (withAnimation) {
                this.animateThemeTransition(() => {
                    this.applyTheme(true);
                    this.state.isTransitioning = false;
                });
            } else {
                this.applyTheme(false);
                this.state.isTransitioning = false;
            }

            // حفظ في التخزين المحلي
            this.saveThemePreferences();
            
            // إشعار التطبيق الرئيسي بالتغيير
            this.notifyThemeChange();
        },

        /* ===========================
           تطبيق الثيم
           Apply Theme
           =========================== */
        applyTheme: function(withTransition = true) {
            // إضافة/إزالة فئة الانتقال
            if (withTransition) {
                this.elements.body.classList.add('theme-transition');
            }

            // تحديث خاصية data-theme
            this.elements.html.setAttribute('data-theme', this.state.currentTheme);

            // تحديث فئات CSS
            this.updateThemeClasses();

            // تحديث أيقونة الزر
            this.updateThemeToggleIcon();

            // تحديث تلميح الزر
            this.updateThemeToggleTooltip();

            // تحديث ألوان meta theme-color
            this.updateMetaThemeColor();

            // إزالة فئة الانتقال بعد انتهاء التأثير
            if (withTransition) {
                setTimeout(() => {
                    this.elements.body.classList.remove('theme-transition');
                }, themeConfig.transition.duration);
            }
        },

        /* ===========================
           تحديث فئات الثيم
           Update Theme Classes
           =========================== */
        updateThemeClasses: function() {
            // إزالة جميع فئات الثيم الموجودة
            Object.values(themeConfig.themeClasses).forEach(className => {
                this.elements.body.classList.remove(className);
            });

            // إضافة فئة الثيم الحالي
            const currentThemeClass = themeConfig.themeClasses[this.state.currentTheme];
            if (currentThemeClass) {
                this.elements.body.classList.add(currentThemeClass);
            }
        },

        /* ===========================
           تحديث أيقونة زر الثيم
           Update Theme Toggle Icon
           =========================== */
        updateThemeToggleIcon: function() {
            if (this.elements.themeIcon) {
                // إزالة الأيقونات الموجودة
                this.elements.themeIcon.className = this.elements.themeIcon.className
                    .replace(/fa-moon|fa-sun/g, '').trim();
                
                // إضافة الأيقونة المناسبة
                const iconClass = this.state.currentTheme === 'light' ? 'fa-moon' : 'fa-sun';
                this.elements.themeIcon.classList.add('fas', iconClass);
            }
        },

        /* ===========================
           تحديث تلميح زر الثيم
           Update Theme Toggle Tooltip
           =========================== */
        updateThemeToggleTooltip: function() {
            if (this.elements.themeToggle) {
                const isArabic = document.documentElement.lang === 'ar';
                let tooltip;
                
                if (this.state.currentTheme === 'light') {
                    tooltip = isArabic ? 
                        'تفعيل الوضع المظلم / Enable Dark Mode' : 
                        'تفعيل الوضع المظلم / Enable Dark Mode';
                } else {
                    tooltip = isArabic ? 
                        'تفعيل الوضع المضيء / Enable Light Mode' : 
                        'تفعيل الوضع المضيء / Enable Light Mode';
                }
                
                this.elements.themeToggle.setAttribute('title', tooltip);
            }
        },

        /* ===========================
           تحديث لون Meta Theme
           Update Meta Theme Color
           =========================== */
        updateMetaThemeColor: function() {
            let metaThemeColor = document.querySelector('meta[name="theme-color"]');
            
            if (!metaThemeColor) {
                metaThemeColor = document.createElement('meta');
                metaThemeColor.name = 'theme-color';
                document.head.appendChild(metaThemeColor);
            }
            
            const color = this.state.currentTheme === 'light' ? '#ffffff' : '#0f172a';
            metaThemeColor.content = color;
        },

        /* ===========================
           معالج تغيير تفضيل النظام
           Handle System Preference Change
           =========================== */
        handleSystemPreferenceChange: function(newPreference) {
            this.state.systemPreference = newPreference;
            
            if (this.state.followSystemPreference) {
                this.switchToTheme(newPreference, true);
            }
        },

        /* ===========================
           أنيميشن تغيير الثيم
           Theme Transition Animation
           =========================== */
        animateThemeTransition: function(callback) {
            // إضافة فئة أنيميشن التبديل
            this.elements.body.classList.add('theme-switching');
            
            // أنيميشن أيقونة الزر
            if (this.elements.themeIcon) {
                this.elements.themeIcon.style.transform = 'rotate(180deg)';
            }
            
            // تأثير تلاشي على المحتوى
            const content = document.querySelector('main, .main-content') || this.elements.body;
            content.style.opacity = '0.8';
            content.style.transition = `opacity ${themeConfig.transition.duration}ms ${themeConfig.transition.easing}`;
            
            setTimeout(() => {
                callback();
                
                // إعادة تعيين التأثيرات
                content.style.opacity = '1';
                
                if (this.elements.themeIcon) {
                    this.elements.themeIcon.style.transform = '';
                }
                
                setTimeout(() => {
                    this.elements.body.classList.remove('theme-switching');
                    content.style.transition = '';
                }, themeConfig.transition.duration);
                
            }, themeConfig.transition.duration / 2);
        },

        /* ===========================
           حفظ تفضيلات الثيم
           Save Theme Preferences
           =========================== */
        saveThemePreferences: function() {
            try {
                localStorage.setItem(themeConfig.storageKeys.theme, this.state.currentTheme);
                localStorage.setItem(themeConfig.storageKeys.systemPreference, 
                    this.state.followSystemPreference.toString());
            } catch (error) {
                console.warn('تعذر حفظ تفضيلات الثيم / Could not save theme preferences:', error);
            }
        },

        /* ===========================
           إشعار تغيير الثيم
           Notify Theme Change
           =========================== */
        notifyThemeChange: function() {
            // إرسال حدث مخصص
            const event = new CustomEvent('themeChanged', {
                detail: {
                    theme: this.state.currentTheme,
                    previousTheme: this.state.currentTheme === 'light' ? 'dark' : 'light',
                    isSystemPreference: this.state.followSystemPreference
                }
            });
            
            document.dispatchEvent(event);

            // تحديث حالة التطبيق الرئيسي إذا كان متاحاً
            if (window.BusinessConsulting && window.BusinessConsulting.app) {
                window.BusinessConsulting.app.state.currentTheme = this.state.currentTheme;
            }
        },

        /* ===========================
           تفعيل/إلغاء متابعة النظام
           Enable/Disable System Following
           =========================== */
        setFollowSystemPreference: function(follow) {
            this.state.followSystemPreference = follow;
            
            if (follow) {
                this.switchToTheme(this.state.systemPreference, true);
            }
            
            this.saveThemePreferences();
        },

        /* ===========================
           الحصول على معلومات الثيم الحالي
           Get Current Theme Info
           =========================== */
        getCurrentThemeInfo: function() {
            return {
                current: this.state.currentTheme,
                available: themeConfig.availableThemes,
                systemPreference: this.state.systemPreference,
                followingSystem: this.state.followSystemPreference,
                isTransitioning: this.state.isTransitioning
            };
        },

        /* ===========================
           تحديد ثيم مخصص
           Set Custom Theme
           =========================== */
        setCustomTheme: function(themeName, themeValues) {
            if (!themeName || !themeValues) return;
            
            // إضافة الثيم المخصص للقائمة
            if (!themeConfig.availableThemes.includes(themeName)) {
                themeConfig.availableThemes.push(themeName);
            }
            
            // تطبيق قيم الثيم المخصص
            Object.entries(themeValues).forEach(([property, value]) => {
                this.elements.html.style.setProperty(property, value);
            });
            
            // التبديل للثيم الجديد
            this.switchToTheme(themeName, true);
        },

        /* ===========================
           إعادة تعيين الثيم
           Reset Theme
           =========================== */
        resetTheme: function() {
            this.state.currentTheme = themeConfig.defaultTheme;
            this.state.followSystemPreference = false;
            
            // حذف التفضيلات المحفوظة
            try {
                localStorage.removeItem(themeConfig.storageKeys.theme);
                localStorage.removeItem(themeConfig.storageKeys.systemPreference);
            } catch (error) {
                console.warn('تعذر حذف تفضيلات الثيم / Could not remove theme preferences:', error);
            }
            
            this.applyTheme(true);
            this.notifyThemeChange();
        }
    };

    /* ===========================
       3. مساعدات إضافية
       Additional Helpers
       =========================== */
    const ThemeHelpers = {
        // تحديد ما إذا كان الثيم مظلم
        isDark: function() {
            return ThemeManager.state.currentTheme === 'dark';
        },
        
        // تحديد ما إذا كان الثيم فاتح
        isLight: function() {
            return ThemeManager.state.currentTheme === 'light';
        },
        
        // الحصول على اللون المتباين
        getContrastColor: function(backgroundColor) {
            // تحويل اللون إلى RGB
            const rgb = this.hexToRgb(backgroundColor);
            if (!rgb) return '#000000';
            
            // حساب السطوع
            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            
            return brightness > 128 ? '#000000' : '#ffffff';
        },
        
        // تحويل من Hex إلى RGB
        hexToRgb: function(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
    };

    /* ===========================
       4. تهيئة النظام
       System Initialization
       =========================== */
    const initThemeSystem = function() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                ThemeManager.init();
            });
        } else {
            ThemeManager.init();
        }
    };

    /* ===========================
       5. تصدير للاستخدام العالمي
       Export for Global Usage
       =========================== */
    window.ThemeManager = ThemeManager;
    window.ThemeHelpers = ThemeHelpers;
    window.themeConfig = themeConfig;

    // تهيئة النظام
    initThemeSystem();

    /* ===========================
       6. إضافة مستمعين لأحداث مخصصة
       Add Custom Event Listeners
       =========================== */
    document.addEventListener('themeChanged', function(e) {
        console.log(`🎨 تم تغيير الثيم إلى / Theme changed to: ${e.detail.theme}`);
        
        // يمكن إضافة إجراءات إضافية هنا عند تغيير الثيم
        // مثل تحديث الرسوم البيانية أو إعادة تحميل الصور
    });

})();