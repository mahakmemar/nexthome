import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";
import { UserCircleIcon } from "@heroicons/react/24/solid";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <UserCircleIcon className="h-20 w-20 text-neutral-300" />
        <h1 className="text-xl font-bold text-neutral-900">You&apos;re not logged in</h1>
        <p className="text-sm text-neutral-500">Log in or sign up to pick up ads.</p>
        <div className="mt-4 grid w-full max-w-xs grid-cols-2 gap-2">
          <Link
            href="/login"
            className="rounded-[var(--radius-btn)] border border-brand-navy py-3 text-sm font-bold text-brand-navy"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-[var(--radius-btn)] bg-brand-navy py-3 text-sm font-bold text-white"
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <UserCircleIcon className="h-20 w-20 text-brand-navy" />
      <h1 className="text-xl font-bold text-neutral-900">{user.name}</h1>
      {user.email && <p className="text-sm text-neutral-500">{user.email}</p>}
      <p className="text-sm text-neutral-500">
        Payment methods and verification aren&apos;t part of this clone yet.
      </p>
      <LogoutButton />
    </div>
  );
}
