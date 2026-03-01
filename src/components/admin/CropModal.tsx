"use client";

import { useState, useRef } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

interface CropModalProps {
    image: string;
    aspectRatio: number;
    onCrop: (blob: Blob) => void;
    onClose: () => void;
}

export function CropModal({ image, aspectRatio, onCrop, onClose }: CropModalProps) {
    const cropperRef = useRef<ReactCropperElement>(null);

    const handleCrop = () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;

        cropper.getCroppedCanvas({
            maxWidth: 2000,
            maxHeight: 2000,
            imageSmoothingQuality: 'high'
        }).toBlob((blob) => {
            if (blob) {
                onCrop(blob);
            }
        }, 'image/jpeg', 0.9);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden max-w-4xl w-full flex flex-col shadow-2xl">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">Обрезать фото</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition text-2xl">&times;</button>
                </div>

                <div className="relative bg-black flex-1 min-h-[300px] max-h-[60vh] overflow-hidden">
                    <Cropper
                        src={image}
                        style={{ height: "100%", width: "100%" }}
                        initialAspectRatio={aspectRatio}
                        aspectRatio={aspectRatio}
                        guides={true}
                        ref={cropperRef}
                        viewMode={1}
                        dragMode="move"
                        background={false}
                        responsive={true}
                        autoCropArea={1}
                        checkOrientation={false}
                    />
                </div>

                <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900 relative z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleCrop}
                        className="px-8 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-widest rounded transition"
                    >
                        Готово
                    </button>
                </div>
            </div>
        </div>
    );
}
