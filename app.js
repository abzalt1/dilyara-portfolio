/* ══════════════════════════════════════════════
   APP.JS — dilyara.kz
   Extracted from inline <script> + enhancements
   ══════════════════════════════════════════════ */

// ─── 1. TRANSLATIONS ───
const translations = {
    ru: {
        role: "Коммерческая модель", location: "Алматы, Казахстан",
        about_title: "О модели",
        about_text: "В моделинге с 2025 года. Специализация: beauty, наружная реклама, street-style. Активно снимаюсь в Reels, Shorts и рекламных интеграциях. Профессионально создаю UGC-контент.",
        select_category: "Выберите категорию", booking: "Контакты",
        booking_req_title: "Прямая связь",
        booking_req_text: "Для обсуждения проектов и сотрудничества пишите в Telegram.",
        booking_req_btn: "Написать в Telegram",
        booking_req_btn_send: "Отправить",
        load_more: "Показать ещё",
        form_success: "Сообщение отправлено!"
    },
    en: {
        role: "Commercial Model", location: "Based in Almaty",
        about_title: "About Model",
        about_text: "Modeling since 2025. Specializing in beauty, outdoor advertising, street-style. Active in Reels, Shorts, and ad integrations. Professional UGC content creator.",
        select_category: "Select Category", booking: "Booking",
        booking_req_title: "Direct Booking",
        booking_req_text: "For inquiries and collaboration please contact me via Telegram.",
        booking_req_btn: "Write on Telegram",
        booking_req_btn_send: "Send",
        load_more: "Load More",
        form_success: "Message sent!"
    },
    kk: {
        role: "Коммерциялық модель", location: "Алматы, Қазақстан",
        about_title: "Модель туралы",
        about_text: "2025 жылдан бері модельдингте. Мамандануы: beauty, сыртқы жарнама, street-style. Reels, Shorts және жарнамалық интеграцияларда белсендімін. Кәсіби UGC контент жасаймын.",
        select_category: "Санатты таңдаңыз", booking: "Байланыс",
        booking_req_title: "Тікелей байланыс",
        booking_req_text: "Жобалар мен ынтымақтастықты талқылау үшін Telegram-ға жазыңыз.",
        booking_req_btn: "Telegram-ға жазу",
        booking_req_btn_send: "Жіберу",
        load_more: "Көбірек көрсету",
        form_success: "Хабарлама жіберілді!"
    }
};

let currentLang = 'ru';

function setLang(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang]?.[key]) el.innerText = translations[lang][key];
    });
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('lang-active'));
    document.getElementById('btn-' + lang).classList.add('lang-active');

    // Update load more button text
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) loadMoreBtn.textContent = translations[lang].load_more;
}

// ─── NETLIFY IDENTITY REDIRECT ───
if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
        if (!user) {
            window.netlifyIdentity.on("login", () => { document.location.href = "/admin/"; });
        }
    });
}

// ─── 2. FILTER SYSTEM ───
const titleMap = {
    all: 'All', beauty: 'Beauty', streetwear: 'Streetwear',
    commercial: 'Commercial', casual: 'Casual', ugc: 'UGC',
    food: 'Food & Bev', acting: 'Acting'
};

const categoryOrder = ['beauty', 'streetwear', 'commercial', 'casual', 'ugc', 'food', 'acting'];

