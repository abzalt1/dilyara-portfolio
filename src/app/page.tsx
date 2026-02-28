"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";

// ─── 1. TRANSLATIONS ───
const translations = {
  ru: {
    role: "Коммерческая модель",
    location: "Алматы, Казахстан",
    about_title: "О модели",
    about_text:
      "В моделинге с 2025 года. Специализация: beauty, наружная реклама, street-style. Активно снимаюсь в Reels, Shorts и рекламных интеграциях. Профессионально создаю UGC-контент.",
    select_category: "Выберите категорию",
    booking: "Контакты",
    booking_req_title: "Прямая связь",
    booking_req_text: "Для обсуждения проектов и сотрудничества пишите в Telegram.",
    booking_req_btn: "Написать в Telegram",
    booking_req_btn_send: "Отправить",
    load_more: "Показать ещё",
    form_success: "Сообщение отправлено!",
  },
  en: {
    role: "Commercial Model",
    location: "Based in Almaty",
    about_title: "About Model",
    about_text:
      "Modeling since 2025. Specializing in beauty, outdoor advertising, street-style. Active in Reels, Shorts, and ad integrations. Professional UGC content creator.",
    select_category: "Select Category",
    booking: "Booking",
    booking_req_title: "Direct Booking",
    booking_req_text: "For inquiries and collaboration please contact me via Telegram.",
    booking_req_btn: "Write on Telegram",
    booking_req_btn_send: "Send",
    load_more: "Load More",
    form_success: "Message sent!",
  },
  kk: {
    role: "Коммерциялық модель",
    location: "Алматы, Қазақстан",
    about_title: "Модель туралы",
    about_text:
      "2025 жылдан бері модельдингте. Мамандануы: beauty, сыртқы жарнама, street-style. Reels, Shorts және жарнамалық интеграцияларда белсендімін. Кәсіби UGC контент жасаймын.",
    select_category: "Санатты таңдаңыз",
    booking: "Байланыс",
    booking_req_title: "Тікелей байланыс",
    booking_req_text: "Жобалар мен ынтымақтастықты талқылау үшін Telegram-ға жазыңыз.",
    booking_req_btn: "Telegram-ға жазу",
    booking_req_btn_send: "Жіберу",
    load_more: "Көбірек көрсету",
    form_success: "Хабарлама жіберілді!",
  },
};

const titleMap: Record<string, string> = {
  all: "All",
  beauty: "Beauty",
  streetwear: "Streetwear",
  commercial: "Commercial",
  casual: "Casual",
  ugc: "UGC",
  food: "Food & Bev",
  acting: "Acting",
};

const categoryOrder = ["beauty", "streetwear", "commercial", "casual", "ugc", "food", "acting"];

