import { notFound, redirect } from "next/navigation";
import { getCollectionBySlug, getMediaBySlug } from "@/lib/strapi";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function MediaLegacyRedirect({ params }: Props) {
  const { slug } = await params;

  const { collection } = await getCollectionBySlug(slug);
  if (collection) {
    redirect(`/media/c/${slug}`);
  }

  const media = await getMediaBySlug(slug);
  if (media) {
    redirect(`/media/v/${slug}`);
  }

  notFound();
}
