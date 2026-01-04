import * as ex from './extractors';

type NotionProperties = Record<string, any>;

type FieldExtractor = (props: NotionProperties) => any;

type EntityFieldMap = Record<string, FieldExtractor>;

type EntityKey = 'Course' | 'CourseProfile' | 'Lesson' | 'Phase' | 'Assignment' | 'Resource';

export const fieldMap: Record<EntityKey, EntityFieldMap> = {
  Phase: {
    phaseId: (p) => ex.text(p['phaseId']),
    phaseName: (p) => ex.text(p['phaseName']),
    slug: (p) => ex.text(p['slug']),
    phase: (p) => ex.select(p['phase']),
    order: (p) => ex.number(p['order']),
    description: (p) => ex.text(p['description']),
    duration: (p) => ex.text(p['duration']),
    status: (p) => ex.select(p['status']),
  },

  Course: {
    courseId: (p) => ex.text(p['courseId']),
    slug: (p) => ex.text(p['slug']),
    name: (p) => ex.text(p['courseName']),
    excerpt: (p) => ex.text(p['excerpt']),
    status: (p) => ex.select(p['status']),
    level: (p) => ex.select(p['level']),
    estimatedDuration: (p) => ex.text(p['estimatedDuration']),
    phase: (p) => ex.text(p['linkedPhase']),
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
    lessonId: (p) => ex.text(p['lessonId']),
    slug: (p) => ex.text(p['slug']),
    title: (p) => ex.text(p['lessonTitle']),
    lessonType: (p) => ex.select(p['lessonType']),
    order: (p) => ex.number(p['order']),
    summary: (p) => ex.text(p['summary']),
    coreTruth: (p) => ex.text(p['coreTruth']),
    coreLieExposed: (p) => ex.text(p['coreLieExposed']),
    keyScripture: (p) => ex.text(p['keyScripture']),
    content: (p) => ex.text(p['content']),
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
