import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Script from 'next/script';
import ConsentManager from '@/components/ConsentManager';

// Make the loadFacebookPixel and loadTikTokPixel functions available globally
declare global {
  interface Window {
    loadFacebookPixel?: () => void;
    loadTikTokPixel?: () => void;
  }
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Claim Connectors | Rideshare Injury Claims Made Easy',
  description: 'Submit your rideshare accident into our claim calculator—in just a few seconds, we can determine if you qualify for legal representation.',
  keywords: 'rideshare accident, uber accident, lyft accident, rideshare injury, claim compensation, accident lawyer, rideshare rights, rideshare legal guide',
  authors: [{ name: 'Claim Connectors Team' }],
  creator: 'Claim Connectors',
  publisher: 'Claim Connectors',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        {/* Inline critical CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Critical CSS for initial render */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { height: 100%; width: 100%; }
          body { font-family: var(--font-inter); }
          .container { width: 100%; max-width: 1280px; margin-left: auto; margin-right: auto; padding-left: 1rem; padding-right: 1rem; }
          @media (min-width: 640px) { .container { max-width: 640px; } }
          @media (min-width: 768px) { .container { max-width: 768px; } }
          @media (min-width: 1024px) { .container { max-width: 1024px; } }
          @media (min-width: 1280px) { .container { max-width: 1280px; } }
          .btn-primary { display: inline-block; background-color: #1d4ed8; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; }
          .text-white { color: white; }
          .font-bold { font-weight: 700; }
          .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
          .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-8 { margin-bottom: 2rem; }
          .py-16 { padding-top: 4rem; padding-bottom: 4rem; }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .relative { position: relative; }
          .absolute { position: absolute; }
          .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
          .z-0 { z-index: 0; }
          .bg-gray-800 { background-color: #1f2937; }
        ` }}/>
        
        {/* Direct stylesheet insertion without preload to avoid MIME type issues */}
        <style 
          type="text/css" 
          dangerouslySetInnerHTML={{ 
            __html: `@import url("/_next/static/css/app/layout.css");` 
          }} 
        />
        
        {/* Preload hero image for faster LCP */}
        <link 
          rel="preconnect"
          href={`${process.env.NEXT_PUBLIC_BASE_URL || ''}`}
          crossOrigin="anonymous"
        />
        <link 
          rel="dns-prefetch"
          href={`${process.env.NEXT_PUBLIC_BASE_URL || ''}`}
        />
        <link 
          rel="preload" 
          href="/images/shutterstock_2428486561-mobile.webp" 
          as="image" 
          type="image/webp"
          media="(max-width: 767px)" 
          fetchPriority="high"
        />
        <link 
          rel="preload" 
          href="/images/shutterstock_2428486561-desktop.webp" 
          as="image" 
          type="image/webp"
          media="(min-width: 768px)"
          fetchPriority="high" 
        />
        
        {/* Meta Pixel Code - Loads conditionally based on consent */}
        <Script id="facebook-pixel" strategy="afterInteractive" data-load-after-interaction>
          {`
            // Defer Facebook Pixel loading until after user interaction or 5 seconds
            const loadFacebookPixel = () => {
              if (window.fbq) return; // Already loaded
              
              // Create a lightweight version of fbq first to queue calls
              window.fbq = function() {
                if (window._fbq && window._fbq.callMethod) {
                  window._fbq.callMethod.apply(window._fbq, arguments);
                } else {
                  if (!window._fbq) window._fbq = [];
                  window._fbq.push(arguments);
                }
              };
              
              // Delay actual script loading
              setTimeout(() => {
                // Don't load if user scrolled less than 25% down the page
                if (window.scrollY < window.innerHeight * 0.25 && 
                    document.visibilityState !== 'visible') {
                  return; // Will try again on next interaction
                }
                
                // Initialize fbq with consent handling
                (function(f,b,e,v,n,t,s){
                  if(f.fbq)return;
                  n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)
                })(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
                
                // Check for stored consent
                const hasConsent = localStorage.getItem('marketing_consent') === 'true';
                
                // Initialize with consent mode
                fbq('consent', hasConsent ? 'grant' : 'revoke');
                
                // Initialize with the correct Pixel ID
                fbq('init', '1718356202366164', {
                  external_id: 'website_visitor_' + Math.floor(Math.random() * 10000000)
                });
                
                // Only track PageView if consent is granted
                if (hasConsent) {
                  fbq('track', 'PageView');
                }
              }, 50); // Small delay for better main thread scheduling
            };
            
            // Make this function available globally for the ConsentManager
            window.loadFacebookPixel = loadFacebookPixel;

            // Load after significant user interaction (scroll, click, etc.)
            const interactionEvents = ['scroll', 'click', 'touchstart'];
            const handleInteraction = () => {
              loadFacebookPixel();
              // Remove all event listeners after loading
              interactionEvents.forEach(event => window.removeEventListener(event, handleInteraction));
            };
            
            // Add event listeners for user interaction
            interactionEvents.forEach(event => window.addEventListener(event, handleInteraction, { passive: true }));
            
            // Fallback: Load after 5 seconds regardless of interaction
            setTimeout(loadFacebookPixel, 5000);
          `}
        </Script>
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1718356202366164&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}
        
        {/* TikTok Pixel Code - Loads conditionally based on consent */}
        <Script id="tiktok-pixel" strategy="afterInteractive" data-load-after-interaction>
          {`
            // Defer TikTok Pixel loading until after user interaction or 4 seconds
            const loadTikTokPixel = () => {
              if (window.ttq) return; // Already loaded
              
              // Check for stored consent
              const hasTikTokConsent = localStorage.getItem('marketing_consent') === 'true';
              
              // Only load TikTok pixel if consent is granted
              if (hasTikTokConsent) {
                !function (w, d, t) {
                  w.TiktokAnalyticsObject=t;
                  var ttq=w[t]=w[t]||[];
                  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
                  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
                  ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                  
                  // Initialize with TikTok Pixel ID
                  ttq.load('C7FVL4BC77U9D7M9FLJ0');
                  ttq.page(); // Track page view
                }(window, document, 'ttq');
              }
            };
            
            // Make this function available globally for the ConsentManager
            window.loadTikTokPixel = loadTikTokPixel;

            // Load after user interaction (scroll, click, etc.)
            const interactionEventsTT = ['scroll', 'mousemove', 'click', 'keydown', 'touchstart'];
            const handleInteractionTT = () => {
              loadTikTokPixel();
              // Remove all event listeners after loading
              interactionEventsTT.forEach(event => window.removeEventListener(event, handleInteractionTT));
            };
            
            // Add event listeners for user interaction
            interactionEventsTT.forEach(event => window.addEventListener(event, handleInteractionTT, { passive: true }));
            
            // Fallback: Load after 4 seconds regardless of interaction (slightly delayed after Facebook)
            setTimeout(loadTikTokPixel, 4000);
          `}
        </Script>
        {/* End TikTok Pixel Code */}
      </head>
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <ConsentManager />
      </body>
    </html>
  );
} 