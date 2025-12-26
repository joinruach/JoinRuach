import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AwakeningPhase } from '@ruach/formation';
import { SectionView } from './SectionView';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = AwakeningPhase.sections.find((s) => s.slug === slug);

  if (!section) {
    return {
      title: 'Section Not Found',
    };
  }

  return {
    title: `${section.title} | Awakening | Remnant Guidebook`,
    description: `Phase 1, Section ${section.order}: ${section.title}`,
  };
}

export async function generateStaticParams() {
  return AwakeningPhase.sections.map((section) => ({
    slug: section.slug,
  }));
}

export default async function SectionPage({ params }: PageProps) {
  const { locale, slug } = await params;

  // Find the section by slug
  const section = AwakeningPhase.sections.find((s) => s.slug === slug);
  if (!section) {
    notFound();
  }

  // Find the checkpoint for this section
  const checkpoint = AwakeningPhase.checkpoints.find((c) => c.sectionId === section.id);
  if (!checkpoint) {
    throw new Error(`No checkpoint found for section: ${section.id}`);
  }

  return <SectionView locale={locale} section={section} checkpoint={checkpoint} />;
}
