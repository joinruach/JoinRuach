import MediaCard, { type MediaCardProps } from "@/components/ruach/MediaCard";

export default function MediaGrid({ items }: { items: MediaCardProps[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <MediaCard key={item.href} {...item} />
      ))}
    </div>
  );
}
