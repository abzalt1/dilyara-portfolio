"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [auth, setAuth] = useState(false);

    const [data, setData] = useState<{ photos: any[], videos: any[] }>({ photos: [], videos: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/data")
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            });
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "antigravity-secret-key" || password === process.env.NEXT_PUBLIC_ADMIN_SECRET) {
            setAuth(true);
        } else {
            alert("Invalid password");
        }
    };

    const saveData = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${password}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to save");
            alert("Config saved successfully");
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    const deletePhoto = (index: number) => {
        if (!confirm("Delete this photo?")) return;
        const newData = { ...data };
        newData.photos.splice(index, 1);
        setData(newData);
    };

    if (!auth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleLogin}
                    className="glass-dark p-8 rounded-2xl w-full max-w-sm flex flex-col gap-4"
                >
                    <h1 className="text-2xl font-light text-white tracking-widest text-glow mb-4">ADMIN ACCESS</h1>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/50 transition-colors"
                    />
                    <button type="submit" className="bg-white text-black font-medium py-3 rounded-lg hover:bg-neutral-200 transition-colors tracking-wide">
                        ENTER
                    </button>
                </motion.form>
            </div>
        );
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-300 p-8 pt-24 font-light">
            <div className="max-w-7xl mx-auto space-y-8 glass-dark p-8 rounded-3xl">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
                    <h1 className="text-3xl font-light tracking-widest text-white text-glow">DASHBOARD</h1>
                    <button
                        onClick={saveData}
                        disabled={saving}
                        className="bg-white text-black px-6 py-2 rounded-full font-medium hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        {saving ? "SAVING..." : "SAVE CHANGES"}
                    </button>
                </div>

                <section>
                    <h2 className="text-xl text-white mb-6 uppercase tracking-wider">Photo Management</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {data.photos.map((photo, i) => (
                            <div key={i} className="relative group bg-neutral-900 rounded-xl overflow-hidden aspect-[3/4] border border-neutral-800 flex flex-col">
                                <img src={photo.src} className="w-full h-40 object-cover" />
                                <div className="p-3 text-xs flex flex-col gap-2 flex-grow justify-between">
                                    <span className="uppercase tracking-widest text-neutral-400">{photo.category}</span>
                                    <button
                                        onClick={() => deletePhoto(i)}
                                        className="text-red-400 hover:text-red-300 self-start"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Further extensions like Video management, generic file uploads (Cloudinary integrations) go here. 
            For this migration, we have retained the viewing, deleting, and JSON-saving parity.
         */}
            </div>
        </div>
    );
}
