import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Tenant surfaces are reachable only via their own hostnames, and
        // the auth page has nothing to index.
        disallow: ["/auth", "/t/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
