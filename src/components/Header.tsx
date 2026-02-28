"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function Header({
    categories,
    activeCategory,
    setActiveCategory,
}: {
    categories: string[];
    activeCategory: string;
    setActiveCategory: (cat: string) => void;
}) {
    return (
        <header className="fixed top-0 w-full z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between glass-dark rounded-2xl px-6 py-4">
                {/* Logo */}
                <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl md:text-3xl font-light tracking-widest text-white text-glow"
                    >
                        DILYARA
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xs tracking-[0.3em] text-neutral-400 mt-1 uppercase"
                    >
                        Model & Creator
                    </motion.p>
                </div>

                {/* Dynamic Filters */}
                <nav className="flex flex-wrap justify-center gap-2 md:gap-4 mt-2 md:mt-0">
                    <FilterButton
                        label="All"
                        isActive={activeCategory === "all"}
                        onClick={() => setActiveCategory("all")}
                    />
                    {categories.map((cat) => (
                        <FilterButton
                            key={cat}
                            label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                            isActive={activeCategory === cat}
                            onClick={() => setActiveCategory(cat)}
                        />
                    ))}
                </nav>
            </div>
        </header>
    );
}

function FilterButton({
    label,
    isActive,
    onClick,
}: {
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative px-4 py-1.5 text-sm md:text-base rounded-full transition-colors ${isActive ? "text-white" : "text-neutral-400 hover:text-white"
                }`}
        >
            {isActive && (
                <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-white/10 border border-white/20 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
            <span className="relative z-10 font-light tracking-wider">{label}</span>
        </button>
    );
}
