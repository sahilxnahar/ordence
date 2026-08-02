import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { KeyboardHints } from "@/components/ui/keyboard-hints";

/**
 * Marketing layout — ordence.com / www.ordence.com.
 * Public, cacheable, SEO-first. Chrome is server-rendered; only the
 * theme toggle hydrates.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <KeyboardHints />
    </>
  );
}
