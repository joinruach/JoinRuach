"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { ComponentType } from "react";
import {
  HomeIcon,
  WatchIcon,
  GrowIcon,
  AccountIcon
} from "@/components/icons/DockIcons";

import Dock, { type DockItemData } from "./Dock";
import dockStyles from "./Dock.module.css";

type IconComponent = ComponentType<{ className?: string }>;

const ROUTES: Array<{ label: string; path: string; icon: IconComponent }> = [
  { label: "Home", path: "/members", icon: HomeIcon },
  { label: "Watch", path: "/media", icon: WatchIcon },
  { label: "Grow", path: "/guidebook", icon: GrowIcon },
  { label: "Account", path: "/members/account", icon: AccountIcon }
];

export default function LoggedInDock() {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  const items: DockItemData[] = useMemo(() => {
    const resolvePath = (path: string) => `/${locale}${path}`;
    const unlocalizedPathname =
      pathname === `/${locale}` ? "/" : pathname?.startsWith(`/${locale}/`) ? pathname.slice(locale.length + 1) : pathname;

    return ROUTES.map((route) => {
      const Icon = route.icon;
      const isActive = unlocalizedPathname?.startsWith(route.path);

      return {
        label: route.label,
        icon: <Icon className="h-5 w-5" />,
        onClick: () => router.push(resolvePath(route.path)),
        className: isActive ? dockStyles.isActive : undefined
      };
    });
  }, [locale, pathname, router]);

  return (
    <Dock
      items={items}
      panelHeight={68}
      baseItemSize={50}
      magnification={70}
    />
  );
}
