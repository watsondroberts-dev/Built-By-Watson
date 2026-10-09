// SEO Management Helper for Built By Watson (builtbywatson.com)

export interface SeoConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords?: string;
  ogType?: string;
}

export const SEO_PAGE_CONFIGS: Record<'home' | 'about' | 'contact', SeoConfig> = {
  home: {
    title: 'Built By Watson | Google Ads Management Company for Contractors & B2B',
    description: 'Built By Watson is a dedicated Google Ads management company engineering high-converting PPC search campaigns and qualified lead funnels for contractors & B2B trades.',
    canonicalUrl: 'https://builtbywatson.com/',
    keywords: 'Built By Watson, Google Ads management company near me, Google Ads agency, contractor Google Ads, B2B PPC marketing, pay-per-click management company, local lead generation',
    ogType: 'website'
  },
  about: {
    title: 'About Built By Watson | B2B & Contractor Google Ads Agency',
    description: 'Learn about Built By Watson: transparent, ROI-driven Google Ads management built specifically to help home service contractors and B2B businesses scale profitable leads.',
    canonicalUrl: 'https://builtbywatson.com/#about',
    keywords: 'about Built By Watson, Google Ads specialist Delray Beach, contractor PPC agency, B2B Google Ads consultants, PPC campaign management',
    ogType: 'website'
  },
  contact: {
    title: 'Contact Built By Watson | Partner With a Top Google Ads Company',
    description: 'Contact Built By Watson to schedule a 1-on-1 Google Ads strategy consultation. Partner with our dedicated PPC team to dominate your local market and grow inbound leads.',
    canonicalUrl: 'https://builtbywatson.com/#contact',
    keywords: 'contact Built By Watson, hire Google Ads management company, contractor PPC audit, Google Ads management near me, B2B lead generation consultation',
    ogType: 'website'
  }
};

export function updatePageSeo(tab: 'home' | 'about' | 'contact') {
  const config = SEO_PAGE_CONFIGS[tab] || SEO_PAGE_CONFIGS.home;

  // 1. Update Title
  document.title = config.title;

  // 2. Helper to set or create meta tag
  const setMeta = (nameAttr: 'name' | 'property', attrValue: string, content: string) => {
    let el = document.querySelector(`meta[${nameAttr}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(nameAttr, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 3. Update Standard Meta
  setMeta('name', 'title', config.title);
  setMeta('name', 'description', config.description);
  if (config.keywords) {
    setMeta('name', 'keywords', config.keywords);
  }

  // 4. Update OpenGraph
  setMeta('property', 'og:title', config.title);
  setMeta('property', 'og:description', config.description);
  setMeta('property', 'og:url', config.canonicalUrl);

  // 5. Update Twitter
  setMeta('name', 'twitter:title', config.title);
  setMeta('name', 'twitter:description', config.description);
  setMeta('name', 'twitter:url', config.canonicalUrl);

  // 6. Update Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', config.canonicalUrl);
}
