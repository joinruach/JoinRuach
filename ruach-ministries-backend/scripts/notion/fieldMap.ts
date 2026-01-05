import * as ex from './extractors';

type NotionProperties = Record<string, any>;

type FieldExtractor = (props: NotionProperties) => any;

type EntityFieldMap = Record<string, FieldExtractor>;

type EntityKey =
  | 'Course'
  | 'CourseProfile'
  | 'Lesson'
  | 'Phase'
  | 'FormationPhase'
  | 'Assignment'
  | 'Resource';

export const fieldMap: Record<EntityKey, EntityFieldMap> = {
  Phase: {
    phaseId: (p) => ex.text(p['phaseId'] ?? p['Phase ID'] ?? p['slug'] ?? p['Slug']),
    phaseName: (p) => ex.text(p['phaseName'] ?? p['Phase Name'] ?? p['name'] ?? p['Name']),
    phase: (p) =>
      ex.text(p['slug'] ?? p['Slug']) ??
      ex.select(p['phase'] ?? p['formationPhase'] ?? p['Formation Phase']),
    order: (p) => ex.number(p['order'] ?? p['Order']),
    description: (p) => ex.text(p['description'] ?? p['Description']),
  },

  FormationPhase: {
    phaseId: (p) => ex.text(p['phaseId'] ?? p['Phase ID'] ?? p['slug'] ?? p['Slug']),
    phaseName: (p) => ex.text(p['phaseName'] ?? p['Phase Name'] ?? p['name'] ?? p['Name']),
    phase: (p) =>
      ex.text(p['slug'] ?? p['Slug']) ??
      ex.select(p['phase'] ?? p['formationPhase'] ?? p['Formation Phase']),
    order: (p) => ex.number(p['order'] ?? p['Order']),
    description: (p) => ex.text(p['description'] ?? p['Description']),
  },

  Course: {
    courseId: (p) => ex.text(p['courseId'] ?? p['Course ID']),
    slug: (p) => ex.text(p['slug'] ?? p['Slug'] ?? p['courseId'] ?? p['Course ID']),
    name: (p) => ex.text(p['courseName'] ?? p['Course Name'] ?? p['name'] ?? p['Name']),
    excerpt: (p) => ex.text(p['excerpt'] ?? p['Excerpt']),
    ctaLabel: (p) =>
      ex.text(p['ctaLabel'] ?? p['CTA Label'] ?? p['Call to Action Label']),
    ctaUrl: (p) =>
      ex.text(p['ctaUrl'] ?? p['CTA URL'] ?? p['Call to Action URL']),
    seoTitle: (p) => ex.text(p['seoTitle'] ?? p['SEO Title']),
    seoDescription: (p) => ex.text(p['seoDescription'] ?? p['SEO Description']),
    description: (p) => ex.text(p['description'] ?? p['Description']),
    status: (p) => ex.select(p['status'] ?? p['Status']),
    requiredAccessLevel: (p) =>
      ex.select(p['requiredAccessLevel'] ?? p['Required Access Level']),
    featured: (p) => ex.checkbox(p['featured'] ?? p['Featured']),
    level: (p) => ex.select(p['level'] ?? p['Level'] ?? p['Course Level']),
    estimatedDuration: (p) =>
      ex.text(p['estimatedDuration'] ?? p['Estimated Duration']) ??
      (ex.number(p['Duration (Weeks)']) !== undefined
        ? `${ex.number(p['Duration (Weeks)'])} weeks`
        : undefined),
  },

  CourseProfile: {
    subtitle: (p) => ex.text(p['subtitle']),
    format: (p) => ex.text(p['format']),
    visibility: (p) => ex.select(p['visibility']),
    pricingType: (p) => ex.select(p['pricingType']),
    funnelRole: (p) => ex.text(p['funnelRole']),
    authorityLevel: (p) => ex.select(p['authorityLevel']),
    commitmentLevel: (p) => ex.select(p['commitmentLevel']),
    purpose: (p) => ex.text(p['purpose']),
    idealParticipant: (p) => ex.text(p['idealParticipant']),
    notFor: (p) => ex.text(p['notFor']),
    promisedOutcome: (p) => ex.text(p['promisedOutcome']),
    scripturalFoundation: (p) => ex.text(p['scripturalFoundation']),
    liesConfronted: (p) => ex.text(p['liesConfronted']),
    formationOutcomes: (p) => ex.text(p['formationOutcomes']),
    practiceComponents: (p) => ex.text(p['practiceComponents']),
    distinctiveFeature: (p) => ex.text(p['distinctiveFeature']),
    completionPath: (p) => ex.text(p['completionPath']),
    prerequisites: (p) => ex.text(p['prerequisites']),
    communityRules: (p) => ex.text(p['communityRules']),
  },

  Lesson: {
    slug: (p) => ex.text(p['slug'] ?? p['Slug'] ?? p['Lesson Slug']),
    title: (p) => ex.text(p['lessonTitle'] ?? p['title'] ?? p['Title']),
    order: (p) => ex.number(p['order'] ?? p['Order']),
    summary: (p) => ex.text(p['summary'] ?? p['Summary']),
    duration: (p) => ex.number(p['duration'] ?? p['Duration']),
    videoUrl: (p) => ex.text(p['videoUrl'] ?? p['Video URL'] ?? p['video']),
    transcript: (p) => ex.text(p['content'] ?? p['transcript'] ?? p['Transcript']),
  },

  Assignment: {
    assignmentId: (p) => ex.text(p['assignmentId']),
    name: (p) => ex.text(p['name'] ?? p['assignmentName'] ?? p['title']),
    assignmentType: (p) => ex.select(p['assignmentType']),
    outputFormat: (p) => ex.select(p['outputFormat']),
    instructions: (p) => ex.text(p['instructions']),
    description: (p) => ex.text(p['description']),
  },

  Resource: {
    resourceId: (p) => ex.text(p['resourceId']),
    title: (p) => ex.text(p['title'] ?? p['resourceTitle']),
    resourceType: (p) => ex.select(p['resourceType']),
    url: (p) => ex.text(p['url']),
    description: (p) => ex.text(p['description']),
  },
};
