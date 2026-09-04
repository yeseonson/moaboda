import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "모아보다",
    short_name: "모아보다",
    description: "나의 문화생활 기록",
    start_url: "/",
    display: "standalone",
    background_color: "#FBFAF7",
    theme_color: "#27473C",
    icons: [
      { src: "/assets/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
