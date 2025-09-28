import Image from "next/image"; import Link from "next/link"; import { imgUrl } from "@/lib/strapi";
export type Course={ title:string; slug:string; description?:string; coverUrl?:string };
export function CourseCard({ title, slug, description, coverUrl }:Course){
  return (<Link href={`/courses/${slug}`} className="group overflow-hidden rounded-xl ring-1 ring-black/5 hover:ring-amber-400 transition">
    <div className="relative aspect-[16/9] bg-neutral-200">{coverUrl&&<Image src={imgUrl(coverUrl)!} alt={title} fill className="object-cover transition-transform group-hover:scale-[1.02]"/>}</div>
    <div className="p-4"><h3 className="font-semibold">{title}</h3>{description&&<p className="mt-1 line-clamp-2 text-sm text-neutral-700">{description}</p>}</div>
  </Link>);
}