function buildFilters(data) {
    const activeCats = new Set();

    if (data.photos) data.photos.forEach(p => {
        p.category.split(' ').forEach(c => activeCats.add(c));
    });
    if (data.videos) data.videos.forEach(v => {
        if (v.src) v.category.split(' ').forEach(c => activeCats.add(c));
    });

    const sorted = [...activeCats].sort((a, b) => {
        const ia = categoryOrder.indexOf(a);
        const ib = categoryOrder.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
    });

    const container = document.getElementById('filter-buttons');
    container.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.id = 'filter-all';
    allBtn.className = 'filter-btn active px-2 md:px-4 py-1';
    allBtn.textContent = 'All';
    allBtn.onclick = () => filterContent('all');
    container.appendChild(allBtn);

    sorted.forEach(cat => {
        const sep = document.createElement('span');
        sep.className = 'text-gray-300 px-1 md:px-2';
        sep.textContent = '/';
        container.appendChild(sep);

        const btn = document.createElement('button');
        btn.id = 'filter-' + cat;
        btn.className = 'filter-btn px-2 md:px-4 py-1';
        btn.textContent = titleMap[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
        btn.onclick = () => filterContent(cat);
        container.appendChild(btn);
    });
}

function filterContent(category) {
    document.getElementById('filters-section').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('category-title-photo').innerText = titleMap[category] || 'Portfolio';
    document.getElementById('category-title-video').innerText = titleMap[category] || 'Portfolio';

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filter-' + category)?.classList.add('active');

    const items = document.querySelectorAll('.media-item');

    items.forEach(el => el.classList.add('filtering'));

    setTimeout(() => {
        items.forEach(el => {
            if (!el.hasAttribute('data-category')) return;
            const cats = el.getAttribute('data-category').split(' ');
            el.classList.toggle('hidden-item', category !== 'all' && !cats.includes(category));
        });

        checkEmpty('photo-grid', 'photo-empty');
        checkEmpty('video-grid', 'video-empty');

        // Reset load more when filtering
        currentPhotoLimit = PHOTOS_PER_PAGE;
        updatePhotoVisibility();

        requestAnimationFrame(() => {
            items.forEach(el => el.classList.remove('filtering'));
        });
    }, 300);
}

function checkEmpty(gridId, emptyId) {
    const visible = document.querySelectorAll('#' + gridId + ' .media-item:not(.hidden-item)');
    document.getElementById(emptyId).classList.toggle('visible', visible.length === 0);
}

// ─── 3. PHOTO LIGHTBOX ───
let photoIndex = 0;
let isPanning = false;
let startCoords = { x: 0, y: 0 };
let translateCoords = { x: 0, y: 0 };
let wasDragged = false;

function getVisiblePhotos() {
    return [...document.querySelectorAll('#photo-grid .media-item:not(.hidden-item):not([style*="display: none"]) img')];
}
function updatePhotoCounter(photos) {
    document.getElementById('lb-photo-counter').innerText = (photoIndex + 1) + ' / ' + photos.length;
}
function setLightboxImage(src) {
    const lbImg = document.getElementById('lightbox-img');
    const loader = document.getElementById('photo-loader');

    lbImg.classList.remove('zoomed');
    lbImg.style.transform = '';
    translateCoords = { x: 0, y: 0 };
    loader.style.display = 'block';
    lbImg.style.opacity = '0.5';

    lbImg.onload = () => { loader.style.display = 'none'; lbImg.style.opacity = '1'; };
    lbImg.src = src;
    if (lbImg.complete) { loader.style.display = 'none'; lbImg.style.opacity = '1'; }
}
function openPhoto(img) {
    const photos = getVisiblePhotos();
    photoIndex = photos.indexOf(img);
    setLightboxImage(img.dataset.fullSrc || img.src);
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
    updatePhotoCounter(photos);
    window.location.hash = 'photo-' + img.dataset.id;
}
function closePhoto(skipHistory = false) {
    document.getElementById('lightbox').classList.remove('open');
    const img = document.getElementById('lightbox-img');
    img.classList.remove('zoomed');
    img.style.transform = '';
    document.getElementById('photo-loader').style.display = 'none';
    document.body.style.overflow = '';
    if (skipHistory !== true) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }
}
function photoGo(dir) {
    const photos = getVisiblePhotos();
    photoIndex = (photoIndex + dir + photos.length) % photos.length;
    const img = photos[photoIndex];
    setLightboxImage(img.dataset.fullSrc || img.src);
    updatePhotoCounter(photos);
    history.replaceState(null, null, '#photo-' + photos[photoIndex].dataset.id);
}

document.getElementById('lb-photo-close').onclick = () => closePhoto();
document.getElementById('lb-photo-prev').onclick = (e) => { e.stopPropagation(); photoGo(-1); };
document.getElementById('lb-photo-next').onclick = (e) => { e.stopPropagation(); photoGo(1); };
document.getElementById('lightbox').addEventListener('click', function (e) {
    if (e.target === this) closePhoto();
});

