declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export function pageview(url: string) {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;
  
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
}

export function event(action: string, category: string, label?: string, value?: number) {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}
