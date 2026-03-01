"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { PhotoGrid } from "@/components/admin/PhotoGrid";
import { VideoGrid } from "@/components/admin/VideoGrid";
import { CropModal } from "@/components/admin/CropModal";

interface CloudinaryConfig {
    cloud_name: string;
    api_key: string;
}

interface PortfolioData {
    siteImages: {
        hero: string;
        about1: string;
        about2: string;
    };
    photos: { src: string; thumb?: string; category: string; alt?: string; }[];
    videos: { src: string; video_url?: string; category: string; label?: string; poster?: string; }[];
}

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [authToken, setAuthToken] = useState<string | null>(null);
    const [cloudConfig, setCloudConfig] = useState<CloudinaryConfig | null>(null);
    const [data, setData] = useState<PortfolioData | null>(null);
    const [fileSha, setFileSha] = useState<string>("");

    // Cropping state
    const [cropImage, setCropImage] = useState<{ src: string; aspect: number; onCrop: (file: File) => void } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (token) {
            setAuthToken(token);
            setIsAuthenticated(true);
            initializeAdmin(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initializeAdmin = async (token: string) => {
        try {
            // Fetch Config
            const configRes = await fetch("/api/get-config", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (configRes.status === 401) {
                handleLogout();
                return;
            }

            const configData = await configRes.json();
            setCloudConfig({
                cloud_name: configData.cloud_name,
                api_key: configData.api_key
            });

            // Fetch Data
            const dataRes = await fetch("/api/data", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const jsonData = await dataRes.json();
            setData(jsonData.data);
            setFileSha(jsonData.sha);

        } catch (err) {
            console.error("Failed to initialize admin", err);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError("");

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const json = await res.json();

            if (res.ok) {
                localStorage.setItem("admin_token", json.token);
                setAuthToken(json.token);
                setIsAuthenticated(true);
                initializeAdmin(json.token);
            } else {
                setLoginError(json.error || "Login Failed");
            }
        } catch (err) {
            setLoginError("Connection error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("admin_token");
        setAuthToken(null);
        setIsAuthenticated(false);
    };

    const saveData = async (newData: PortfolioData, message: string, retryCount = 0, forcedSha?: string) => {
        const currentSha = forcedSha || fileSha;
        if (!authToken || !currentSha) return;
        setIsLoading(true);
        try {
            const response = await fetch("/api/data", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message,
                    content: newData,
                    sha: currentSha,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.details?.message || "Failed to save to GitHub";

                // If conflict (409/422) and we haven't retried yet, get latest SHA and retry
                const isConflict = response.status === 409 || (response.status === 422 && errorMessage.includes("does not match"));

                if (isConflict && retryCount < 2) {
                    console.log(`Conflict detected (${response.status}), retrying with new SHA (attempt ${retryCount + 1})...`);
                    const dataRes = await fetch("/api/data", {
                        headers: { "Authorization": `Bearer ${authToken}` }
                    });
                    if (dataRes.ok) {
                        const latest = await dataRes.json();
                        setFileSha(latest.sha);
                        return saveData(newData, message, retryCount + 1, latest.sha);
                    }
                }

                throw new Error(errorMessage);
            }
            const json = await response.json();
            setFileSha(json.newSha);
            setData(newData);
        } catch (err: any) {
            console.error("Save error", err);
            alert(`Ошибка сохранения: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const uploadFileToCloudinary = async (file: File, resourceType: "image" | "video" = "image"): Promise<string | null> => {
        if (!authToken || !cloudConfig) {
            alert("Missing config or authentication");
            return null;
        }

        setIsLoading(true);
        try {
            // 1. Get Signature
            const sigRes = await fetch("/api/sign-upload", {
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            if (!sigRes.ok) throw new Error("Failed to get signature");
            const { signature, timestamp } = await sigRes.json();

            // 2. Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", cloudConfig.api_key);
            formData.append("timestamp", timestamp);
            formData.append("signature", signature);

            const url = `https://api.cloudinary.com/v1_1/${cloudConfig.cloud_name}/${resourceType}/upload`;

            const uploadRes = await fetch(url, {
                method: "POST",
                body: formData
            });

            if (!uploadRes.ok) throw new Error(`Cloudinary upload failed: ${uploadRes.statusText}`);

            const uploadData = await uploadRes.json();
            let secureUrl = uploadData.secure_url;

            // Add auto optimization for images
            if (resourceType === "image" && secureUrl.includes("/upload/")) {
                secureUrl = secureUrl.replace("/upload/", "/upload/q_auto,f_auto/");
            }

            return secureUrl;
        } catch (err) {
            console.error("Upload Error", err);
            alert("Failed to upload file");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadPhoto = async (file: File) => {
        const url = await uploadFileToCloudinary(file, "image");
        if (url && data) {
            const newPhoto = { src: url, thumb: url, category: "casual", alt: file.name };
            const newData = { ...data, photos: [newPhoto, ...data.photos] };
            await saveData(newData, "Uploaded new photo");
        }
    };

    const handleUploadVideo = async (file: File) => {
        const url = await uploadFileToCloudinary(file, "video");
        if (url && data) {
            const newVideo = {
                category: "casual",
                src: url,
                video_url: "",
                label: file.name,
                poster: url.replace(/\.[^/.]+$/, ".jpg")
            };
            const newData = { ...data, videos: [newVideo, ...data.videos] };
            await saveData(newData, "Uploaded new video");
        }
    };

    const handleUploadVideoPoster = async (index: number, file: File) => {
        const url = await uploadFileToCloudinary(file, "image");
        if (url && data) {
            const newVideos = [...data.videos];
            newVideos[index] = { ...newVideos[index], poster: url };
            const newData = { ...data, videos: newVideos };
            await saveData(newData, "Updated video poster");
        }
    };

    const handlePhotosUpdate = (newPhotos: { src: string; thumb?: string; category: string; alt?: string; }[]) => {
        if (!data) return;
        const newData = { ...data, photos: newPhotos };
        // Prevent rapid saving if just reordering during drag, mostly handled by sortable onEnd internally
        saveData(newData, "Updated photos");
    };

    const handleVideosUpdate = (newVideos: { src: string; video_url?: string; category: string; label?: string; poster?: string; }[]) => {
        if (!data) return;
        const newData = { ...data, videos: newVideos };
        saveData(newData, "Updated videos");
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
                <div className="text-center space-y-6 bg-gray-900 border border-gray-800 p-10 rounded-2xl shadow-2xl max-w-sm w-full mx-auto">
                    <h1 className="text-3xl font-bold tracking-widest uppercase mb-4">Dilyara Admin</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Password"
                                required
                                className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-white focus:border-pink-500 outline-none text-center tracking-widest"
                            />
                        </div>
                        {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition rounded flex justify-center items-center disabled:opacity-50"
                        >
                            {isLoading ? "Вход..." : "Войти"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!data || !cloudConfig) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex justify-center items-center p-8">
                <div className="animate-pulse">Загрузка данных...</div>
            </div>
        )
    }

    // Format relative paths from JSON to work properly
    const getImageUrl = (url: string) => url?.startsWith("./") ? url.replace("./", "/") : url;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex justify-center p-8">
            <div className="w-full max-w-5xl space-y-12 mt-10">
                <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                    <h2 className="text-xl font-bold tracking-widest uppercase text-gray-400">Панель управления</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Admin</span>
                        <button
                            onClick={handleLogout}
                            className="text-xs uppercase tracking-widest hover:text-red-500 transition"
                        >
                            Выйти
                        </button>
                    </div>
                </div>

                {/* Site Settings */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Главные фото сайта</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Hero */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex flex-col gap-3 group relative">
                            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Главная Обложка</p>
                            <div className="relative w-full aspect-[4/5] bg-black rounded overflow-hidden">
                                <img src={getImageUrl(data.siteImages.hero)} className="w-full h-full object-cover opacity-80" alt="Hero" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <label className="bg-white text-black px-4 py-2 font-bold uppercase text-xs rounded hover:bg-gray-200 cursor-pointer">
                                        Заменить
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = () => {
                                                    setCropImage({
                                                        src: reader.result as string,
                                                        aspect: 16 / 9,
                                                        onCrop: async (croppedFile) => {
                                                            const url = await uploadFileToCloudinary(croppedFile, "image");
                                                            if (url) {
                                                                const newData = { ...data, siteImages: { ...data.siteImages, hero: url } };
                                                                saveData(newData, "Updated Hero Image");
                                                            }
                                                            setCropImage(null);
                                                        }
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* About 1 */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex flex-col gap-3 group relative">
                            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">О Модели (Фото 1)</p>
                            <div className="relative w-full aspect-[2/3] bg-black rounded overflow-hidden">
                                <img src={getImageUrl(data.siteImages.about1)} className="w-full h-full object-cover opacity-80" alt="About 1" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <label className="bg-white text-black px-4 py-2 font-bold uppercase text-xs rounded hover:bg-gray-200 cursor-pointer">
                                        Заменить
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = () => {
                                                    setCropImage({
                                                        src: reader.result as string,
                                                        aspect: 2 / 3,
                                                        onCrop: async (croppedFile) => {
                                                            const url = await uploadFileToCloudinary(croppedFile, "image");
                                                            if (url) {
                                                                const newData = { ...data, siteImages: { ...data.siteImages, about1: url } };
                                                                saveData(newData, "Updated About1 Image");
                                                            }
                                                            setCropImage(null);
                                                        }
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* About 2 */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex flex-col gap-3 group relative">
                            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">О Модели (Фото 2)</p>
                            <div className="relative w-full aspect-[2/3] bg-black rounded overflow-hidden">
                                <img src={getImageUrl(data.siteImages.about2)} className="w-full h-full object-cover opacity-80" alt="About 2" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <label className="bg-white text-black px-4 py-2 font-bold uppercase text-xs rounded hover:bg-gray-200 cursor-pointer">
                                        Заменить
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = () => {
                                                    setCropImage({
                                                        src: reader.result as string,
                                                        aspect: 2 / 3,
                                                        onCrop: async (croppedFile) => {
                                                            const url = await uploadFileToCloudinary(croppedFile, "image");
                                                            if (url) {
                                                                const newData = { ...data, siteImages: { ...data.siteImages, about2: url } };
                                                                saveData(newData, "Updated About2 Image");
                                                            }
                                                            setCropImage(null);
                                                        }
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Photos Grid */}
                <PhotoGrid
                    photos={data.photos}
                    onUpdatePhotos={handlePhotosUpdate}
                    onUploadPhoto={handleUploadPhoto}
                />

                {/* Videos Grid */}
                <VideoGrid
                    videos={data.videos}
                    onUpdateVideos={handleVideosUpdate}
                    onUploadVideo={handleUploadVideo}
                    onUploadPoster={handleUploadVideoPoster}
                />

                {cropImage && (
                    <CropModal
                        image={cropImage.src}
                        aspectRatio={cropImage.aspect}
                        onClose={() => setCropImage(null)}
                        onCrop={(blob) => {
                            const file = new File([blob], "cropped_image.jpg", { type: "image/jpeg" });
                            cropImage.onCrop(file);
                        }}
                    />
                )}

            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center flex-col gap-4">
                    <div className="animate-spin border-4 border-pink-500 border-t-transparent rounded-full w-8 h-8"></div>
                    <p className="text-sm font-bold text-pink-500 uppercase tracking-widest animate-pulse">Сохранение...</p>
                </div>
            )}
        </div>
    );
}