const lbImg = document.getElementById('lightbox-img');

lbImg.addEventListener('mousedown', (e) => {
    if (!lbImg.classList.contains('zoomed')) return;
    isPanning = true;
    wasDragged = false;
    startCoords.x = e.clientX - translateCoords.x;
    startCoords.y = e.clientY - translateCoords.y;
    lbImg.style.transition = 'none';
    e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    e.preventDefault();
    const x = e.clientX - startCoords.x;
    const y = e.clientY - startCoords.y;
    if (Math.abs(x - translateCoords.x) > 2 || Math.abs(y - translateCoords.y) > 2) wasDragged = true;
    translateCoords = { x, y };
    lbImg.style.transform = `translate(${x}px, ${y}px) scale(2.5)`;
});

window.addEventListener('mouseup', () => {
    if (isPanning) {
        isPanning = false;
        lbImg.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    }
});

lbImg.addEventListener('click', function (e) {
    e.stopPropagation();
    if (wasDragged) return;

    if (this.classList.contains('zoomed')) {
        this.classList.remove('zoomed');
        this.style.transform = '';
        translateCoords = { x: 0, y: 0 };
    } else {
        this.classList.add('zoomed');
    }
});

// SHARE BUTTON
document.getElementById('lb-photo-share').onclick = async (e) => {
    e.stopPropagation();
    const url = window.location.href;
    if (navigator.share) {
        try { await navigator.share({ title: 'Dilyara Model Portfolio', url: url }); } catch (err) { }
    } else {
        navigator.clipboard.writeText(url).then(() => alert('Ссылка скопирована в буфер обмена!'));
    }
};

// DOWNLOAD BUTTON
document.getElementById('lb-photo-download').onclick = (e) => {
    e.stopPropagation();
    const img = document.getElementById('lightbox-img');
    const link = document.createElement('a');
    link.href = img.src;
    link.download = img.src.split('/').pop() || 'download.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ─── 4. VIDEO LIGHTBOX ───
let videoIndex = 0;

function getVisibleVideos() {
    return [...document.querySelectorAll('#video-grid .video-thumb.media-item:not(.hidden-item)')];
}
function updateVideoCounter(videos) {
    document.getElementById('lb-video-counter').innerText = (videoIndex + 1) + ' / ' + videos.length;
}
function openVideo(thumb) {
    const videos = getVisibleVideos();
    videoIndex = videos.indexOf(thumb);
    renderVideoLightbox(thumb);
    document.getElementById('video-lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
    updateVideoCounter(videos);
    window.location.hash = 'video-' + thumb.dataset.id;
}
function closeVideo(skipHistory = false) {
    const v = document.querySelector('#video-lightbox-inner video');
    if (v) { v.pause(); v.src = ''; }
    document.getElementById('video-lightbox-inner').innerHTML = '';
    document.getElementById('video-lightbox').classList.remove('open');
    document.body.style.overflow = '';
    if (skipHistory !== true) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }
}
function videoGo(dir) {
    const videos = getVisibleVideos();
    const v = document.querySelector('#video-lightbox-inner video');
    if (v) { v.pause(); v.src = ''; }
    document.getElementById('video-lightbox-inner').innerHTML = '';
    videoIndex = (videoIndex + dir + videos.length) % videos.length;
    renderVideoLightbox(videos[videoIndex]);
    updateVideoCounter(videos);
    history.replaceState(null, null, '#video-' + videos[videoIndex].dataset.id);
}
function renderVideoLightbox(thumb) {
    const src = thumb.getAttribute('data-src') || '';
    const videoUrl = thumb.getAttribute('data-video-url') || '';
    const label = thumb.getAttribute('data-label') || '';
    const poster = thumb.getAttribute('data-poster') || '';
    const inner = document.getElementById('video-lightbox-inner');

    if (src) {
        inner.classList.remove('landscape');
        inner.classList.remove('portrait');
        inner.innerHTML = `
            <div class="video-loader"></div>
            <video controls autoplay playsinline ${poster ? 'poster="' + poster + '"' : ''}>
                <source src="${src}">
            </video>
            ${label ? '<div id="video-lightbox-title">' + label + '</div>' : ''}
        `;

        const video = inner.querySelector('video');
        const loader = inner.querySelector('.video-loader');

        const showLoader = () => loader.style.display = 'block';
        const hideLoader = () => loader.style.display = 'none';

        video.addEventListener('loadstart', showLoader);
        video.addEventListener('waiting', showLoader);
        video.addEventListener('canplay', hideLoader);
        video.addEventListener('playing', hideLoader);

        if (video.readyState < 3) showLoader();
    } else if (videoUrl) {
        let embedSrc = '';
        let isVertical = false;

        const shortsMatch = videoUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
        const ytMatch = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        const vimeoMatch = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);

        if (shortsMatch) {
            embedSrc = `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&rel=0&modestbranding=1&loop=1&playlist=${shortsMatch[1]}`;
            isVertical = true;
        } else if (ytMatch) {
            embedSrc = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
        } else if (vimeoMatch) {
            embedSrc = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
        }

        if (embedSrc) {
            if (isVertical) { inner.classList.remove('landscape'); inner.classList.add('portrait'); }
            else { inner.classList.add('landscape'); inner.classList.remove('portrait'); }

            inner.innerHTML = `
                <iframe src="${embedSrc}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
                ${label ? '<div id="video-lightbox-title">' + label + '</div>' : ''}
            `;
        } else if (videoUrl.includes('instagram.com')) {
            inner.classList.remove('landscape');
            inner.classList.add('portrait');
            inner.innerHTML = `
                <div style="width:100%; aspect-ratio:9/16; background:#111; display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 1rem; padding: 2rem; text-align: center;">
                    <i class="ri-instagram-line" style="font-size: 3rem; color: #E1306C;"></i>
                    <p style="color: white; font-family: 'Space Grotesk', sans-serif; font-size: 0.9rem;">Instagram Video</p>
                </div>
                ${label ? '<div id="video-lightbox-title">' + label + '</div>' : ''}
            `;
        }
    }
}

