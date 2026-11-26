import Link from "next/link";
import { getSelfUser } from "@/lib/user";
import { UserCircleIcon } from "@heroicons/react/24/solid";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const self = await getSelfUser();

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <UserCircleIcon className="h-20 w-20 text-brand-navy" />
      <h1 className="text-xl font-bold text-neutral-900">{self.name}</h1>
      <p className="text-sm text-neutral-500">
        Account settings, payment methods, and verification aren&apos;t part of this clone yet.
      </p>
      <Link href="/signup" className="mt-4 text-sm font-semibold text-brand-blue">
        Create a real account
      </Link>
    </div>
  );
}
