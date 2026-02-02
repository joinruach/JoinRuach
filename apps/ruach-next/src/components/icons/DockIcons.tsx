import Image from "next/image";

type IconProps = {
  className?: string;
};

export function HomeIcon({ className }: IconProps) {
  return (
    <Image
      src="/icons/home-icon.png"
      alt="Home"
      width={20}
      height={20}
      className={className}
    />
  );
}

export function WatchIcon({ className }: IconProps) {
  return (
    <Image
      src="/icons/watch-icon.png"
      alt="Watch"
      width={20}
      height={20}
      className={className}
    />
  );
}

export function GrowIcon({ className }: IconProps) {
  return (
    <Image
      src="/icons/grow-icon.png"
      alt="Grow"
      width={20}
      height={20}
      className={className}
    />
  );
}

export function AccountIcon({ className }: IconProps) {
  return (
    <Image
      src="/icons/account-icon.png"
      alt="Account"
      width={20}
      height={20}
      className={className}
    />
  );
}