document.getElementById('lb-video-close').onclick = () => closeVideo();
document.getElementById('lb-video-share').onclick = document.getElementById('lb-photo-share').onclick;
document.getElementById('lb-video-prev').onclick = (e) => { e.stopPropagation(); videoGo(-1); };
document.getElementById('lb-video-next').onclick = (e) => { e.stopPropagation(); videoGo(1); };
document.getElementById('video-lightbox').addEventListener('click', function (e) {
    if (e.target === this) closeVideo();
});

// ─── 5. KEYBOARD & SWIPE ───
document.addEventListener('keydown', (e) => {
    if (document.getElementById('lightbox').classList.contains('open')) {
        if (e.key === 'ArrowRight') { e.preventDefault(); photoGo(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); photoGo(-1); }
        if (e.key === 'Escape') { e.preventDefault(); closePhoto(); }
    }
    if (document.getElementById('video-lightbox').classList.contains('open')) {
        if (e.key === 'ArrowRight') { e.preventDefault(); videoGo(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); videoGo(-1); }
        if (e.key === 'Escape') { e.preventDefault(); closeVideo(); }
    }
});

function handleSwipe(el, callback) {
    let touchStartX = 0;
    let touchStartY = 0;

    el.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    el.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > 50 && Math.abs(diffY) < 30) {
            if (diffX < 0) callback(1);
            if (diffX > 0) callback(-1);
        }
    }, { passive: true });
}

handleSwipe(document.getElementById('lightbox'), (dir) => {
    if (!document.getElementById('lightbox-img').classList.contains('zoomed')) photoGo(dir);
});
handleSwipe(document.getElementById('video-lightbox'), videoGo);

// Browser back button
window.addEventListener('popstate', () => {
    const hash = window.location.hash;
    if (!hash || (!hash.startsWith('#photo-') && !hash.startsWith('#video-'))) {
        if (document.getElementById('lightbox').classList.contains('open')) closePhoto(true);
        if (document.getElementById('video-lightbox').classList.contains('open')) closeVideo(true);
    }
});

