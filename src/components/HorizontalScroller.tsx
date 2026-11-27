"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

/**
 * A row that scrolls left and right: swipe or trackpad on touch devices, and
 * arrow buttons for mouse users. The arrows only appear when there is more to see.
 */
export function HorizontalScroller({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  function scrollPage(direction: -1 | 1) {
    const el = ref.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const arrow =
    "absolute top-16 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-navy shadow-md";

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={update}
        className="flex snap-x snap-proximity gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {canLeft && (
        <button
          type="button"
          aria-label={`Scroll ${label} left`}
          onClick={() => scrollPage(-1)}
          className={`${arrow} left-1`}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          aria-label={`Scroll ${label} right`}
          onClick={() => scrollPage(1)}
          className={`${arrow} right-1`}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
