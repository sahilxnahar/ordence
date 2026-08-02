import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Public marketing surfaces are crawlable; internal surfaces never.
      { userAgent: "*", allow: "/", disallow: ["/admin", "/app", "/auth", "/t/"] },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
