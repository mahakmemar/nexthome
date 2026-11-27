import { reputationParts, type Reputation } from "@/lib/rating-rules";

/** One line of buyer reputation, or a "new" note when nobody has rated them yet. */
export function ReputationLine({ reputation }: { reputation: Reputation }) {
  const parts = reputationParts(reputation);
  if (parts.length === 0) {
    return <span className="text-neutral-500">New: no ratings yet</span>;
  }
  return (
    <span className={reputation.noShows > 0 ? "text-red-600" : "text-neutral-700"}>
      {parts.join(" · ")}
    </span>
  );
}
