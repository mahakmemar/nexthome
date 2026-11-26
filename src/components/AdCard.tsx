import Image from "next/image";
import Link from "next/link";

type AdCardAd = {
  id: string;
  title: string;
  price: number;
  status: string;
  photos: string; // JSON-encoded string[]
};

export function AdCard({ ad, className = "" }: { ad: AdCardAd; className?: string }) {
  const photos: string[] = JSON.parse(ad.photos || "[]");
  const cover = photos[0];

  return (
    <Link
      href={`/ads/${ad.id}`}
      className={`relative flex-none overflow-hidden rounded-[var(--radius-card)] bg-neutral-900 ${className}`}
    >
      <div className="relative h-40 w-full">
        {cover ? (
          <Image
            src={cover}
            alt={ad.title}
            fill
            className="object-cover"
            sizes="220px"
          />
        ) : (
          <div className="h-full w-full bg-neutral-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />

        {ad.status === "CLAIMED" && (
          <div className="absolute inset-x-0 top-0 bg-brand-green px-2 py-1 text-center text-[11px] font-semibold text-white">
            HELP&apos;S ON THE WAY
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <p className="truncate text-sm font-medium">{ad.title}</p>
          <p className="text-base font-bold">
            {ad.price > 0 ? `${ad.price.toFixed(1)} SEK` : "Free"}
          </p>
        </div>
      </div>
    </Link>
  );
}
