'use client';

import { useEffect, useRef } from 'react';

const P5_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js';
const VANTA_SRC =
  'https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.topology.min.js';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === 'true') resolve();
      else existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export default function VantaBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let effect: { destroy: () => void } | undefined;

    (async () => {
      try {
        await loadScript(P5_SRC);
        await loadScript(VANTA_SRC);
        if (cancelled || !containerRef.current) return;

        const VANTA = (window as any).VANTA;
        if (!VANTA?.TOPOLOGY) return;

        effect = VANTA.TOPOLOGY({
          el: containerRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
        });
      } catch (e) {
        // Non-fatal: the page still works without the animated background.
        console.warn('VANTA background failed to load:', e);
      }
    })();

    return () => {
      cancelled = true;
      effect?.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
