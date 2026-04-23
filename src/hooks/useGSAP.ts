// src/hooks/useGSAP.ts
import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register the ScrollTrigger plugin once at the top level
gsap.registerPlugin(ScrollTrigger);

// ── 1. Animated Cost Counter ──────────────────────────────────────────────────
export function useGSAPCounter() {
  const counterRef = useRef<HTMLElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const currentValueRef = useRef(0);

  const animateCounter = useCallback((
    target: number,
    formatter?: (val: number) => string
  ) => {
    if (!counterRef.current) return;

    // Kill any existing animation to prevent overlap
    if (tweenRef.current) tweenRef.current.kill();

    const obj = { value: currentValueRef.current };

    tweenRef.current = gsap.to(obj, {
      value: target,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        currentValueRef.current = obj.value;
        if (counterRef.current) {
          const formatted = formatter
            ? formatter(Math.round(obj.value))
            : Math.round(obj.value).toLocaleString("en-IN");
          counterRef.current.textContent = formatted;
        }
      },
    });
  }, []);

  useEffect(() => {
    return () => {
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, []);

  return { counterRef, animateCounter };
}

// ── 2. Scroll-triggered Reveal ────────────────────────────────────────────────
interface RevealOptions {
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
  selector?: string;
  threshold?: string; // e.g. "top 80%"
}

export function useGSAPReveal(options: RevealOptions = {}) {
  const revealRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const {
      delay = 0.08,
      duration = 0.65,
      y = 24,
      once = true,
      selector = "> *",
      threshold = "top 88%"
    } = options;

    if (!revealRef.current) return;

    const targets = selector === "> *" 
      ? Array.from(revealRef.current.children) 
      : revealRef.current.querySelectorAll(selector);

    if (!targets.length) return;

    // Initial state: hidden and slightly shifted down
    gsap.set(targets, { opacity: 0, y });

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: revealRef.current,
        start: threshold,
        once,
        onEnter: () => {
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            duration,
            stagger: delay,
            ease: "power3.out",
            clearProps: "transform,opacity",
          });
        },
      });
    });

    return () => ctx.revert();
  }, [options]);

  return { revealRef };
}

// ── 3. Hero Parallax ─────────────────────────────────────────────────────────
export function useGSAPHeroParallax(
  sectionSelector = "#home",
  contentSelector = ".hero-content"
) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax background effect
      gsap.to(sectionSelector, {
        backgroundPositionY: "30%",
        ease: "none",
        scrollTrigger: {
          trigger: sectionSelector,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });

      // Content fade out and slight rise on scroll
      gsap.to(contentSelector, {
        y: -40,
        opacity: 0.4,
        ease: "none",
        scrollTrigger: {
          trigger: sectionSelector,
          start: "top top",
          end: "60% top",
          scrub: 1,
        },
      });
    });

    return () => ctx.revert();
  }, [sectionSelector, contentSelector]);
}

// ── 4. Tab Switch Animation ──────────────────────────────────────────────────
export function useGSAPTabSwitch(activeKey: string) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!panelRef.current) return;

    // Subtle fade and rise when switching calculator tabs
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, [activeKey]);

  return { panelRef };
}

// ── 5. Number Pulse ──────────────────────────────────────────────────────────
export function useGSAPPulse() {
  const pulseRef = useRef<HTMLElement | null>(null);

  const pulse = useCallback(() => {
    if (!pulseRef.current) return;
    gsap.fromTo(
      pulseRef.current,
      { scale: 1.08 },
      { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" }
    );
  }, []);

  return { pulseRef, pulse };
}

// ── 6. ScrollTrigger Refresh ────────────────────────────────────────────────
// Call this when dynamic content changes the page height
export function useGSAPRefresh(dependency: any) {
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [dependency]);
}

// ── 7. Magnetic Effect ──────────────────────────────────────────────────────
export function useGSAPMagnetic() {
  const magneticRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = magneticRef.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(el, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = el.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      xTo(x * 0.35); 
      yTo(y * 0.35);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return { magneticRef };
}