// ─── 6. INTERSECTION OBSERVER (ANIMATIONS) ───
const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));

// ─── 7. COMBINED SCROLL HANDLER ───
const headerImg = document.getElementById('header-img');
const backToTop = document.getElementById('back-to-top');
const tgBtn = document.getElementById('telegram-float');
const stickyNav = document.getElementById('sticky-nav');
let scrollTimeout;
let lastScrollY = 0;
let ticking = false;

function onScroll() {
    const scrollY = window.scrollY;

    // Header parallax
    if (headerImg) {
        headerImg.style.transform = `translateY(${scrollY * 0.1}px)`;
        headerImg.style.filter = `grayscale(100%) contrast(1.25) blur(${Math.min(scrollY * 0.04, 20)}px) brightness(${Math.max(0.2, 1 - scrollY / 600)})`;
    }

    // Back to top button
    if (backToTop) {
        if (scrollY > 300) {
            backToTop.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            backToTop.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    // Sticky navigation — show after scrolling past header
    if (stickyNav) {
        const headerHeight = document.querySelector('header')?.offsetHeight || 600;
        if (scrollY > headerHeight - 100) {
            stickyNav.classList.add('visible');
        } else {
            stickyNav.classList.remove('visible');
        }

        // Highlight active section
        const sections = ['about', 'filters-section', 'booking'];
        const navLinks = stickyNav.querySelectorAll('a');
        let currentSection = '';

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.getBoundingClientRect().top < window.innerHeight / 2) {
                currentSection = id;
            }
        });

        navLinks.forEach(link => {
            const href = link.getAttribute('href')?.replace('#', '');
            link.classList.toggle('active', href === currentSection);
        });
    }

    // Telegram button auto-hide during scroll
    if (tgBtn) {
        tgBtn.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            tgBtn.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
        }, 500);
    }

    lastScrollY = scrollY;
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
    }
}, { passive: true });

// ─── 8. LOAD MORE ───
const PHOTOS_PER_PAGE = 12;
let currentPhotoLimit = PHOTOS_PER_PAGE;

function updatePhotoVisibility() {
    const allPhotos = document.querySelectorAll('#photo-grid .media-item:not(.hidden-item)');
    const loadMoreBtn = document.getElementById('load-more-btn');
    let visibleCount = 0;

    allPhotos.forEach((item, i) => {
        if (i < currentPhotoLimit) {
            item.style.display = '';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    if (loadMoreBtn) {
        if (visibleCount < allPhotos.length) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.textContent = translations[currentLang].load_more + ` (${allPhotos.length - visibleCount})`;
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

function loadMore() {
    currentPhotoLimit += PHOTOS_PER_PAGE;
    updatePhotoVisibility();

    // Animate new items
    const allPhotos = document.querySelectorAll('#photo-grid .media-item:not(.hidden-item)');
    allPhotos.forEach((item, i) => {
        if (i >= currentPhotoLimit - PHOTOS_PER_PAGE && i < currentPhotoLimit) {
            item.classList.remove('visible');
            requestAnimationFrame(() => {
                setTimeout(() => item.classList.add('visible'), (i % PHOTOS_PER_PAGE) * 50);
            });
        }
    });
}

// ─── 9. 3D TILT EFFECT ───
function initTiltEffect() {
    const isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) return; // Skip on mobile

    document.getElementById('photo-grid')?.addEventListener('mousemove', (e) => {
        const thumb = e.target.closest('.photo-thumb');
        if (!thumb) return;

        const rect = thumb.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        const rotateX = y * -6; // ±3 degrees
        const rotateY = x * 6;

        thumb.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        thumb.style.transition = 'transform 0.1s ease';
    });

    document.getElementById('photo-grid')?.addEventListener('mouseleave', (e) => {
        const thumb = e.target.closest('.photo-thumb');
        if (thumb) {
            thumb.style.transform = '';
            thumb.style.transition = 'transform 0.5s ease';
        }
    }, true);

    // Reset on mouseout from each thumb
    document.getElementById('photo-grid')?.addEventListener('mouseout', (e) => {
        const thumb = e.target.closest('.photo-thumb');
        if (thumb && !thumb.contains(e.relatedTarget)) {
            thumb.style.transform = '';
            thumb.style.transition = 'transform 0.5s ease';
        }
    });
}

// ─── 10. CONTACT FORM AJAX ───
function initContactForm() {
    const form = document.querySelector('form[name="contact"]');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;"><span class="loader" style="width:16px;height:16px;border-width:2px;display:inline-block;"></span></span>';
        btn.disabled = true;

        try {
            const formData = new FormData(form);
            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            });

            if (response.ok) {
                // Show success message
                form.innerHTML = `
                    <div class="form-success visible">
                        <i class="ri-check-double-line"></i>
                        <p data-i18n="form_success">${translations[currentLang].form_success}</p>
                    </div>
                `;
            } else {
                throw new Error('Form submission failed');
            }
        } catch (err) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            alert('Ошибка отправки. Попробуйте ещё раз.');
        }
    });
}

