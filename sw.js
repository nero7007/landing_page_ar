/* ===========================
   Service Worker
   نظام التخزين المؤقت المتقدم
   Advanced Caching System
   =========================== */

const CACHE_NAME = 'business-consulting-v1.0.0';
const OFFLINE_PAGE = '/offline.html';

// الملفات الأساسية للتخزين المؤقت
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/responsive.css',
    '/css/themes.css',
    '/js/main.js',
    '/js/language.js',
    '/js/theme.js',
    '/js/animations.js',
    '/favicon.ico',
    '/offline.html'
];

// الموارد الخارجية المهمة
const EXTERNAL_ASSETS = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    console.log('🚀 Service Worker: تثبيت / Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: تخزين الملفات الأساسية / Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker: تم التثبيت بنجاح / Installation successful');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker: خطأ في التثبيت / Installation error:', error);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker: تفعيل / Activating...');
    
    event.waitUntil(
        Promise.all([
            // إزالة التخزين المؤقت القديم
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: إزالة تخزين قديم / Removing old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // السيطرة على جميع العملاء
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker: تم التفعيل بنجاح / Activation successful');
        })
    );
});

// معالجة طلبات الشبكة
self.addEventListener('fetch', event => {
    // تجاهل الطلبات غير HTTP/HTTPS
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // إستراتيجية التخزين المؤقت
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // إذا وُجد في التخزين المؤقت، أرجعه
                if (cachedResponse) {
                    // تحديث في الخلفية للملفات الأساسية
                    if (CORE_ASSETS.includes(new URL(event.request.url).pathname)) {
                        fetch(event.request).then(response => {
                            if (response && response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                            }
                        }).catch(() => {
                            // تجاهل أخطاء الشبكة في التحديث الخلفي
                        });
                    }
                    return cachedResponse;
                }

                // إذا لم يوجد، جلب من الشبكة
                return fetch(event.request)
                    .then(response => {
                        // تحقق من صحة الاستجابة
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // نسخ الاستجابة للتخزين
                        const responseToCache = response.clone();
                        const url = new URL(event.request.url);

                        // تخزين الملفات المهمة
                        if (shouldCache(event.request)) {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        }

                        return response;
                    })
                    .catch(() => {
                        // في حالة فشل الشبكة، أرجع صفحة Offline إذا كان طلب HTML
                        if (event.request.destination === 'document') {
                            return caches.match(OFFLINE_PAGE);
                        }
                        
                        // للصور، أرجع placeholder إذا كان متاحاً
                        if (event.request.destination === 'image') {
                            return caches.match('/images/placeholder.svg');
                        }

                        // للموارد الأخرى، أرجع استجابة فارغة
                        return new Response('', { 
                            status: 408, 
                            statusText: 'Offline' 
                        });
                    });
            })
    );
});

// تحديد ما إذا كان يجب تخزين الطلب مؤقتاً
function shouldCache(request) {
    const url = new URL(request.url);
    
    // تخزين الملفات الثابتة
    const staticFileExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2'];
    const pathname = url.pathname.toLowerCase();
    
    if (staticFileExtensions.some(ext => pathname.endsWith(ext))) {
        return true;
    }
    
    // تخزين صفحات HTML الأساسية
    if (request.destination === 'document' && url.origin === self.location.origin) {
        return true;
    }
    
    // تخزين الموارد الخارجية المهمة
    if (EXTERNAL_ASSETS.some(asset => request.url.includes(asset))) {
        return true;
    }
    
    return false;
}

// معالجة رسائل من الصفحة الرئيسية
self.addEventListener('message', event => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
            case 'GET_VERSION':
                event.ports[0].postMessage({ version: CACHE_NAME });
                break;
            case 'CLEAN_OLD_CACHES':
                cleanOldCaches();
                break;
        }
    }
});

// تنظيف التخزين المؤقت القديم
function cleanOldCaches() {
    caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
            if (cacheName !== CACHE_NAME) {
                caches.delete(cacheName);
            }
        });
    });
}

// معالجة الإشعارات Push (للمستقبل)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'رسالة جديدة من استشارات الأعمال',
            icon: '/images/notification-icon.png',
            badge: '/images/badge-icon.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey || '1'
            },
            actions: [
                {
                    action: 'explore',
                    title: 'اكتشف المزيد',
                    icon: '/images/checkmark.png'
                },
                {
                    action: 'close',
                    title: 'إغلاق',
                    icon: '/images/xmark.png'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'استشارات الأعمال', options)
        );
    }
});

// معالجة النقر على الإشعارات
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // إغلاق الإشعار فقط
    } else {
        // النقر على الإشعار نفسه
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('🚀 Service Worker: تم تحميل الملف / File loaded');