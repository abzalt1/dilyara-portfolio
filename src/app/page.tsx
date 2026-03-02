import { PortfolioContent } from "@/components/PortfolioContent";
import fs from "fs";
import path from "path";

/**
 * Server-side data fetching for SEO and Performance
 */
async function getPortfolioData() {
  try {
    // In local development/build, we read from the public directory
    const filePath = path.join(process.cwd(), "public", "data.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (err) {
    console.error("Failed to read data.json on server", err);
    return { photos: [], videos: [], siteImages: {} };
  }
}

export default async function Home() {
  const data = await getPortfolioData();

  return <PortfolioContent initialData={data} />;
}
