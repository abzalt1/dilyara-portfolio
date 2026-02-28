"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative z-10 px-4">
            <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-[10rem] md:text-[15rem] font-bold text-white/5 leading-none absolute select-none pointer-events-none"
            >
                404
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-dark p-8 md:p-12 rounded-3xl text-center max-w-lg w-full relative z-20"
            >
                <h2 className="text-2xl md:text-3xl font-light text-white mb-4 tracking-wide text-glow">
                    Page Not Found
                </h2>
                <p className="text-neutral-400 mb-8 font-light leading-relaxed">
                    The image or dimension you are looking for has shifted into another reality.
                </p>

                <Link
                    href="/"
                    className="inline-block px-8 py-3 bg-white text-black rounded-full font-medium tracking-wide hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                >
                    Return Home
                </Link>
            </motion.div>
        </div>
    );
}
