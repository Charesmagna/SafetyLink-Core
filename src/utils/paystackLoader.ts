/**
 * Lazy on-demand loader for Paystack Inline JS.
 * Avoids render-blocking <head> script execution and prevents Paystack's
 * inline.js from throwing appendChild errors when document.body isn't ready.
 */

let paystackLoadPromise: Promise<any> | null = null;

export function loadPaystackPop(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  const existing = (window as any).PaystackPop;
  if (existing) {
    return Promise.resolve(existing);
  }

  if (paystackLoadPromise) {
    return paystackLoadPromise;
  }

  paystackLoadPromise = new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.paystack.co/v1/inline.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).PaystackPop || null), { once: true });
      existingScript.addEventListener('error', () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve((window as any).PaystackPop || null);
    script.onerror = () => {
      paystackLoadPromise = null;
      resolve(null);
    };
    (document.body || document.head).appendChild(script);
  });

  return paystackLoadPromise;
}
