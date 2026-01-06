import type { Schema, Struct } from '@strapi/strapi';

export interface CourseAuditConfig extends Struct.ComponentSchema {
  collectionName: 'components_course_audit_config';
  info: {
    description: 'Guided obedience wizard metadata';
    displayName: 'Audit Config';
  };
  attributes: {
    contractEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    generateObedienceCard: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    instructions: Schema.Attribute.Text;
    obedienceCardTemplate: Schema.Attribute.Component<
      'course.obedience-card-template',
      false
    >;
    renunciationHoldSeconds: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<5>;
    witnessEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface CourseCommunityRule extends Struct.ComponentSchema {
  collectionName: 'components_course_community_rules';
  info: {
    description: 'A community or group rule';
    displayName: 'Community Rule';
    icon: 'users';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CourseCompletionStep extends Struct.ComponentSchema {
  collectionName: 'components_course_completion_steps';
  info: {
    description: 'A step in the course completion path';
    displayName: 'Completion Step';
    icon: 'check';
  };
  attributes: {
    description: Schema.Attribute.Text;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    step: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
  };
}

export interface CourseDeliverable extends Struct.ComponentSchema {
  collectionName: 'components_course_deliverable';
  info: {
    description: 'Action-oriented deliverable block for the audit + obedience step';
    displayName: 'Deliverable';
  };
  attributes: {
    auditWizardUrl: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    pdfUrl: Schema.Attribute.String;
    tagline: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CourseDetoxBridge extends Struct.ComponentSchema {
  collectionName: 'components_course_detox_bridge';
  info: {
    description: 'Paid course bridge content that introduces Detox 101';
    displayName: 'Detox Bridge';
  };
  attributes: {
    body: Schema.Attribute.Text;
    buttonLabel: Schema.Attribute.String & Schema.Attribute.Required;
    buttonUrl: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CourseFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_course_faq_item';
  info: {
    description: 'Accordion entry for objections';
    displayName: 'FAQ Item';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CourseHero extends Struct.ComponentSchema {
  collectionName: 'components_course_hero';
  info: {
    description: 'Landing hero content for mobile-first mini courses';
    displayName: 'Hero';
  };
  attributes: {
    microTrustLine: Schema.Attribute.String;
    optionalBadge: Schema.Attribute.String;
    primaryCtaLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Start Free Course'>;
    primaryCtaUrl: Schema.Attribute.String;
    promiseLine: Schema.Attribute.String & Schema.Attribute.Required;
    secondaryCtaLabel: Schema.Attribute.String;
    secondaryCtaUrl: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CourseLandingConfig extends Struct.ComponentSchema {
  collectionName: 'components_course_landing_config';
  info: {
    description: 'Landing page configuration for mobile-first mini courses';
    displayName: 'Landing Config';
  };
  attributes: {
    deliverable: Schema.Attribute.Component<'course.deliverable', false>;
    detoxBridge: Schema.Attribute.Component<'course.detox-bridge', false>;
    faqItems: Schema.Attribute.Component<'course.faq-item', true>;
    hero: Schema.Attribute.Component<'course.hero', false>;
    outcomes: Schema.Attribute.Component<'course.outcome', true>;
    processSteps: Schema.Attribute.Component<'course.process-step', true>;
    scriptureHelperLine: Schema.Attribute.String;
    scripturePassages: Schema.Attribute.Component<
      'course.scripture-passage',
      true
    >;
    segments: Schema.Attribute.Component<'course.segment', true>;
    whoItsFor: Schema.Attribute.Component<'course.qualifier-item', true>;
    whoItsNotFor: Schema.Attribute.Component<'course.qualifier-item', true>;
  };
}

export interface CourseObedienceCardTemplate extends Struct.ComponentSchema {
  collectionName: 'components_course_obedience_card_template';
  info: {
    description: 'Data used to render the obedience card after Audit Wizard completion';
    displayName: 'Obedience Card Template';
  };
  attributes: {
    oneStepLabel: Schema.Attribute.String;
    patternLabel: Schema.Attribute.String;
    scheduledTimeLabel: Schema.Attribute.String;
    shareInstructions: Schema.Attribute.Text;
    witnessLabel: Schema.Attribute.String;
  };
}

export interface CourseOutcome extends Struct.ComponentSchema {
  collectionName: 'components_course_outcome';
  info: {
    description: 'Single bullet describing the transformation';
    displayName: 'Outcome';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CoursePlayerConfig extends Struct.ComponentSchema {
  collectionName: 'components_course_player_config';
  info: {
    description: 'Player behavior metadata such as modes, meters, and urgency';
    displayName: 'Player Config';
  };
  attributes: {
    convictionTimerHours: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<24>;
    doModeEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    freedomMeterLabels: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<
        ['Clarity', 'Separation', 'Replacement', 'Witness']
      >;
    listenModeEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    microDrillPrompts: Schema.Attribute.JSON;
    offlineFirst: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    readModeEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    windowOfObedienceLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Window of Obedience'>;
  };
}

export interface CourseProcessStep extends Struct.ComponentSchema {
  collectionName: 'components_course_process_step';
  info: {
    description: 'Step description for the how-this-works strip';
    displayName: 'Process Step';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CourseQualifierItem extends Struct.ComponentSchema {
  collectionName: 'components_course_qualifier_item';
  info: {
    description: 'Who this course is for / not for';
    displayName: 'Qualifier Item';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CourseRequiredTool extends Struct.ComponentSchema {
  collectionName: 'components_course_required_tools';
  info: {
    description: 'A required tool or resource for the course';
    displayName: 'Required Tool';
    icon: 'book';
  };
  attributes: {
    details: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['bible', 'journal', 'worksheet', 'audio', 'video', 'other']
    > &
      Schema.Attribute.DefaultTo<'other'>;
  };
}

export interface CourseScripturePassage extends Struct.ComponentSchema {
  collectionName: 'components_course_scripture_passage';
  info: {
    description: 'Collapsible scripture reference blocks';
    displayName: 'Scripture Passage';
  };
  attributes: {
    reference: Schema.Attribute.String & Schema.Attribute.Required;
    text: Schema.Attribute.RichText & Schema.Attribute.Required;
    translation: Schema.Attribute.String;
  };
}

export interface CourseSegment extends Struct.ComponentSchema {
  collectionName: 'components_course_segment';
  info: {
    description: 'A timeline card describing each mini-course segment';
    displayName: 'Segment';
  };
  attributes: {
    durationMinutes: Schema.Attribute.Integer & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    outcome: Schema.Attribute.String;
    previewLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Tap to preview'>;
    previewUrl: Schema.Attribute.String;
  };
}

export interface CourseSnapshot extends Struct.ComponentSchema {
  collectionName: 'components_course_snapshots';
  info: {
    description: 'Course snapshot/overview information';
    displayName: 'Snapshot';
    icon: 'layer';
  };
  attributes: {
    format: Schema.Attribute.Enumeration<
      ['self_paced', 'cohort_optional', 'cohort_required', 'live']
    > &
      Schema.Attribute.DefaultTo<'self_paced'>;
    oneSentencePromise: Schema.Attribute.String & Schema.Attribute.Required;
    outcome: Schema.Attribute.Text & Schema.Attribute.Required;
    prerequisites: Schema.Attribute.Text;
    requiredTools: Schema.Attribute.Component<'course.required-tool', true>;
    runtimeWeeks: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    whoItsFor: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface CourseStartHere extends Struct.ComponentSchema {
  collectionName: 'components_course_start_heres';
  info: {
    description: 'Start Here section for courses';
    displayName: 'Start Here';
    icon: 'play';
  };
  attributes: {
    communityRules: Schema.Attribute.Component<'course.community-rule', true>;
    completionPath: Schema.Attribute.Component<'course.completion-step', true>;
    howToUse: Schema.Attribute.RichText & Schema.Attribute.Required;
    supportEmail: Schema.Attribute.Email;
    welcomeVideoUrl: Schema.Attribute.String;
  };
}

export interface GeneralButton extends Struct.ComponentSchema {
  collectionName: 'components_general_buttons';
  info: {
    displayName: 'Button';
    icon: 'play';
  };
  attributes: {
    Link: Schema.Attribute.String;
    Text: Schema.Attribute.String;
  };
}

export interface GeneralSeOmetadata extends Struct.ComponentSchema {
  collectionName: 'components_general_se_ometadata';
  info: {
    description: '';
    displayName: 'SEOmetadata';
    icon: 'slideshow';
  };
  attributes: {
    keywords: Schema.Attribute.JSON;
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String;
    socialImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
  };
}

export interface GeneralSocialLinks extends Struct.ComponentSchema {
  collectionName: 'components_general_social_links';
  info: {
    description: '';
    displayName: 'socialLink';
    icon: 'manyToOne';
  };
  attributes: {
    platform: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface ImpactMetric extends Struct.ComponentSchema {
  collectionName: 'components_impact_metrics';
  info: {
    displayName: 'Impact Metric';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MediaChapter extends Struct.ComponentSchema {
  collectionName: 'components_media_chapters';
  info: {
    description: 'Video/audio chapter marker with timestamp and title';
    displayName: 'Chapter';
  };
  attributes: {
    description: Schema.Attribute.Text;
    time: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
  };
}

export interface MediaReflectionPrompt extends Struct.ComponentSchema {
  collectionName: 'components_media_reflection_prompts';
  info: {
    description: 'Formation-focused reflection question for spiritual growth';
    displayName: 'Reflection Prompt';
  };
  attributes: {
    category: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    question: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface MediaResource extends Struct.ComponentSchema {
  collectionName: 'components_media_resources';
  info: {
    description: 'Downloadable or linkable resource associated with media content';
    displayName: 'Resource';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    type: Schema.Attribute.Enumeration<
      ['pdf', 'link', 'download', 'study-guide', 'worksheet']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'link'>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MediaVideoSource extends Struct.ComponentSchema {
  collectionName: 'components_media_video_source';
  info: {
    displayName: 'Video Source';
  };
  attributes: {
    embedId: Schema.Attribute.String;
    file: Schema.Attribute.Media;
    kind: Schema.Attribute.Enumeration<
      ['youtube', 'vimeo', 'file', 'rumble', 'custom']
    > &
      Schema.Attribute.Required;
    startSeconds: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface ModuleBullet extends Struct.ComponentSchema {
  collectionName: 'components_module_bullets';
  info: {
    description: 'Single text item for lists';
    displayName: 'Bullet';
    icon: 'circle';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ModuleConfrontation extends Struct.ComponentSchema {
  collectionName: 'components_module_confrontations';
  info: {
    description: 'Heart and mind exposure - challenges and excuses destroyed';
    displayName: 'Confrontation';
    icon: 'lightbulb';
  };
  attributes: {
    challenges: Schema.Attribute.Component<'module.bullet', true>;
    destroysExcuses: Schema.Attribute.Component<'module.bullet', true>;
  };
}

export interface ModuleCoreScripture extends Struct.ComponentSchema {
  collectionName: 'components_module_core_scriptures';
  info: {
    description: 'Anchoring Scripture references for the module';
    displayName: 'Core Scripture';
    icon: 'book-open';
  };
  attributes: {
    excerpt: Schema.Attribute.Text;
    note: Schema.Attribute.Text;
    reference: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ModuleTeachingSummary extends Struct.ComponentSchema {
  collectionName: 'components_module_teaching_summaries';
  info: {
    description: 'Three-part teaching structure for modules';
    displayName: 'Teaching Summary';
    icon: 'book';
  };
  attributes: {
    patternRevealed: Schema.Attribute.Text & Schema.Attribute.Required;
    whyItMustBeSevered: Schema.Attribute.Text & Schema.Attribute.Required;
    whyItPersists: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface OutreachGivingHighlight extends Struct.ComponentSchema {
  collectionName: 'components_outreach_giving_highlights';
  info: {
    description: 'Callout card for a giving option or campaign focus';
    displayName: 'Giving highlight';
    icon: 'donate';
  };
  attributes: {
    amount: Schema.Attribute.String;
    badge: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface OutreachSubscriptionBanner extends Struct.ComponentSchema {
  collectionName: 'components_outreach_subscription_banners';
  info: {
    description: 'Optional email or SMS banner for the outreach page';
    displayName: 'Subscription banner';
    icon: 'megaphone';
  };
  attributes: {
    body: Schema.Attribute.Text;
    ctaLabel: Schema.Attribute.String;
    ctaUrl: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface OutreachVolunteerPoint extends Struct.ComponentSchema {
  collectionName: 'components_outreach_volunteer_points';
  info: {
    description: 'Short highlight describing a volunteer opportunity or focus area';
    displayName: 'Volunteer point';
    icon: 'check';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProtocolLabeledNote extends Struct.ComponentSchema {
  collectionName: 'components_protocol_labeled_notes';
  info: {
    description: 'Label + markdown body for signs/traps/etc.';
    displayName: 'Labeled Note';
    icon: 'bulletList';
  };
  attributes: {
    bodyMd: Schema.Attribute.RichText & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProtocolPractice extends Struct.ComponentSchema {
  collectionName: 'components_protocol_practices';
  info: {
    description: 'A practice/action block for a protocol step.';
    displayName: 'Practice';
    icon: 'check';
  };
  attributes: {
    durationMinutes: Schema.Attribute.Integer;
    frequency: Schema.Attribute.Enumeration<
      ['once', 'daily', 'weekly', 'seasonal', 'as_needed']
    > &
      Schema.Attribute.DefaultTo<'as_needed'>;
    stepsMd: Schema.Attribute.RichText;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProtocolScriptureAnchor extends Struct.ComponentSchema {
  collectionName: 'components_protocol_scripture_anchors';
  info: {
    description: 'A scripture reference used as an anchor for a protocol step.';
    displayName: 'Scripture Anchor';
    icon: 'book';
  };
  attributes: {
    notes: Schema.Attribute.Text;
    reference: Schema.Attribute.String & Schema.Attribute.Required;
    translation: Schema.Attribute.Enumeration<
      ['ESV', 'Yah Scriptures', 'KJV', 'NKJV', 'NASB', 'NIV', 'Other']
    > &
      Schema.Attribute.DefaultTo<'ESV'>;
  };
}

export interface ProtocolUsageMode extends Struct.ComponentSchema {
  collectionName: 'components_protocol_usage_modes';
  info: {
    description: 'How to run a protocol (personal/weekly/etc).';
    displayName: 'Usage Mode';
    icon: 'rocket';
  };
  attributes: {
    durationMinutes: Schema.Attribute.Integer;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    notesMd: Schema.Attribute.RichText;
    steps: Schema.Attribute.Component<'protocol.usage-step', true>;
  };
}

export interface ProtocolUsageStep extends Struct.ComponentSchema {
  collectionName: 'components_protocol_usage_steps';
  info: {
    description: 'A short step in a usage mode.';
    displayName: 'Usage Step';
    icon: 'walk';
  };
  attributes: {
    frequency: Schema.Attribute.Enumeration<
      ['once', 'daily', 'weekly', 'seasonal', 'as_needed']
    > &
      Schema.Attribute.DefaultTo<'as_needed'>;
    stepsMd: Schema.Attribute.RichText;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ResourceResourceCard extends Struct.ComponentSchema {
  collectionName: 'components_resource_resource_cards';
  info: {
    displayName: 'Resource Card';
    icon: 'grid';
  };
  attributes: {
    category: Schema.Attribute.Relation<'manyToOne', 'api::category.category'>;
    ctaLabel: Schema.Attribute.String;
    ctaUrl: Schema.Attribute.String;
    customResources: Schema.Attribute.Component<'shared.resource-link', true>;
    description: Schema.Attribute.Text;
    highlightedArticles: Schema.Attribute.Relation<
      'manyToMany',
      'api::article.article'
    >;
    highlightedBlogPosts: Schema.Attribute.Relation<
      'manyToMany',
      'api::blog-post.blog-post'
    >;
    highlightedCourses: Schema.Attribute.Relation<
      'manyToMany',
      'api::course.course'
    >;
    highlightedLessons: Schema.Attribute.Relation<
      'manyToMany',
      'api::lesson.lesson'
    >;
    highlightedMediaItems: Schema.Attribute.Relation<
      'manyToMany',
      'api::media-item.media-item'
    >;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    tag: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['media', 'lesson', 'article', 'course', 'custom']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'media'>;
  };
}

export interface SharedCoreBeliefs extends Struct.ComponentSchema {
  collectionName: 'components_shared_core_beliefs';
  info: {
    displayName: 'Core Beliefs';
    icon: 'shield';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Component<'shared.media', false>;
    title: Schema.Attribute.String;
    videoURL: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface SharedHighlight extends Struct.ComponentSchema {
  collectionName: 'components_shared_highlights';
  info: {
    displayName: 'Highlight';
    icon: 'star';
  };
  attributes: {
    accentColor: Schema.Attribute.String;
    ctaLabel: Schema.Attribute.String;
    ctaUrl: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    eyebrow: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedResourceLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_resource_links';
  info: {
    displayName: 'Resource Link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    requiresLogin: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    type: Schema.Attribute.Enumeration<
      ['notes', 'download', 'registration', 'external', 'assignment']
    > &
      Schema.Attribute.DefaultTo<'external'>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    displayName: 'Social Link';
  };
  attributes: {
    handle: Schema.Attribute.String;
    label: Schema.Attribute.String;
    platform: Schema.Attribute.Enumeration<
      [
        'youtube',
        'instagram',
        'facebook',
        'spotify',
        'tiktok',
        'website',
        'other',
      ]
    > &
      Schema.Attribute.DefaultTo<'other'>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'course.audit-config': CourseAuditConfig;
      'course.community-rule': CourseCommunityRule;
      'course.completion-step': CourseCompletionStep;
      'course.deliverable': CourseDeliverable;
      'course.detox-bridge': CourseDetoxBridge;
      'course.faq-item': CourseFaqItem;
      'course.hero': CourseHero;
      'course.landing-config': CourseLandingConfig;
      'course.obedience-card-template': CourseObedienceCardTemplate;
      'course.outcome': CourseOutcome;
      'course.player-config': CoursePlayerConfig;
      'course.process-step': CourseProcessStep;
      'course.qualifier-item': CourseQualifierItem;
      'course.required-tool': CourseRequiredTool;
      'course.scripture-passage': CourseScripturePassage;
      'course.segment': CourseSegment;
      'course.snapshot': CourseSnapshot;
      'course.start-here': CourseStartHere;
      'general.button': GeneralButton;
      'general.se-ometadata': GeneralSeOmetadata;
      'general.social-links': GeneralSocialLinks;
      'impact.metric': ImpactMetric;
      'media.chapter': MediaChapter;
      'media.reflection-prompt': MediaReflectionPrompt;
      'media.resource': MediaResource;
      'media.video-source': MediaVideoSource;
      'module.bullet': ModuleBullet;
      'module.confrontation': ModuleConfrontation;
      'module.core-scripture': ModuleCoreScripture;
      'module.teaching-summary': ModuleTeachingSummary;
      'outreach.giving-highlight': OutreachGivingHighlight;
      'outreach.subscription-banner': OutreachSubscriptionBanner;
      'outreach.volunteer-point': OutreachVolunteerPoint;
      'protocol.labeled-note': ProtocolLabeledNote;
      'protocol.practice': ProtocolPractice;
      'protocol.scripture-anchor': ProtocolScriptureAnchor;
      'protocol.usage-mode': ProtocolUsageMode;
      'protocol.usage-step': ProtocolUsageStep;
      'resource.resource-card': ResourceResourceCard;
      'shared.core-beliefs': SharedCoreBeliefs;
      'shared.highlight': SharedHighlight;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.resource-link': SharedResourceLink;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'shared.social-link': SharedSocialLink;
    }
  }
}
