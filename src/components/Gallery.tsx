"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

type MediaItem = {
    id: string;
    type: "photo" | "video";
    src: string;
    category: string;
    video_url?: string;
    aspectRatio?: number; // optional pre-calculated aspect ratio
};

export function MediaGallery({
    items,
    activeCategory
}: {
    items: MediaItem[];
    activeCategory: string;
}) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filteredItems = items.filter(
        (item) => activeCategory === "all" || item.category === activeCategory
    );

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-40 pb-20">
            <motion.div
                layout
                className="columns-1 sm:columns-2 lg:columns-3 gap-4 lg:gap-6 space-y-4 lg:space-y-6"
            >
                <AnimatePresence>
                    {filteredItems.map((item) => (
                        <motion.div
                            layoutId={`media-container-${item.id}`}
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="relative group cursor-pointer overflow-hidden rounded-2xl glass-dark break-inside-avoid"
                            onClick={() => setSelectedId(item.id)}
                        >
                            {item.type === "photo" ? (
                                // We use standard img for simplicity here until Next/Image is fully configured for dynamic sizes
                                <img
                                    src={item.src}
                                    alt={`Dilyara ${item.category}`}
                                    loading="lazy"
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="relative w-full">
                                    <video
                                        src={item.src}
                                        muted
                                        loop
                                        playsInline
                                        autoPlay
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {/* Video Indicator */}
                                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full p-2">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <span className="text-white text-sm tracking-widest uppercase font-light">
                                    {item.category}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Lightbox / Modal Expansion */}
            <AnimatePresence>
                {selectedId && (
                    <Lightbox
                        item={items.find(i => i.id === selectedId)!}
                        onClose={() => setSelectedId(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function Lightbox({ item, onClose }: { item: MediaItem; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8"
            onClick={onClose}
        >
            <motion.button
                className="absolute top-6 right-6 text-white/50 hover:text-white z-[110] p-2 bg-white/10 rounded-full backdrop-blur-md"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.3 } }}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </motion.button>

            <motion.div
                layoutId={`media-container-${item.id}`}
                className="relative max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800"
                onClick={(e) => e.stopPropagation()} // Prevent click-through closing
            >
                {item.type === "photo" ? (
                    <img
                        src={item.src}
                        alt="Expanded view"
                        className="max-w-full max-h-[85vh] object-contain"
                    />
                ) : (
                    <video
                        src={item.src}
                        controls
                        autoPlay
                        className="max-w-full max-h-[85vh] object-contain"
                    />
                )}
                <div className="absolute outline-none bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-6">
                    <span className="text-white/70 text-sm tracking-widest uppercase font-light">
                        {item.category}
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
}
