"use client";

import Image from "next/image";
import { useState } from "react";

export function PhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return <div className="h-72 w-full bg-neutral-200" />;
  }

  return (
    <div>
      <div className="relative h-72 w-full bg-neutral-900">
        <Image src={photos[active]} alt={alt} fill className="object-cover" priority />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {photos.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 flex-none overflow-hidden rounded-[var(--radius-btn)] border-2 ${
                i === active ? "border-brand-navy" : "border-transparent"
              }`}
            >
              <Image src={src} alt={`${alt} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
