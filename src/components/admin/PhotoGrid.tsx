"use client";

import { useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { FiUploadCloud, FiTrash2 } from "react-icons/fi";

const CATEGORIES = ["beauty", "streetwear", "commercial", "casual", "ugc", "food", "acting"];

export function PhotoGrid({ photos, onUpdatePhotos, onUploadPhoto }: any) {
    const [isDragging, setIsDragging] = useState(false);

    // Handle Drag & Drop to upload area
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

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
        for (const file of files) {
            await onUploadPhoto(file);
        }
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        for (const file of files) {
            await onUploadPhoto(file);
        }
        e.target.value = ''; // Reset
    };

    const deletePhoto = (index: number) => {
        if (!confirm('Удалить это фото?')) return;
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        onUpdatePhotos(newPhotos);
    };

    const changeCategory = (index: number, newCategory: string) => {
        const newPhotos = [...photos];
        newPhotos[index].category = newCategory;
        onUpdatePhotos(newPhotos);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Фотографии</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Upload Zone */}
                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? "border-pink-500 bg-pink-500/10" : "border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800"
                        } aspect-[2/3]`}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FiUploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-xs text-gray-400 font-bold uppercase tracking-wider text-center">Загрузить</p>
                        <p className="text-[10px] text-gray-500 text-center uppercase">Перетащите или нажмите</p>
                    </div>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileInput} />
                </label>

                {/* Existing Photos */}
                <ReactSortable
                    list={photos}
                    setList={onUpdatePhotos}
                    animation={150}
                    className="contents" // Critical to keep grid layout
                    ghostClass="opacity-50"
                >
                    {photos.map((photo: any, index: number) => {
                        const displaySrc = photo.thumb || photo.src;
                        const formattedSrc = displaySrc.startsWith("./") ? displaySrc.replace("./", "/") : displaySrc;

                        return (
                            <div key={`${photo.src}-${index}`} className="relative group aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden cursor-move transition-all duration-200">
                                <img src={formattedSrc} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" alt="Portfolio" />

                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
                                    <select
                                        value={photo.category}
                                        onChange={(e) => changeCategory(index, e.target.value)}
                                        className="bg-black text-xs text-white border border-gray-600 rounded px-2 py-2 outline-none w-full uppercase tracking-wider"
                                        onMouseDown={(e) => e.stopPropagation()} // Prevent sorting when clicking select
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deletePhoto(index); }}
                                        className="mt-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-2 flex items-center justify-center transition"
                                        title="Удалить"
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </ReactSortable>
            </div>
        </div>
    );
}
