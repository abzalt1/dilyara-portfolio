export const CATEGORIES = [
    "beauty",
    "streetwear",
    "commercial",
    "casual",
    "ugc",
    "food",
    "social"
];

export const TITLE_MAP: Record<string, string> = {
    all: "All",
    beauty: "Beauty",
    streetwear: "Streetwear",
    commercial: "Commercial",
    casual: "Casual",
    ugc: "UGC",
    food: "Food & Bev",
    social: "Social Media Content",
};

export interface PortfolioData {
    siteImages?: {
        hero: string;
        about1: string;
        about2: string;
    };
    photos: { src: string; thumb?: string; category: string; alt?: string; }[];
    videos: { src: string; video_url?: string; category: string; label?: string; poster?: string; }[];
}
