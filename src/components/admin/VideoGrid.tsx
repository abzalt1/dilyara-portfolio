"use client";

import { useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { FiUploadCloud, FiTrash2, FiPlay, FiImage, FiVideo } from "react-icons/fi";

const CATEGORIES = ["beauty", "streetwear", "commercial", "casual", "ugc", "food", "acting"];

export function VideoGrid({ videos, onUpdateVideos, onUploadVideo, onUploadPoster }: { videos: { src: string; video_url?: string; category: string; label?: string; poster?: string; }[]; onUpdateVideos: (videos: { src: string; video_url?: string; category: string; label?: string; poster?: string; }[]) => void; onUploadVideo: (file: File) => Promise<string | null | void>; onUploadPoster: (index: number, file: File) => Promise<void>; }) {
    const [isDragging, setIsDragging] = useState(false);
    const [previewVideo, setPreviewVideo] = useState<string | null>(null);

    // Handle Drag & Drop to upload area (MP4s)
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("video/"));
        for (const file of files) {
            await onUploadVideo(file);
        }
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        for (const file of files) {
            await onUploadVideo(file);
        }
        e.target.value = ''; // Reset
    };

    const deleteVideo = (index: number) => {
        if (!confirm('Удалить это видео?')) return;
        const newVideos = [...videos];
        newVideos.splice(index, 1);
        onUpdateVideos(newVideos);
    };

    const updateField = (index: number, field: string, value: string) => {
        const newVideos: any[] = [...videos];
        newVideos[index][field] = value;
        onUpdateVideos(newVideos);
    };

    const addManualVideo = () => {
        const newVideo = {
            category: "casual",
            src: "",
            video_url: "",
            label: "New Reel",
            poster: ""
        };
        const newVideos = [newVideo, ...videos];
        onUpdateVideos(newVideos);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Видео (Reels & Shorts)</h3>
                <button
                    onClick={addManualVideo}
                    className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition"
                >
                    + Добавить пустой (Link)
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Upload Zone */}
                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? "border-pink-500 bg-pink-500/10" : "border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800"
                        } aspect-[9/16]`}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FiUploadCloud className="w-10 h-10 mb-3 text-pink-400" />
                        <p className="mb-2 text-xs text-pink-400 font-bold uppercase tracking-wider text-center">Загрузить</p>
                        <p className="text-[10px] text-gray-500 text-center uppercase">MP4 Drop</p>
                    </div>
                    <input type="file" className="hidden" accept="video/mp4,video/mov" onChange={handleFileInput} />
                </label>

                {/* Existing Videos */}
                <ReactSortable
                    list={videos as any}
                    setList={onUpdateVideos as any}
                    animation={150}
                    handle=".drag-handle"
                    className="contents"
                    ghostClass="opacity-50"
                >
                    {videos.map((video: { src: string; video_url?: string; category: string; label?: string; poster?: string; }, index: number) => {
                        const formattedPoster = video.poster?.startsWith("./") ? video.poster.replace("./", "/") : video.poster;

                        return (
                            <div key={`video-${index}`} className="relative group bg-gray-900 rounded-lg overflow-hidden border border-gray-800 flex flex-col">

                                {/* Poster Area */}
                                <div className="relative aspect-[9/16] bg-black cursor-move drag-handle group/poster">
                                    <img src={formattedPoster || 'https://via.placeholder.com/300x533/111/555?text=NO+POSTER'} className="w-full h-full object-cover opacity-80 group-hover/poster:opacity-100 transition" alt="Video cover" />

                                    {video.src && (
                                        <div className="absolute top-2 left-2 z-20">
                                            <button onClick={(e) => { e.stopPropagation(); setPreviewVideo(video.src); }} className="bg-black/80 hover:bg-pink-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition shadow-lg">
                                                <FiPlay className="w-4 h-4 ml-1" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 bg-black/40 transition">
                                        <label className="bg-black/80 text-white px-3 py-1 text-xs rounded uppercase tracking-wider border border-gray-600 cursor-pointer hover:bg-white hover:text-black transition flex items-center gap-1">
                                            <FiImage /> Обложка
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) await onUploadPoster(index, file);
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Metadata Area */}
                                <div className="p-3 space-y-3 flex-1 flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={video.label || ''}
                                        onChange={(e) => updateField(index, 'label', e.target.value)}
                                        className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-pink-500 outline-none"
                                        placeholder="Название"
                                    />

                                    <input
                                        type="text"
                                        value={video.video_url || ''}
                                        onChange={(e) => updateField(index, 'video_url', e.target.value)}
                                        className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-pink-500 outline-none"
                                        placeholder="Ссылка (Instagram/Vimeo)"
                                    />

                                    <select
                                        value={video.category}
                                        onChange={(e) => updateField(index, 'category', e.target.value)}
                                        className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-pink-500 outline-none uppercase tracking-wider"
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>

                                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-800">
                                        <label className="text-[10px] uppercase tracking-wider text-gray-400 hover:text-blue-400 transition flex items-center gap-1 cursor-pointer" title={video.src || 'No file'}>
                                            <FiVideo /> {video.src ? 'Заменить MP4' : 'Загрузить MP4'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="video/mp4,video/mov"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = await onUploadVideo(file);
                                                        if (url) updateField(index, 'src', url);
                                                    }
                                                }}
                                            />
                                        </label>

                                        <button onClick={() => deleteVideo(index)} className="text-gray-500 hover:text-red-500 transition">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </ReactSortable>
            </div>

            {previewVideo && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewVideo(null)}>
                    <div className="relative max-w-2xl w-full flex items-center justify-center bg-black/50" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setPreviewVideo(null)} className="absolute -top-12 right-0 text-white/50 hover:text-white text-4xl">&times;</button>
                        <video src={previewVideo} controls autoPlay className="max-h-[85vh] w-auto max-w-full rounded shadow-2xl border border-gray-800" />
                    </div>
                </div>
            )}
        </div>
    );
}
