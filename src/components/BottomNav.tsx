"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  Squares2X2Icon,
  PlusCircleIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from "@heroicons/react/24/solid";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: HomeIcon, ActiveIcon: HomeIconSolid },
  { href: "/ads", label: "Ads", Icon: Squares2X2Icon, ActiveIcon: Squares2X2IconSolid },
  { href: "/post", label: "Get help now", Icon: PlusCircleIcon, ActiveIcon: PlusCircleIcon, isCta: true },
  { href: "/my-ads", label: "My ads", Icon: ChatBubbleLeftRightIcon, ActiveIcon: ChatBubbleLeftRightIcon },
  { href: "/account", label: "Account", Icon: UserCircleIcon, ActiveIcon: UserCircleIconSolid },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-30 flex items-stretch border-t border-brand-border bg-white pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map(({ href, label, Icon, ActiveIcon, isCta }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const ItemIcon = active ? ActiveIcon : Icon;

        if (isCta) {
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-neutral-600"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-pink text-white">
                <ItemIcon className="h-5 w-5" />
              </span>
              <span>{label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium ${
              active ? "text-brand-navy" : "text-neutral-500"
            }`}
          >
            <ItemIcon className="h-6 w-6" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
