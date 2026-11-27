"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Continue } from "@/components/wizard/Continue";
import { ACCEPTED_TYPES, MAX_PHOTOS, MAX_UPLOAD_BYTES } from "@/lib/photos";

/**
 * Add up to MAX_PHOTOS photos from the person's own files. Each photo is uploaded
 * as soon as it is chosen; the first one is the cover shown on the ad's card.
 */
export function PhotosStep({
  value,
  onChange,
  onContinue,
}: {
  value: string[];
  onChange: (photos: string[]) => void;
  onContinue: () => void;
}) {
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Uploads finish one after another; this keeps the list current between them.
  const current = useRef(value);
  current.current = value;

  const full = value.length + uploading >= MAX_PHOTOS;

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const room = MAX_PHOTOS - current.current.length - uploading;
    const problems: string[] = [];
    const chosen = files.slice(0, Math.max(room, 0));
    if (files.length > chosen.length) {
      problems.push(`You can add up to ${MAX_PHOTOS} photos. Some were skipped.`);
    }

    const valid = chosen.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        problems.push(`${file.name}: use a JPEG, PNG or WebP photo.`);
        return false;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        problems.push(`${file.name}: too big. Use a photo under 5 MB.`);
        return false;
      }
      return true;
    });

    setErrors(problems);
    setUploading((n) => n + valid.length);

    for (const file of valid) {
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.error ?? "Upload failed");
        const next = [...current.current, result.url as string];
        current.current = next;
        onChange(next);
      } catch (e) {
        setErrors((prev) => [...prev, `${file.name}: ${e instanceof Error ? e.message : "Upload failed"}`]);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function remove(url: string) {
    setErrors([]); // old messages (like "some were skipped") no longer apply
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div className="px-4 py-6">
      <p className="mb-1 text-center text-sm text-neutral-500">
        Add photos from your device so helpers can see what to pick up.
      </p>
      <p
        aria-live="polite"
        className={`mb-4 text-center text-sm font-medium ${full ? "text-brand-pink" : "text-neutral-700"}`}
      >
        {value.length}/{MAX_PHOTOS} photos
      </p>

      <label
        htmlFor="photo-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!full) void addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed px-4 py-8 text-center ${
          dragging ? "border-brand-blue bg-blue-50" : "border-brand-border bg-neutral-50"
        } ${full ? "pointer-events-none opacity-50" : ""}`}
      >
        <PhotoIcon className="h-10 w-10 text-neutral-400" />
        <span className="text-base font-semibold text-brand-blue">Choose photos from your files</span>
        <span className="text-xs text-neutral-500">JPEG, PNG or WebP, up to 5 MB each</span>
        <input
          ref={inputRef}
          id="photo-input"
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          disabled={full}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = ""; // lets the same file be chosen again
          }}
        />
      </label>

      {errors.length > 0 && (
        <ul role="alert" className="mt-3 space-y-1 text-sm text-red-600">
          {errors.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}

      {(value.length > 0 || uploading > 0) && (
        <ul className="mt-5 grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <li key={url} className="relative aspect-square overflow-hidden rounded-[var(--radius-btn)] bg-neutral-100">
              <Image src={url} alt={`Photo ${i + 1}`} fill sizes="140px" unoptimized className="object-cover" />
              {i === 0 && (
                <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[11px] font-semibold text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <li
              key={`uploading-${i}`}
              aria-label="Uploading"
              className="flex aspect-square animate-pulse items-center justify-center rounded-[var(--radius-btn)] bg-neutral-200 text-xs text-neutral-500"
            >
              Uploading...
            </li>
          ))}
        </ul>
      )}

      {value.length === 0 && uploading === 0 && (
        <p className="mt-4 text-center text-xs text-neutral-500">Add at least one photo to continue.</p>
      )}

      <Continue onClick={onContinue} disabled={value.length === 0 || uploading > 0} />
    </div>
  );
}
