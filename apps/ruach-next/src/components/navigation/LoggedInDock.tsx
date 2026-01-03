"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import type { IconType } from "react-icons";
import { VscAccount, VscArchive, VscHome, VscSettingsGear } from "react-icons/vsc";

import Dock, { type DockItemData } from "./Dock";

const ROUTES: Array<{ label: string; path: string; icon: IconType }> = [
  { label: "Home", path: "/", icon: VscHome },
  { label: "Media", path: "/media", icon: VscArchive },
  { label: "Profile", path: "/members/account", icon: VscAccount },
  { label: "Settings", path: "/members/account", icon: VscSettingsGear }
];

export default function LoggedInDock() {
  const { status } = useSession();
  const router = useRouter();
  const locale = useLocale();

  const items: DockItemData[] = useMemo(() => {
    const resolvePath = (path: string) => (path === "/" ? `/${locale}` : `/${locale}${path}`);

    return ROUTES.map((route) => {
      const Icon = route.icon;
      return {
        label: route.label,
        icon: <Icon size={18} />,
        onClick: () => router.push(resolvePath(route.path))
      };
    });
  }, [locale, router]);

  if (status !== "authenticated") {
    return null;
  }

  return (
    <Dock
      items={items}
      panelHeight={68}
      baseItemSize={50}
      magnification={70}
    />
  );
}
