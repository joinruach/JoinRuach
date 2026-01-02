import type { Schema, Struct } from '@strapi/strapi';

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
      'general.button': GeneralButton;
      'general.se-ometadata': GeneralSeOmetadata;
      'general.social-links': GeneralSocialLinks;
      'impact.metric': ImpactMetric;
      'media.chapter': MediaChapter;
      'media.reflection-prompt': MediaReflectionPrompt;
      'media.resource': MediaResource;
      'media.video-source': MediaVideoSource;
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