// ─── 11. INIT PORTFOLIO ───
async function initPortfolio() {
    try {
        const response = await fetch('./data.json?t=' + Date.now());
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();

        // BUILD DYNAMIC FILTER BUTTONS
        buildFilters(data);

        // RENDER PHOTOS
        const photoGrid = document.getElementById('photo-grid');
        const photoEmpty = document.getElementById('photo-empty');

        if (data.photos) data.photos.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'media-item photo-thumb reveal-item';
            div.dataset.category = item.category;

            const img = document.createElement('img');
            img.loading = 'lazy';
            img.decoding = 'async';
            img.src = item.thumb || item.src;
            img.dataset.fullSrc = item.src;
            img.alt = item.alt;
            img.dataset.id = index;
            img.onerror = function () {
                this.closest('.media-item').remove();
                checkEmpty('photo-grid', 'photo-empty');
            };

            const wrapper = document.createElement('div');
            wrapper.className = 'parallax-wrapper';
            wrapper.appendChild(img);

            div.innerHTML = `<div class="zoom-overlay"><i class="ri-zoom-in-line"></i><span class="photo-cat">${item.category}</span></div>`;
            div.prepend(wrapper);
            div.addEventListener('click', () => openPhoto(img));

            photoGrid.insertBefore(div, photoEmpty);
        });

        // ADD LOAD MORE BUTTON
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'load-more-btn';
        loadMoreBtn.textContent = translations[currentLang].load_more;
        loadMoreBtn.onclick = loadMore;
        photoGrid.parentNode.appendChild(loadMoreBtn);

        // Apply initial visibility
        updatePhotoVisibility();

        // RENDER VIDEOS
        const videoGrid = document.getElementById('video-grid');
        const videoEmpty = document.getElementById('video-empty');

        const videoLazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    if (video.dataset.src) {
                        video.src = video.dataset.src;
                        video.removeAttribute('data-src');
                        videoLazyLoadObserver.unobserve(video);
                    }
                }
            });
        }, { rootMargin: '200px' });

        const videoAutoplayObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                const thumb = video.closest('.video-thumb');
                if (entry.isIntersecting) {
                    video.muted = true;
                    video.play().then(() => thumb && thumb.classList.add('playing')).catch(() => { });
                } else {
                    video.pause();
                    if (thumb) thumb.classList.remove('playing');
                }
            });
        }, { threshold: 0.5 });

        if (data.videos) data.videos.forEach((item, index) => {
            if (!item.src) return;

            const div = document.createElement('div');
            div.className = 'media-item video-thumb reveal-item';
            div.dataset.category = item.category;
            div.dataset.src = item.src || '';
            div.dataset.videoUrl = item.video_url || '';
            div.dataset.label = item.label || '';
            div.dataset.poster = item.poster || '';
            div.dataset.id = index;

            let innerContent = '';
            let muteBtnHtml = '';

            if (item.src) {
                innerContent = `<video data-src="${item.src}" poster="${item.poster || ''}" muted loop playsinline preload="none" class="preview-video"></video>`;
                muteBtnHtml = `<div class="mute-btn"><i class="ri-volume-mute-line"></i></div>`;
            } else if (item.poster) {
                innerContent = `<img src="${item.poster}" onerror="this.closest('.media-item').remove(); checkEmpty('video-grid', 'video-empty');" alt="Cover" class="w-full h-full object-cover">`;
            } else {
                innerContent = `<div class="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center"><i class="ri-movie-fill text-2xl text-gray-400"></i></div>`;
            }

            div.innerHTML = `
                ${innerContent}
                <div class="grid-video-loader"></div>
                <div class="play-overlay"><i class="ri-play-circle-line"></i></div>
                ${muteBtnHtml}
                <div class="reels-icon"><i class="ri-movie-fill"></i></div>
                <span class="vid-label">${(item.label || '').split(' ')[0]}</span>
            `;

            div.addEventListener('click', () => openVideo(div));
            const previewVideo = div.querySelector('.preview-video');
            if (previewVideo) {
                videoLazyLoadObserver.observe(previewVideo);
                videoAutoplayObserver.observe(previewVideo);

                const loader = div.querySelector('.grid-video-loader');
                if (loader) {
                    previewVideo.addEventListener('loadstart', () => {
                        if (previewVideo.readyState < 3) loader.style.display = 'block';
                    });
                    previewVideo.addEventListener('waiting', () => loader.style.display = 'block');
                    previewVideo.addEventListener('playing', () => loader.style.display = 'none');
                    previewVideo.addEventListener('canplay', () => loader.style.display = 'none');
                    previewVideo.addEventListener('stalled', () => loader.style.display = 'block');
                }

                const muteBtn = div.querySelector('.mute-btn');
                if (muteBtn) {
                    muteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        previewVideo.muted = !previewVideo.muted;
                        muteBtn.innerHTML = previewVideo.muted ? '<i class="ri-volume-mute-line"></i>' : '<i class="ri-volume-up-line"></i>';
                    });
                }
            }

            videoGrid.insertBefore(div, videoEmpty);
        });

        // START ANIMATIONS & EFFECTS
        startAnimations();
        startParallax();
        initTiltEffect();
        initContactForm();

        checkEmpty('photo-grid', 'photo-empty');
        checkEmpty('video-grid', 'video-empty');

        // URL hash check
        const hash = window.location.hash;
        if (hash) {
            if (hash.startsWith('#photo-')) {
                const id = hash.replace('#photo-', '');
                const el = document.querySelector(`#photo-grid img[data-id="${id}"]`);
                if (el) { filterContent('all'); openPhoto(el); }
            } else if (hash.startsWith('#video-')) {
                const id = hash.replace('#video-', '');
                const el = document.querySelector(`#video-grid .video-thumb[data-id="${id}"]`);
                if (el) { filterContent('all'); openVideo(el); }
            }
        }

    } catch (error) {
        console.error('Error loading portfolio:', error);
        document.getElementById('preloader').style.display = 'none';
    }
}

function startAnimations() {
    const preloader = document.getElementById('preloader');
    const mediaItems = document.querySelectorAll('.media-item');

    setTimeout(() => {
        preloader.classList.add('opacity-0', 'pointer-events-none');
        document.body.classList.remove('overflow-hidden');
        document.getElementById('lang-switcher').classList.add('visible');

        const mediaObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    mediaObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        mediaItems.forEach(item => mediaObserver.observe(item));
    }, 500);
}

function startParallax() {
    function loop() {
        const thumbs = document.querySelectorAll('.photo-thumb');
        thumbs.forEach(thumb => {
            const wrapper = thumb.querySelector('.parallax-wrapper');
            if (!wrapper) return;

            const rect = thumb.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const speed = 0.1;
                const offset = (rect.top - window.innerHeight / 2) * speed;
                wrapper.style.transform = `translateY(${offset}px)`;
            }
        });
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

// Init on load
window.addEventListener('load', initPortfolio);

// Set default language
setLang('ru');
