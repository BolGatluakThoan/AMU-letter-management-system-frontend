import { useEffect } from 'react';

/**
 * Automatically adds scroll-reveal animation to .card elements
 * and any element with class "reveal" inside the container.
 * Elements fade + slide up as they enter the viewport.
 */
export default function useScrollReveal(containerRef) {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
    );

    const tag = () => {
      container.querySelectorAll('.card, .reveal').forEach((el) => {
        if (!el.classList.contains('revealed')) {
          el.classList.add('reveal');
          observer.observe(el);
        }
      });
    };

    // Small delay so DOM is painted before we observe
    const timer = setTimeout(tag, 50);

    const mutation = new MutationObserver(() => setTimeout(tag, 50));
    mutation.observe(container, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mutation.disconnect();
    };
  }, [containerRef]);
}
