/* ===========================
   نظام إدارة اللغات المتطور
   Advanced Language Management System
   =========================== */

(function() {
    'use strict';

    /* ===========================
       1. إعدادات اللغة
       Language Configuration
       =========================== */
    const languageConfig = {
        // اللغات المدعومة
        supportedLanguages: ['ar', 'en'],
        
        // اللغة الافتراضية
        defaultLanguage: 'ar',
        
        // إعدادات RTL/LTR
        rtlLanguages: ['ar', 'fa', 'he'],
        
        // مفاتيح التخزين
        storageKeys: {
            language: 'preferred-language',
            direction: 'preferred-direction'
        },
        
        // إعدادات الخطوط لكل لغة
        fontFamilies: {
            ar: 'Cairo, Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            en: 'Inter, Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
        }
    };

    /* ===========================
       2. مدير اللغة الرئيسي
       Main Language Manager
       =========================== */
    const LanguageManager = {
        // الحالة الحالية
        state: {
            currentLanguage: languageConfig.defaultLanguage,
            isRTL: true,
            isTransitioning: false
        },

        // العناصر المهمة
        elements: {
            html: document.documentElement,
            body: document.body,
            languageToggle: document.getElementById('language-toggle'),
            currentLangSpan: document.getElementById('current-lang'),
            translatableElements: null
        },

        /* ===========================
           تهيئة نظام اللغة
           Initialize Language System
           =========================== */
        init: function() {
            console.log('🌍 تهيئة نظام اللغات / Initializing Language System...');
            
            try {
                this.loadSavedLanguage();
                this.bindEvents();
                this.updateTranslatableElements();
                this.setupLanguageToggle();
                this.detectBrowserLanguage();
                
                console.log('✅ تم تهيئة نظام اللغات بنجاح / Language system initialized successfully');
            } catch (error) {
                console.error('❌ خطأ في تهيئة نظام اللغات / Language system initialization error:', error);
            }
        },

        /* ===========================
           تحميل اللغة المحفوظة
           Load Saved Language
           =========================== */
        loadSavedLanguage: function() {
            const savedLang = localStorage.getItem(languageConfig.storageKeys.language);
            
            if (savedLang && languageConfig.supportedLanguages.includes(savedLang)) {
                this.state.currentLanguage = savedLang;
            } else {
                // استخدام اللغة الافتراضية
                this.state.currentLanguage = languageConfig.defaultLanguage;
            }
            
            this.state.isRTL = languageConfig.rtlLanguages.includes(this.state.currentLanguage);
            this.applyLanguageSettings(false); // بدون أنيميشن في البداية
        },

        /* ===========================
           ربط الأحداث
           Bind Events
           =========================== */
        bindEvents: function() {
            // زر تغيير اللغة
            if (this.elements.languageToggle) {
                this.elements.languageToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleLanguage();
                });
            }

            // اختصارات لوحة المفاتيح
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + Shift + L لتغيير اللغة
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                    e.preventDefault();
                    this.toggleLanguage();
                }
            });

            // استماع لتغيير حجم النافذة لإعادة تطبيق الإعدادات
            window.addEventListener('resize', this.debounce(() => {
                this.adjustLayoutForLanguage();
            }, 300));
        },

        /* ===========================
           تحديث العناصر القابلة للترجمة
           Update Translatable Elements
           =========================== */
        updateTranslatableElements: function() {
            try {
                this.elements.translatableElements = document.querySelectorAll('[data-ar], [data-en]');
                
                // إضافة عناصر إضافية تحتاج ترجمة
                const additionalElements = document.querySelectorAll(
                    'input[placeholder], textarea[placeholder], [title], [alt]'
                );
                
                // دمج كل العناصر
                if (this.elements.translatableElements.length > 0 || additionalElements.length > 0) {
                    const allElements = [...this.elements.translatableElements, ...additionalElements];
                    this.elements.translatableElements = allElements.filter((element, index, arr) => 
                        arr.indexOf(element) === index
                    );
                } else {
                    this.elements.translatableElements = [];
                }
            } catch (error) {
                console.warn('خطأ في تحديث العناصر القابلة للترجمة / Error updating translatable elements:', error);
                this.elements.translatableElements = [];
            }
        },

        /* ===========================
           إعداد زر تغيير اللغة
           Setup Language Toggle
           =========================== */
        setupLanguageToggle: function() {
            if (this.elements.currentLangSpan) {
                this.updateLanguageToggleText();
            }
        },

        /* ===========================
           كشف لغة المتصفح
           Detect Browser Language
           =========================== */
        detectBrowserLanguage: function() {
            // فقط في حالة عدم وجود لغة محفوظة
            if (!localStorage.getItem(languageConfig.storageKeys.language)) {
                const browserLang = navigator.language || navigator.userLanguage;
                const langCode = browserLang.split('-')[0];
                
                if (languageConfig.supportedLanguages.includes(langCode)) {
                    this.switchToLanguage(langCode, false);
                }
            }
        },

        /* ===========================
           تبديل اللغة
           Toggle Language
           =========================== */
        toggleLanguage: function() {
            if (this.state.isTransitioning) return;
            
            const newLanguage = this.state.currentLanguage === 'ar' ? 'en' : 'ar';
            this.switchToLanguage(newLanguage, true);
        },

        /* ===========================
           التبديل إلى لغة محددة
           Switch to Specific Language
           =========================== */
        switchToLanguage: function(language, withAnimation = true) {
            if (!languageConfig.supportedLanguages.includes(language) || 
                language === this.state.currentLanguage) {
                return;
            }

            console.log(`🔄 تغيير اللغة إلى / Switching language to: ${language}`);

            this.state.isTransitioning = true;
            this.state.currentLanguage = language;
            this.state.isRTL = languageConfig.rtlLanguages.includes(language);

            if (withAnimation) {
                this.animateLanguageTransition(() => {
                    this.applyLanguageSettings(true);
                    this.state.isTransitioning = false;
                });
            } else {
                this.applyLanguageSettings(false);
                this.state.isTransitioning = false;
            }

            // حفظ في التخزين المحلي
            this.saveLanguagePreference();
            
            // إشعار التطبيق الرئيسي بالتغيير
            this.notifyLanguageChange();
        },

        /* ===========================
           تطبيق إعدادات اللغة
           Apply Language Settings
           =========================== */
        applyLanguageSettings: function(withTransition = true) {
            // إضافة/إزالة فئة الانتقال
            if (withTransition) {
                this.elements.body.classList.add('theme-transition');
            }

            // تحديث خصائص HTML
            this.elements.html.setAttribute('lang', this.state.currentLanguage);
            this.elements.html.setAttribute('dir', this.state.isRTL ? 'rtl' : 'ltr');

            // تحديث خط الصفحة
            this.updateFontFamily();

            // تحديث النصوص
            this.translateElements();

            // تحديث زر اللغة
            this.updateLanguageToggleText();

            // تعديل التخطيط حسب اللغة
            this.adjustLayoutForLanguage();

            // تحديث نصوص الـ placeholder
            this.updatePlaceholders();

            // إزالة فئة الانتقال بعد انتهاء التأثير
            if (withTransition) {
                setTimeout(() => {
                    this.elements.body.classList.remove('theme-transition');
                }, 300);
            }
        },

        /* ===========================
           ترجمة العناصر
           Translate Elements
           =========================== */
        translateElements: function() {
            if (!this.elements.translatableElements || this.elements.translatableElements.length === 0) {
                this.updateTranslatableElements();
            }
            
            if (this.elements.translatableElements && this.elements.translatableElements.length > 0) {
                this.elements.translatableElements.forEach(element => {
                    const currentLangText = element.getAttribute(`data-${this.state.currentLanguage}`);
                    
                    if (currentLangText) {
                        // تحديد نوع العنصر وتحديث النص المناسب
                        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                            if (element.type === 'submit' || element.type === 'button') {
                                element.value = currentLangText;
                            }
                        } else {
                            element.textContent = currentLangText;
                        }
                    }
                });
            }
        },

        /* ===========================
           تحديث نصوص الـ Placeholder
           Update Placeholders
           =========================== */
        updatePlaceholders: function() {
            const placeholderElements = document.querySelectorAll('[data-ar-placeholder], [data-en-placeholder]');
            
            placeholderElements.forEach(element => {
                const placeholder = element.getAttribute(`data-${this.state.currentLanguage}-placeholder`);
                if (placeholder) {
                    element.setAttribute('placeholder', placeholder);
                }
            });
        },

        /* ===========================
           تحديث عائلة الخط
           Update Font Family
           =========================== */
        updateFontFamily: function() {
            const fontFamily = languageConfig.fontFamilies[this.state.currentLanguage];
            if (fontFamily) {
                this.elements.body.style.fontFamily = fontFamily;
            }
        },

        /* ===========================
           تحديث نص زر اللغة
           Update Language Toggle Text
           =========================== */
        updateLanguageToggleText: function() {
            if (this.elements.currentLangSpan) {
                const nextLanguage = this.state.currentLanguage === 'ar' ? 'EN' : 'AR';
                this.elements.currentLangSpan.textContent = nextLanguage;
            }

            // تحديث تلميح الزر
            if (this.elements.languageToggle) {
                const tooltip = this.state.currentLanguage === 'ar' ? 
                    'Switch to English / تبديل للإنجليزية' : 
                    'تبديل للعربية / Switch to Arabic';
                this.elements.languageToggle.setAttribute('title', tooltip);
            }
        },

        /* ===========================
           تعديل التخطيط حسب اللغة
           Adjust Layout for Language
           =========================== */
        adjustLayoutForLanguage: function() {
            // تحديث أيقونات الاتجاه
            const directionalIcons = document.querySelectorAll('.fa-chevron-left, .fa-chevron-right, .fa-arrow-left, .fa-arrow-right');
            
            directionalIcons.forEach(icon => {
                if (this.state.isRTL) {
                    // في RTL، عكس الاتجاهات
                    if (icon.classList.contains('fa-chevron-left')) {
                        icon.classList.replace('fa-chevron-left', 'fa-chevron-right');
                    } else if (icon.classList.contains('fa-chevron-right')) {
                        icon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                    }
                } else {
                    // في LTR، استخدام الاتجاه الطبيعي
                    if (icon.classList.contains('fa-chevron-right') && 
                        icon.getAttribute('data-original') === 'left') {
                        icon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                    }
                }
            });

            // تحديث مواقع العناصر المطلقة
            this.updateAbsolutePositions();
        },

        /* ===========================
           تحديث المواقع المطلقة
           Update Absolute Positions
           =========================== */
        updateAbsolutePositions: function() {
            const floatingElements = document.querySelectorAll('.floating-card, .floating-element, .btn-floating');
            
            floatingElements.forEach(element => {
                const computedStyle = window.getComputedStyle(element);
                
                if (this.state.isRTL) {
                    // في RTL، عكس مواقع left/right
                    if (computedStyle.right !== 'auto' && computedStyle.left === 'auto') {
                        const rightValue = computedStyle.right;
                        element.style.left = rightValue;
                        element.style.right = 'auto';
                    }
                } else {
                    // في LTR، استعادة المواقع الأصلية
                    if (computedStyle.left !== 'auto' && computedStyle.right === 'auto') {
                        const leftValue = computedStyle.left;
                        element.style.right = leftValue;
                        element.style.left = 'auto';
                    }
                }
            });
        },

        /* ===========================
           أنيميشن تغيير اللغة
           Language Transition Animation
           =========================== */
        animateLanguageTransition: function(callback) {
            const content = document.querySelector('main, .main-content') || this.elements.body;
            
            // تأثير تلاشي
            content.style.opacity = '0.7';
            content.style.transform = 'scale(0.98)';
            content.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                callback();
                
                // إعادة تعيين التأثير
                content.style.opacity = '1';
                content.style.transform = 'scale(1)';
                
                setTimeout(() => {
                    content.style.transition = '';
                }, 300);
            }, 150);
        },

        /* ===========================
           حفظ تفضيل اللغة
           Save Language Preference
           =========================== */
        saveLanguagePreference: function() {
            try {
                localStorage.setItem(languageConfig.storageKeys.language, this.state.currentLanguage);
                localStorage.setItem(languageConfig.storageKeys.direction, this.state.isRTL ? 'rtl' : 'ltr');
            } catch (error) {
                console.warn('تعذر حفظ تفضيل اللغة / Could not save language preference:', error);
            }
        },

        /* ===========================
           إشعار تغيير اللغة
           Notify Language Change
           =========================== */
        notifyLanguageChange: function() {
            // إرسال حدث مخصص
            const event = new CustomEvent('languageChanged', {
                detail: {
                    language: this.state.currentLanguage,
                    isRTL: this.state.isRTL,
                    direction: this.state.isRTL ? 'rtl' : 'ltr'
                }
            });
            
            document.dispatchEvent(event);

            // تحديث حالة التطبيق الرئيسي إذا كان متاحاً
            if (window.BusinessConsulting && window.BusinessConsulting.app) {
                window.BusinessConsulting.app.state.currentLanguage = this.state.currentLanguage;
            }
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

        /* ===========================
           الحصول على معلومات اللغة الحالية
           Get Current Language Info
           =========================== */
        getCurrentLanguageInfo: function() {
            return {
                code: this.state.currentLanguage,
                name: this.state.currentLanguage === 'ar' ? 'العربية' : 'English',
                direction: this.state.isRTL ? 'rtl' : 'ltr',
                isRTL: this.state.isRTL,
                fontFamily: languageConfig.fontFamilies[this.state.currentLanguage]
            };
        },

        /* ===========================
           إضافة ترجمة جديدة
           Add Translation
           =========================== */
        addTranslation: function(element, arText, enText) {
            if (element) {
                element.setAttribute('data-ar', arText);
                element.setAttribute('data-en', enText);
                
                // تطبيق الترجمة فوراً
                const currentText = this.state.currentLanguage === 'ar' ? arText : enText;
                element.textContent = currentText;
                
                // إضافة للقائمة إذا لم تكن موجودة
                if (!Array.from(this.elements.translatableElements).includes(element)) {
                    this.elements.translatableElements = [...this.elements.translatableElements, element];
                }
            }
        }
    };

    /* ===========================
       3. تهيئة النظام
       System Initialization
       =========================== */
    const initLanguageSystem = function() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                LanguageManager.init();
            });
        } else {
            LanguageManager.init();
        }
    };

    /* ===========================
       4. تصدير للاستخدام العالمي
       Export for Global Usage
       =========================== */
    window.LanguageManager = LanguageManager;
    window.languageConfig = languageConfig;

    // تهيئة النظام
    initLanguageSystem();

    /* ===========================
       5. إضافة مستمعين لأحداث مخصصة
       Add Custom Event Listeners
       =========================== */
    document.addEventListener('languageChanged', function(e) {
        console.log(`🌍 تم تغيير اللغة إلى / Language changed to: ${e.detail.language}`);
        
        // يمكن إضافة إجراءات إضافية هنا عند تغيير اللغة
        // مثل إعادة تحميل المحتوى الديناميكي أو تحديث التواريخ
    });

})();