export default function Home() {
  const [lang, setLangState] = useState<"ru" | "en" | "kk">("ru");
  const t = translations[lang];

  const [data, setData] = useState<{ photos: any[]; videos: any[]; siteImages?: { hero: string; about1: string; about2: string } }>({ photos: [], videos: [] });
  const [activeCategory, setActiveCategory] = useState("all");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [photoLimit, setPhotoLimit] = useState(12);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ type: "photo" | "video" | null; index: number; url?: string }>({
    type: null,
    index: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((fetchedData) => {
        setData(fetchedData);
        const activeCats = new Set<string>();
        if (fetchedData.photos) {
          fetchedData.photos.forEach((p: any) => {
            p.category.split(" ").forEach((c: string) => activeCats.add(c));
          });
        }
        if (fetchedData.videos) {
          fetchedData.videos.forEach((v: any) => {
            if (v.src) v.category.split(" ").forEach((c: string) => activeCats.add(c));
          });
        }
        const sorted = Array.from(activeCats).sort((a, b) => {
          const ia = categoryOrder.indexOf(a);
          const ib = categoryOrder.indexOf(b);
          if (ia === -1 && ib === -1) return a.localeCompare(b);
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });
        setAvailableCategories(sorted);
        setLoading(false);
      });
  }, []);

  const handleFilter = (cat: string) => {
    setActiveCategory(cat);
    setPhotoLimit(12);
  };

  const filteredPhotos = data.photos?.filter((p) => activeCategory === "all" || p.category.includes(activeCategory)) || [];
  const filteredVideos = data.videos?.filter((v) => v.src && (activeCategory === "all" || v.category.includes(activeCategory))) || [];

  const openPhoto = (index: number) => {
    setLightbox({ type: "photo", index });
    document.body.style.overflow = "hidden";
  };

  const openVideo = (index: number) => {
    setLightbox({ type: "video", index });
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightbox({ type: null, index: 0 });
    document.body.style.overflow = "";
  };

  const nextLightbox = () => {
    if (lightbox.type === "photo") {
      setLightbox({ ...lightbox, index: (lightbox.index + 1) % filteredPhotos.length });
    } else if (lightbox.type === "video") {
      setLightbox({ ...lightbox, index: (lightbox.index + 1) % filteredVideos.length });
    }
  };

  const prevLightbox = () => {
    if (lightbox.type === "photo") {
      setLightbox({ ...lightbox, index: (lightbox.index - 1 + filteredPhotos.length) % filteredPhotos.length });
    } else if (lightbox.type === "video") {
      setLightbox({ ...lightbox, index: (lightbox.index - 1 + filteredVideos.length) % filteredVideos.length });
    }
  };

  if (loading) {
    return (
      <div id="preloader" className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
        <div className="text-white font-display font-extralight text-xl tracking-[0.3em] uppercase animate-pulse">
          Loading
        </div>
      </div>
    );
  }

  return (
    <>
      <nav id="sticky-nav" className="hidden lg:flex">
        <a href="#about">About</a>
        <a href="#filters-section">Portfolio</a>
        <a href="#booking">Contact</a>
      </nav>

      <nav className="absolute top-0 w-full z-50 px-6 py-6 flex flex-col md:flex-row gap-4 md:gap-0 justify-end items-center text-white">
        <div id="lang-switcher" className="flex gap-4 text-sm font-extralight uppercase drop-shadow-md bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-black/60 visible pointer-events-auto">
          <button onClick={() => setLangState("en")} className={lang === "en" ? "lang-active" : "hover:opacity-70"}>EN</button>
          <button onClick={() => setLangState("kk")} className={lang === "kk" ? "lang-active" : "hover:opacity-70"}>KK</button>
          <button onClick={() => setLangState("ru")} className={lang === "ru" ? "lang-active" : "hover:opacity-70"}>RU</button>
        </div>
      </nav>

      <header className="relative w-full h-screen flex flex-col justify-end p-4 md:p-8 overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img
            id="header-img"
            src={data.siteImages?.hero || "/img/IMG_6543.jpg"}
            alt="Header"
            className="w-full h-[120%] absolute -top-[10%] left-0 object-cover object-top opacity-70 grayscale contrast-125 will-change-transform"
          />
        </div>
        <div className="relative z-10 w-full mb-8">
          <h1 className="font-display font-extralight text-[13vw] md:text-[13.5vw] leading-[0.8] text-white uppercase mix-blend-difference tracking-tighter w-full">
            Dilyara
          </h1>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-t border-white pt-4 mt-4">
            <h2 className="font-display font-extralight text-[8vw] md:text-[5vw] leading-[0.9] text-white uppercase tracking-tighter">
              Kunanbayeva
            </h2>
            <div className="mt-4 md:mt-0 text-white text-right text-xs font-extralight tracking-[0.2em] uppercase">
              <span>{t.role}</span>
              <br />
              <span>{t.location}</span>
            </div>
          </div>
        </div>
      </header>

      <section id="about" className="grid grid-cols-1 md:grid-cols-12 gap-12 p-6 md:p-12 mt-12 max-w-[1600px] mx-auto">
        <div className="md:col-span-6 md:sticky md:top-24">
          <h3 className="font-display font-extralight text-5xl md:text-7xl uppercase mb-6 leading-[0.9] visible">
            {t.about_title}
          </h3>
          <p className="text-sm md:text-lg leading-relaxed mb-8 font-normal visible">{t.about_text}</p>
          <div className="mb-8 visible">
            <p className="text-xs font-extralight uppercase tracking-widest mb-4 border-b border-black pb-2">Trusted By</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-6 opacity-80">
              <div className="font-display font-extralight text-base md:text-xl uppercase">1fit</div>
              <div className="font-display font-extralight text-base md:text-xl uppercase">KFC</div>
              <div className="font-display font-extralight text-base md:text-xl uppercase">Yichang</div>
              <div className="font-display font-extralight text-base md:text-xl uppercase">Nescafe</div>
              <div className="font-display font-extralight text-base md:text-xl uppercase">Doritos</div>
              <div className="font-display font-extralight text-base md:text-xl uppercase">LC Waikiki</div>
              <div className="font-display font-extralight text-base md:text-xl uppercase leading-tight">MakeUp Revolution</div>
              <div className="font-display font-extralight text-base md:text-xl uppercase">Mary Kay</div>
              <div className="font-display font-extralight text-base md:text-xl uppercase">Eva</div>
            </div>
          </div>
          <div id="model-params" className="border-t-2 border-black pt-6 visible">
            <div className="grid grid-cols-2 font-extralight uppercase tracking-wider gap-y-4">
              <div className="group cursor-default">
                <span className="block text-gray-400 text-xs mb-1 group-hover:text-black transition-colors">Height</span>
                <span className="text-base md:text-xl">165 cm</span>
              </div>
              <div className="group cursor-default">
                <span className="block text-gray-400 text-xs mb-1 group-hover:text-black transition-colors">Eyes</span>
                <span className="text-base md:text-xl">Amber</span>
              </div>
              <div className="group cursor-default">
                <span className="block text-gray-400 text-xs mb-1 group-hover:text-black transition-colors">Bust</span>
                <span className="text-base md:text-xl">82 cm</span>
              </div>
              <div className="group cursor-default">
                <span className="block text-gray-400 text-xs mb-1 group-hover:text-black transition-colors">Hair</span>
                <span className="text-base md:text-xl">Black</span>
              </div>
              <div className="group cursor-default">
                <span className="block text-gray-400 text-xs mb-1 group-hover:text-black transition-colors">Waist</span>
                <span className="text-base md:text-xl">60 cm</span>
              </div>
              <div className="group cursor-default">
                <span className="block text-gray-400 text-xs mb-1 group-hover:text-black transition-colors">Shoes</span>
                <span className="text-base md:text-xl">37.5</span>
              </div>
              <div className="group cursor-default">
                <span className="block text-gray-400 text-xs mb-1 group-hover:text-black transition-colors">Hips</span>
                <span className="text-base md:text-xl">93 cm</span>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-6 grid grid-cols-2 gap-4">
          <div className="aspect-[2/3] overflow-hidden transition-all duration-700">
            <img src={data.siteImages?.about1 || "/img/IMG_7263.jpg"} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Model" />
          </div>
          <div className="aspect-[2/3] overflow-hidden mt-16 transition-all duration-700">
            <img src={data.siteImages?.about2 || "/img/IMG_8558.jpg"} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Model" />
          </div>
        </div>
      </section>

      <div id="filters-section" className="mt-24 border-t-2 border-b-2 border-black bg-white visible">
        <div className="text-center py-4 border-b-2 border-black bg-black text-white">
          <span className="text-sm md:text-base font-extralight uppercase tracking-[0.3em]">{t.select_category}</span>
        </div>
        <div id="filter-buttons" className="flex flex-wrap justify-center gap-x-3 md:gap-x-6 gap-y-2 md:gap-y-4 py-6 md:py-8 px-4 font-display text-xl md:text-5xl uppercase font-extralight text-center">
          <button onClick={() => handleFilter("all")} className={`filter-btn px-2 md:px-4 py-1 ${activeCategory === "all" ? "active" : ""}`}>
            All
          </button>
          {availableCategories.map((cat) => (
            <div key={cat} className="flex items-center">
              <span className="text-gray-300 px-1 md:px-2">/</span>
              <button onClick={() => handleFilter(cat)} className={`filter-btn px-2 md:px-4 py-1 ${activeCategory === cat ? "active" : ""}`}>
                {titleMap[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            </div>
          ))}
        </div>
      </div>

      <section id="portfolio-view" className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="border-r border-black p-6 md:p-12">
          <h3 className="font-display font-extralight text-4xl uppercase mb-8 flex items-center gap-4 visible">
            <i className="ri-camera-fill" /> <span>{titleMap[activeCategory] || "Portfolio"}</span> Photos
          </h3>
          <div id="photo-grid">
            {filteredPhotos.length === 0 ? (
              <p className="empty-state visible">Нет фото в этой категории</p>
            ) : (
              filteredPhotos.slice(0, photoLimit).map((p, i) => (
                <div key={i} className="media-item photo-thumb reveal-item visible" onClick={() => openPhoto(i)}>
                  <div className="parallax-wrapper">
                    <img src={p.thumb || p.src} alt={p.alt} loading="lazy" />
                  </div>
                  <div className="zoom-overlay">
                    <i className="ri-zoom-in-line" />
                    <span className="photo-cat">{p.category}</span>
                  </div>
                </div>
              ))
            )}
            {photoLimit < filteredPhotos.length && (
              <button
                id="load-more-btn"
                style={{ display: "block" }}
                onClick={() => setPhotoLimit(photoLimit + 12)}
              >
                {t.load_more} ({filteredPhotos.length - photoLimit})
              </button>
            )}
          </div>
        </div>

        <div className="bg-black text-white p-6 md:p-12">
          <h3 className="font-display font-extralight text-4xl uppercase mb-8 flex items-center gap-4 visible">
            <i className="ri-movie-fill" /> <span>{titleMap[activeCategory] || "Portfolio"}</span> Reels
          </h3>
          <div id="video-grid">
            {filteredVideos.length === 0 ? (
              <p className="empty-state text-white visible">Нет видео в этой категории</p>
            ) : (
              filteredVideos.map((v, i) => (
                <div key={i} className="media-item video-thumb reveal-item visible" onClick={() => openVideo(i)}>
                  <video src={v.src} poster={v.poster || ""} muted loop playsInline preload="none" className="preview-video" autoPlay />
                  <div className="play-overlay">
                    <i className="ri-play-circle-line" />
                  </div>
                  <div className="reels-icon">
                    <i className="ri-movie-fill" />
                  </div>
                  <span className="vid-label">{(v.label || "").split(" ")[0]}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Lightboxes */}
      {lightbox.type === "photo" && (
        <div id="lightbox" className="open" onClick={closeLightbox}>
          <span className="lb-close" onClick={(e) => { e.stopPropagation(); closeLightbox(); }}>✕</span>
          <span className="lb-prev" onClick={(e) => { e.stopPropagation(); prevLightbox(); }}>‹</span>
          <img
            id="lightbox-img"
            src={filteredPhotos[lightbox.index]?.src}
            alt="Lightbox"
            style={{ opacity: 1, transform: "" }}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="lb-next" onClick={(e) => { e.stopPropagation(); nextLightbox(); }}>›</span>
          <span className="lb-counter" id="lb-photo-counter">
            {lightbox.index + 1} / {filteredPhotos.length}
          </span>
        </div>
      )}

      {lightbox.type === "video" && (
        <div id="video-lightbox" className="open" onClick={closeLightbox}>
          <span className="lb-close" onClick={(e) => { e.stopPropagation(); closeLightbox(); }}>✕</span>
          <span className="lb-prev" onClick={(e) => { e.stopPropagation(); prevLightbox(); }}>‹</span>
          <div id="video-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <video controls autoPlay playsInline src={filteredVideos[lightbox.index]?.src} poster={filteredVideos[lightbox.index]?.poster} />
          </div>
          <span className="lb-next" onClick={(e) => { e.stopPropagation(); nextLightbox(); }}>›</span>
          <span className="lb-counter" id="lb-video-counter">
            {lightbox.index + 1} / {filteredVideos.length}
          </span>
        </div>
      )}

      <footer id="booking" className="bg-white text-black border-t-2 border-black visible">
        <div className="overflow-hidden border-b-2 border-black py-4 bg-black text-white">
          <div className="animate-marquee -mx-6 flex w-fit">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex shrink-0">
                <span className="text-4xl md:text-6xl font-display font-extralight uppercase px-6">Dilyara Kunanbayeva</span>
                <span className="text-4xl md:text-6xl font-display font-extralight uppercase px-6 text-gray-400">Model</span>
                <span className="text-4xl md:text-6xl font-display font-extralight uppercase px-6">Dilyara Kunanbayeva</span>
                <span className="text-4xl md:text-6xl font-display font-extralight uppercase px-6 text-gray-400">Model</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-8 md:p-16">
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-display font-extralight text-4xl md:text-7xl lg:text-8xl break-words uppercase mb-8 leading-none tracking-tighter">
                {t.booking}
              </h2>
              <div className="space-y-4">
                <a href="tg://resolve?domain=xiao_odi" className="text-xl md:text-4xl font-display font-extralight uppercase hover:underline flex items-center gap-4">
                  Telegram ↗
                </a>
                <a href="https://instagram.com/bydilyara" target="_blank" className="text-xl md:text-4xl font-display font-extralight uppercase hover:underline flex items-center gap-4">
                  Instagram ↗
                </a>
              </div>
            </div>
            <div className="flex flex-col justify-end items-start">
              <p className="text-lg font-extralight uppercase tracking-[0.2em] mb-6">{t.booking_req_title}</p>
              <a href="tg://resolve?domain=xiao_odi" className="bg-black text-white px-10 py-5 md:px-14 md:py-6 rounded-full text-sm md:text-base font-extralight uppercase tracking-widest hover:bg-gray-800 transition-colors w-full md:w-auto flex items-center justify-center gap-3 whitespace-nowrap">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
                </svg>{" "}
                <span>{t.booking_req_btn}</span>
              </a>
            </div>
          </div>
          <div className="max-w-[1600px] mx-auto mt-12 pt-8 border-t border-gray-200 flex justify-between text-[10px] uppercase font-extralight">
            <p>© 2026 Dilyara Kunanbayeva</p>
            <p>
              Dev by{" "}
              <a href="https://abzalt1.github.io" target="_blank" className="hover:underline">
                Abzalt1.dev
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
