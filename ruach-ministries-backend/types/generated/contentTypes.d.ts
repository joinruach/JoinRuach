import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAboutAbout extends Struct.SingleTypeSchema {
  collectionName: 'abouts';
  info: {
    description: 'Write about yourself and the content you create';
    displayName: 'About (legacy)';
    pluralName: 'abouts';
    singularName: 'about';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blocks: Schema.Attribute.DynamicZone<['shared.quote', 'shared.rich-text']>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::about.about'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArticleArticle extends Struct.CollectionTypeSchema {
  collectionName: 'articles';
  info: {
    description: 'Create your blog content';
    displayName: 'Article (paused)';
    pluralName: 'articles';
    singularName: 'article';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'> &
      Schema.Attribute.Required;
    blocks: Schema.Attribute.DynamicZone<
      ['shared.media', 'shared.quote', 'shared.rich-text', 'shared.slider']
    >;
    category: Schema.Attribute.Relation<'manyToOne', 'api::category.category'> &
      Schema.Attribute.Required;
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    featuredInResources: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource-directory.resource-directory'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::article.article'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAssignmentAssignment extends Struct.CollectionTypeSchema {
  collectionName: 'assignments';
  info: {
    description: 'Practice, activation, or response tied to lessons or courses.';
    displayName: 'Assignment';
    pluralName: 'assignments';
    singularName: 'assignment';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    assignmentId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    assignmentType: Schema.Attribute.Enumeration<
      [
        'audit',
        'renunciation',
        'build',
        'journal',
        'declaration',
        'action-plan',
        'assessment',
        'practice-log',
      ]
    >;
    checksum: Schema.Attribute.String;
    course: Schema.Attribute.Relation<'manyToOne', 'api::course.course'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    instructions: Schema.Attribute.RichText;
    lastSyncedAt: Schema.Attribute.DateTime;
    lesson: Schema.Attribute.Relation<'manyToOne', 'api::lesson.lesson'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::assignment.assignment'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    notionPageId: Schema.Attribute.String & Schema.Attribute.Unique;
    outputFormat: Schema.Attribute.Enumeration<
      ['written', 'spoken', 'action', 'testimony']
    >;
    publishedAt: Schema.Attribute.DateTime;
    strapiEntryId: Schema.Attribute.String & Schema.Attribute.Unique;
    syncedToStrapi: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    syncErrors: Schema.Attribute.Text;
    syncLock: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAudioFileAudioFile extends Struct.CollectionTypeSchema {
  collectionName: 'audio_files';
  info: {
    description: '';
    displayName: 'Audio File (paused)';
    pluralName: 'audio-files';
    singularName: 'audio-file';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    audioFile: Schema.Attribute.Media<'files' | 'audios'>;
    categories: Schema.Attribute.Relation<
      'manyToMany',
      'api::category.category'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    duration: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::audio-file.audio-file'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAuthorAuthor extends Struct.CollectionTypeSchema {
  collectionName: 'authors';
  info: {
    description: 'Create authors for your content';
    displayName: 'Author';
    pluralName: 'authors';
    singularName: 'author';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    articles: Schema.Attribute.Relation<'oneToMany', 'api::article.article'>;
    avatar: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::author.author'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    prayers: Schema.Attribute.Relation<'oneToMany', 'api::prayer.prayer'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBlogPostBlogPost extends Struct.CollectionTypeSchema {
  collectionName: 'blog_posts';
  info: {
    description: '';
    displayName: 'Blog Post';
    pluralName: 'blog-posts';
    singularName: 'blog-post';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Relation<'manyToOne', 'api::category.category'>;
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    featuredImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    featuredInResources: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource-directory.resource-directory'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::blog-post.blog-post'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    publishedDate: Schema.Attribute.Date;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    team_member: Schema.Attribute.Relation<
      'manyToOne',
      'api::team-member.team-member'
    >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCanonAxiomCanonAxiom extends Struct.CollectionTypeSchema {
  collectionName: 'canon_axioms';
  info: {
    description: 'Core doctrinal statements and definitions unlocked through formation';
    displayName: 'Canon Axiom';
    pluralName: 'canon-axioms';
    singularName: 'canon-axiom';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    axiomId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    axiomNumber: Schema.Attribute.Integer;
    canonLevel: Schema.Attribute.Enumeration<
      ['Foundation', 'Core', 'Support', 'Corrective']
    >;
    category: Schema.Attribute.Enumeration<
      [
        'covenant',
        'kingdom',
        'holiness',
        'redemption',
        'ecclesiology',
        'eschatology',
        'pneumatology',
      ]
    > &
      Schema.Attribute.Required;
    checksum: Schema.Attribute.String;
    commonMisconceptions: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    definition: Schema.Attribute.RichText & Schema.Attribute.Required;
    formationPhases: Schema.Attribute.JSON;
    function: Schema.Attribute.JSON;
    hierarchyTier: Schema.Attribute.Enumeration<
      ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']
    > &
      Schema.Attribute.Required;
    lastSyncedAt: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::canon-axiom.canon-axiom'
    > &
      Schema.Attribute.Private;
    nodes: Schema.Attribute.Relation<
      'manyToMany',
      'api::guidebook-node.guidebook-node'
    >;
    notionPageId: Schema.Attribute.String & Schema.Attribute.Unique;
    practicalApplication: Schema.Attribute.RichText;
    publishedAt: Schema.Attribute.DateTime;
    relatedAxioms: Schema.Attribute.Relation<
      'manyToMany',
      'api::canon-axiom.canon-axiom'
    >;
    releases: Schema.Attribute.Relation<
      'manyToMany',
      'api::canon-release.canon-release'
    >;
    scriptureFoundation: Schema.Attribute.Relation<
      'manyToMany',
      'api::scripture-verse.scripture-verse'
    >;
    sensitivity: Schema.Attribute.Enumeration<
      ['Low', 'Medium', 'High', 'Critical']
    > &
      Schema.Attribute.DefaultTo<'Medium'>;
    shortDefinition: Schema.Attribute.Text;
    slug: Schema.Attribute.UID<'title'> & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      [
        'Draft',
        'Review',
        'Ready',
        'Synced',
        'Published',
        'Deprecated',
        'Needs Revision',
      ]
    > &
      Schema.Attribute.DefaultTo<'Draft'>;
    strapiEntryId: Schema.Attribute.String & Schema.Attribute.Unique;
    syncErrors: Schema.Attribute.Text;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    unlockPhase: Schema.Attribute.Enumeration<
      ['awakening', 'separation', 'discernment', 'commission', 'stewardship']
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCanonReleaseCanonRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'canon_releases';
  info: {
    description: 'Gated advanced content unlocked through formation maturity';
    displayName: 'Canon Release';
    pluralName: 'canon-releases';
    singularName: 'canon-release';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    canonReferences: Schema.Attribute.Relation<
      'manyToMany',
      'api::canon-axiom.canon-axiom'
    >;
    content: Schema.Attribute.RichText & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    downloadableResources: Schema.Attribute.Media<
      'files' | 'images' | 'videos',
      true
    >;
    estimatedDuration: Schema.Attribute.Integer;
    lastSyncedAt: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::canon-release.canon-release'
    > &
      Schema.Attribute.Private;
    notionPageId: Schema.Attribute.String & Schema.Attribute.Unique;
    phaseRequirement: Schema.Attribute.Enumeration<
      ['awakening', 'separation', 'discernment', 'commission', 'stewardship']
    > &
      Schema.Attribute.Required;
    publishDate: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    releaseId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    scriptureReferences: Schema.Attribute.Relation<
      'manyToMany',
      'api::scripture-verse.scripture-verse'
    >;
    slug: Schema.Attribute.UID<'title'> & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      [
        'Draft',
        'Review',
        'Ready',
        'Synced',
        'Published',
        'Deprecated',
        'Needs Revision',
      ]
    > &
      Schema.Attribute.DefaultTo<'Draft'>;
    strapiEntryId: Schema.Attribute.String & Schema.Attribute.Unique;
    syncErrors: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['teaching', 'prophecy', 'vision', 'revelation', 'strategy']
    > &
      Schema.Attribute.Required;
    unlockRequirements: Schema.Attribute.JSON & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videoMedia: Schema.Attribute.Media<'videos'>;
    videoUrl: Schema.Attribute.String;
  };
}

export interface ApiCategoryCategory extends Struct.CollectionTypeSchema {
  collectionName: 'categories';
  info: {
    description: 'Organize your content into categories';
    displayName: 'Category';
    pluralName: 'categories';
    singularName: 'category';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    accentColor: Schema.Attribute.String;
    articles: Schema.Attribute.Relation<'oneToMany', 'api::article.article'>;
    audio_files: Schema.Attribute.Relation<
      'manyToMany',
      'api::audio-file.audio-file'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    displayOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    images: Schema.Attribute.Relation<'manyToMany', 'api::image.image'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::category.category'
    > &
      Schema.Attribute.Private;
    mediaItems: Schema.Attribute.Relation<
      'oneToMany',
      'api::media-item.media-item'
    >;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videos: Schema.Attribute.Relation<'manyToMany', 'api::video.video'>;
  };
}

export interface ApiChannelChannel extends Struct.CollectionTypeSchema {
  collectionName: 'channels';
  info: {
    displayName: 'Channel';
    pluralName: 'channels';
    singularName: 'channel';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    avatar: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::channel.channel'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videos: Schema.Attribute.Relation<'manyToMany', 'api::video.video'>;
  };
}

export interface ApiCommentReportCommentReport
  extends Struct.CollectionTypeSchema {
  collectionName: 'comment_reports';
  info: {
    displayName: 'Comment Report';
    pluralName: 'comment-reports';
    singularName: 'comment-report';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    commentId: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::comment-report.comment-report'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    reason: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiCommunityOutreachPageCommunityOutreachPage
  extends Struct.SingleTypeSchema {
  collectionName: 'community_outreach_page';
  info: {
    description: 'Landing page content for Ruach Community Outreach';
    displayName: 'Community Outreach Page';
    pluralName: 'community-outreach-pages';
    singularName: 'community-outreach-page';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    donationFormUrl: Schema.Attribute.String;
    featuredStories: Schema.Attribute.Relation<
      'manyToMany',
      'api::outreach-story.outreach-story'
    >;
    featuredStoriesCtaLabel: Schema.Attribute.String;
    featuredStoriesCtaUrl: Schema.Attribute.String;
    featuredStoriesHeading: Schema.Attribute.String;
    givingCtaLabel: Schema.Attribute.String;
    givingCtaUrl: Schema.Attribute.String;
    givingHighlights: Schema.Attribute.Component<
      'outreach.giving-highlight',
      true
    >;
    givingSectionBody: Schema.Attribute.RichText;
    givingSectionTitle: Schema.Attribute.String;
    heroDescription: Schema.Attribute.Text;
    heroEyebrow: Schema.Attribute.String;
    heroPrimaryCtaLabel: Schema.Attribute.String;
    heroPrimaryCtaUrl: Schema.Attribute.String;
    heroSecondaryCtaLabel: Schema.Attribute.String;
    heroSecondaryCtaUrl: Schema.Attribute.String;
    heroTitle: Schema.Attribute.String & Schema.Attribute.Required;
    highlightedCampaigns: Schema.Attribute.Relation<
      'manyToMany',
      'api::outreach-campaign.outreach-campaign'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-outreach-page.community-outreach-page'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    subscriptionBanner: Schema.Attribute.Component<
      'outreach.subscription-banner',
      false
    >;
    subscriptionBannerEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    volunteerFormEmbed: Schema.Attribute.Text;
    volunteerFormProvider: Schema.Attribute.String;
    volunteerHighlights: Schema.Attribute.Component<
      'outreach.volunteer-point',
      true
    >;
    volunteerSectionBody: Schema.Attribute.RichText;
    volunteerSectionTitle: Schema.Attribute.String;
  };
}

export interface ApiContactInfoContactInfo extends Struct.SingleTypeSchema {
  collectionName: 'contact_infos';
  info: {
    description: '';
    displayName: 'Contact Info (legacy)';
    pluralName: 'contact-infos';
    singularName: 'contact-info';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    address: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::contact-info.contact-info'
    > &
      Schema.Attribute.Private;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    socialLinks: Schema.Attribute.Component<'general.social-links', true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiContactMessageContactMessage
  extends Struct.CollectionTypeSchema {
  collectionName: 'contact_messages';
  info: {
    displayName: 'contact-message';
    pluralName: 'contact-messages';
    singularName: 'contact-message';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::contact-message.contact-message'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.Blocks;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiContactSubmissionContactSubmission
  extends Struct.CollectionTypeSchema {
  collectionName: 'contact_submissions';
  info: {
    description: 'Contact form submissions from the website';
    displayName: 'Contact Submission';
    pluralName: 'contact-submissions';
    singularName: 'contact-submission';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::contact-submission.contact-submission'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    topic: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCourseLicenseCourseLicense
  extends Struct.CollectionTypeSchema {
  collectionName: 'course_licenses';
  info: {
    displayName: 'Course License';
    pluralName: 'course-licenses';
    singularName: 'course-license';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    courseSlug: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    grantedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::course-license.course-license'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    source: Schema.Attribute.Enumeration<['purchase', 'comp', 'promo']> &
      Schema.Attribute.DefaultTo<'purchase'>;
    stripeCheckoutSessionId: Schema.Attribute.String & Schema.Attribute.Unique;
    stripePaymentIntentId: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiCourseProfileCourseProfile
  extends Struct.CollectionTypeSchema {
  collectionName: 'course_profiles';
  info: {
    description: 'Semantic, formation, and positioning metadata for a course. 1:1 with Course.';
    displayName: 'Course Profile';
    pluralName: 'course-profiles';
    singularName: 'course-profile';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    authorityLevel: Schema.Attribute.Enumeration<
      ['introductory', 'pastoral', 'apostolic', 'prophetic']
    >;
    commitmentLevel: Schema.Attribute.Enumeration<['low', 'medium', 'high']>;
    communityRules: Schema.Attribute.RichText;
    completionPath: Schema.Attribute.String;
    course: Schema.Attribute.Relation<'oneToOne', 'api::course.course'> &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    distinctiveFeature: Schema.Attribute.RichText;
    format: Schema.Attribute.String;
    formationOutcomes: Schema.Attribute.RichText;
    funnelRole: Schema.Attribute.String;
    idealParticipant: Schema.Attribute.RichText;
    liesConfronted: Schema.Attribute.RichText;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::course-profile.course-profile'
    > &
      Schema.Attribute.Private;
    notFor: Schema.Attribute.RichText;
    practiceComponents: Schema.Attribute.RichText;
    prerequisites: Schema.Attribute.String;
    pricingType: Schema.Attribute.Enumeration<
      ['free', 'paid-core', 'paid-flagship', 'paid-specialty']
    > &
      Schema.Attribute.DefaultTo<'free'>;
    promisedOutcome: Schema.Attribute.RichText;
    publishedAt: Schema.Attribute.DateTime;
    purpose: Schema.Attribute.RichText;
    scripturalFoundation: Schema.Attribute.RichText;
    subtitle: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    visibility: Schema.Attribute.Enumeration<
      ['public', 'gated', 'cohort-only', 'private']
    > &
      Schema.Attribute.DefaultTo<'public'>;
  };
}

export interface ApiCourseCourse extends Struct.CollectionTypeSchema {
  collectionName: 'courses';
  info: {
    description: 'Course shells consumed by the Next.js frontend';
    displayName: 'Course';
    pluralName: 'courses';
    singularName: 'course';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    checksum: Schema.Attribute.String;
    comments: Schema.Attribute.Relation<
      'oneToMany',
      'api::lesson-comment.lesson-comment'
    >;
    courseId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    cover: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ctaLabel: Schema.Attribute.String;
    ctaUrl: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    estimatedDuration: Schema.Attribute.String;
    excerpt: Schema.Attribute.Text;
    featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    heroVideo: Schema.Attribute.Media<'videos'>;
    lastSyncedAt: Schema.Attribute.DateTime;
    lessons: Schema.Attribute.Relation<'oneToMany', 'api::lesson.lesson'>;
    level: Schema.Attribute.Enumeration<
      ['foundation', 'intermediate', 'advanced']
    > &
      Schema.Attribute.DefaultTo<'foundation'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::course.course'
    > &
      Schema.Attribute.Private;
    modules: Schema.Attribute.Relation<'oneToMany', 'api::module.module'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    notionPageId: Schema.Attribute.String & Schema.Attribute.Unique;
    phase: Schema.Attribute.Relation<
      'manyToOne',
      'api::formation-phase.formation-phase'
    > &
      Schema.Attribute.Required;
    profile: Schema.Attribute.Relation<
      'oneToOne',
      'api::course-profile.course-profile'
    >;
    publishedAt: Schema.Attribute.DateTime;
    requiredAccessLevel: Schema.Attribute.Enumeration<
      ['basic', 'full', 'leader']
    > &
      Schema.Attribute.DefaultTo<'basic'>;
    seoDescription: Schema.Attribute.Text;
    seoImage: Schema.Attribute.Media<'images'>;
    seoTitle: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'name'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    status: Schema.Attribute.Enumeration<
      [
        'Draft',
        'Review',
        'Ready',
        'Synced',
        'Published',
        'Deprecated',
        'Needs Revision',
      ]
    > &
      Schema.Attribute.DefaultTo<'Draft'>;
    strapiEntryId: Schema.Attribute.String & Schema.Attribute.Unique;
    syncedToStrapi: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    syncErrors: Schema.Attribute.Text;
    syncLock: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    unlockRequirements: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDonationDonation extends Struct.CollectionTypeSchema {
  collectionName: 'donations';
  info: {
    displayName: 'Donation';
    pluralName: 'donations';
    singularName: 'donation';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Schema.Attribute.Integer & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.Required;
    donatedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    email: Schema.Attribute.Email;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::donation.donation'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    source: Schema.Attribute.String;
    stripeSessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    thankYouLastError: Schema.Attribute.Text;
    thankYouQueuedAt: Schema.Attribute.DateTime;
    thankYouSentAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEventEvent extends Struct.CollectionTypeSchema {
  collectionName: 'events';
  info: {
    displayName: 'Event';
    pluralName: 'events';
    singularName: 'event';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      ['conference', 'gathering', 'outreach', 'online']
    > &
      Schema.Attribute.DefaultTo<'conference'>;
    cover: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ctaLabel: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    endDate: Schema.Attribute.DateTime;
    heroGallery: Schema.Attribute.Media<'images', true>;
    isOnline: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::event.event'> &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationUrl: Schema.Attribute.String;
    seoDescription: Schema.Attribute.Text;
    seoImage: Schema.Attribute.Media<'images'>;
    seoTitle: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    startDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiFaqFaq extends Struct.CollectionTypeSchema {
  collectionName: 'faqs';
  info: {
    displayName: 'FAQ';
    pluralName: 'faqs';
    singularName: 'faq';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    answer: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::faq.faq'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    question: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiFormationEventFormationEvent
  extends Struct.CollectionTypeSchema {
  collectionName: 'formation_events';
  info: {
    description: 'Immutable event store for formation journey tracking';
    displayName: 'Formation Event';
    pluralName: 'formation-events';
    singularName: 'formation-event';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    anonymousUserId: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    eventData: Schema.Attribute.JSON & Schema.Attribute.Required;
    eventId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    eventMetadata: Schema.Attribute.JSON;
    eventType: Schema.Attribute.Enumeration<
      [
        'covenant_entered',
        'phase_started',
        'phase_completed',
        'section_viewed',
        'section_completed',
        'checkpoint_reached',
        'checkpoint_completed',
        'reflection_submitted',
        'reflection_analyzed',
        'canon_definition_viewed',
        'canon_axiom_cited',
        'pause_triggered',
        'recommendation_issued',
        'content_unlocked',
        'content_gated',
        'readiness_level_changed',
        'formation_gap_detected',
      ]
    > &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::formation-event.formation-event'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    timestamp: Schema.Attribute.DateTime & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiFormationJourneyFormationJourney
  extends Struct.CollectionTypeSchema {
  collectionName: 'formation_journeys';
  info: {
    description: "User's current formation state pointer (one per user)";
    displayName: 'Formation Journey';
    pluralName: 'formation-journeys';
    singularName: 'formation-journey';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    anonymousUserId: Schema.Attribute.String & Schema.Attribute.Unique;
    checkpointsCompleted: Schema.Attribute.JSON;
    checkpointsReached: Schema.Attribute.JSON;
    covenantEnteredAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    covenantType: Schema.Attribute.Enumeration<
      ['formation_journey', 'resource_explorer']
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currentPhase: Schema.Attribute.Enumeration<
      ['awakening', 'separation', 'discernment', 'commission', 'stewardship']
    > &
      Schema.Attribute.Required;
    lastActivityAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::formation-journey.formation-journey'
    > &
      Schema.Attribute.Private;
    phaseEnteredAt: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    reflectionsSubmitted: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    sectionsViewed: Schema.Attribute.JSON;
    unlockedCannonReleases: Schema.Attribute.JSON;
    unlockedCanonAxioms: Schema.Attribute.JSON;
    unlockedCourses: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiFormationPhaseFormationPhase
  extends Struct.CollectionTypeSchema {
  collectionName: 'formation_phases';
  info: {
    description: 'Major phases in the formation journey (Awakening, Separation, etc.)';
    displayName: 'Formation Phase';
    pluralName: 'formation-phases';
    singularName: 'formation-phase';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    checksum: Schema.Attribute.String;
    color: Schema.Attribute.Enumeration<
      ['blue', 'purple', 'indigo', 'green', 'amber']
    > &
      Schema.Attribute.DefaultTo<'blue'>;
    courses: Schema.Attribute.Relation<'oneToMany', 'api::course.course'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.RichText & Schema.Attribute.Required;
    duration: Schema.Attribute.String;
    estimatedDuration: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    lastSyncedAt: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::formation-phase.formation-phase'
    > &
      Schema.Attribute.Private;
    maturityFocus: Schema.Attribute.JSON;
    nodes: Schema.Attribute.Relation<
      'oneToMany',
      'api::guidebook-node.guidebook-node'
    >;
    notionPageId: Schema.Attribute.String & Schema.Attribute.Unique;
    order: Schema.Attribute.Integer & Schema.Attribute.Required;
    phase: Schema.Attribute.Enumeration<
      ['awakening', 'separation', 'discernment', 'commission', 'stewardship']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    phaseId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    phaseName: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'phaseName'> & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      [
        'Draft',
        'Review',
        'Ready',
        'Synced',
        'Published',
        'Deprecated',
        'Needs Revision',
      ]
    > &
      Schema.Attribute.DefaultTo<'Draft'>;
    strapiEntryId: Schema.Attribute.String & Schema.Attribute.Unique;
    syncedToStrapi: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    syncErrors: Schema.Attribute.Text;
    syncLock: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    unlockRequirements: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiFormationProtocolFormationProtocol
  extends Struct.CollectionTypeSchema {
  collectionName: 'formation_protocols';
  info: {
    description: 'A repeatable formation loop with ordered phases and diagnostics.';
    displayName: 'Formation Protocol';
    pluralName: 'formation-protocols';
    singularName: 'formation-protocol';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    declarationMd: Schema.Attribute.RichText;
    diagnostics: Schema.Attribute.Relation<
      'oneToMany',
      'api::protocol-diagnostic.protocol-diagnostic'
    >;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::formation-protocol.formation-protocol'
    > &
      Schema.Attribute.Private;
    phases: Schema.Attribute.Relation<
      'oneToMany',
      'api::protocol-phase.protocol-phase'
    >;
    protocolId: Schema.Attribute.String & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'> & Schema.Attribute.Required;
    summaryMd: Schema.Attribute.RichText;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    usageModes: Schema.Attribute.Component<'protocol.usage-mode', true>;
    version: Schema.Attribute.String & Schema.Attribute.DefaultTo<'v1'>;
  };
}

export interface ApiFormationReflectionFormationReflection
  extends Struct.CollectionTypeSchema {
  collectionName: 'formation_reflections';
  info: {
    description: 'User reflections submitted at formation checkpoints';
    displayName: 'Formation Reflection';
    pluralName: 'formation-reflections';
    singularName: 'formation-reflection';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    anonymousUserId: Schema.Attribute.String;
    audioUrl: Schema.Attribute.String;
    checkpointId: Schema.Attribute.String & Schema.Attribute.Required;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    depthScore: Schema.Attribute.Float;
    indicators: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::formation-reflection.formation-reflection'
    > &
      Schema.Attribute.Private;
    phase: Schema.Attribute.Enumeration<
      ['awakening', 'separation', 'discernment', 'commission', 'stewardship']
    > &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    reflectionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    reflectionType: Schema.Attribute.Enumeration<['text', 'voice']> &
      Schema.Attribute.Required;
    sectionId: Schema.Attribute.String & Schema.Attribute.Required;
    submittedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    timeSinceCheckpointReached: Schema.Attribute.Integer &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    verse: Schema.Attribute.Relation<
      'manyToOne',
      'api::scripture-verse.scripture-verse'
    >;
    wordCount: Schema.Attribute.Integer & Schema.Attribute.Required;
  };
}

export interface ApiGalleryGallery extends Struct.CollectionTypeSchema {
  collectionName: 'galleries';
  info: {
    displayName: 'Gallery (paused)';
    pluralName: 'galleries';
    singularName: 'gallery';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::gallery.gallery'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiGlobalGlobal extends Struct.SingleTypeSchema {
  collectionName: 'globals';
  info: {
    description: 'Define global settings';
    displayName: 'Global';
    pluralName: 'globals';
    singularName: 'global';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    contactEmail: Schema.Attribute.String;
    contactPhone: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    defaultSeo: Schema.Attribute.Component<'shared.seo', false>;
    favicon: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::global.global'
    > &
      Schema.Attribute.Private;
    mailingAddress: Schema.Attribute.Text;
    primaryCtaLabel: Schema.Attribute.String;
    primaryCtaUrl: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    siteDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    siteName: Schema.Attribute.String & Schema.Attribute.Required;
    socialLinks: Schema.Attribute.Component<'shared.social-link', true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiGlossaryTermGlossaryTerm
  extends Struct.CollectionTypeSchema {
  collectionName: 'glossary_terms';
  info: {
    description: 'Theological and linguistic definitions';
    displayName: 'Glossary Term';
    pluralName: 'glossary-terms';
    singularName: 'glossary-term';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      ['theological', 'linguistic', 'cultural', 'historical', 'liturgical']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    definition: Schema.Attribute.RichText & Schema.Attribute.Required;
    greekTerm: Schema.Attribute.String;
    hebrewTerm: Schema.Attribute.String;
    lemma: Schema.Attribute.Relation<
      'oneToOne',
      'api::scripture-lemma.scripture-lemma'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::glossary-term.glossary-term'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    references: Schema.Attribute.JSON;
    relatedTerms: Schema.Attribute.Relation<
      'manyToMany',
      'api::glossary-term.glossary-term'
    >;
    shortDefinition: Schema.Attribute.Text;
    slug: Schema.Attribute.UID<'term'>;
    term: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiGuidebookNodeGuidebookNode
  extends Struct.CollectionTypeSchema {
  collectionName: 'guidebook_nodes';
  info: {
    description: 'Individual teaching sections within a formation phase';
    displayName: 'Guidebook Node';
    pluralName: 'guidebook-nodes';
    singularName: 'guidebook-node';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    canonAxioms: Schema.Attribute.Relation<
      'manyToMany',
      'api::canon-axiom.canon-axiom'
    >;
    checkpointGuidingQuestions: Schema.Attribute.RichText;
    checkpointPrompt: Schema.Attribute.RichText;
    checkpointType: Schema.Attribute.Enumeration<
      ['None', 'Text Response', 'Voice Response', 'Text & Voice']
    > &
      Schema.Attribute.DefaultTo<'None'>;
    checksum: Schema.Attribute.String & Schema.Attribute.Required;
    content: Schema.Attribute.RichText & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    estimatedReadTime: Schema.Attribute.Integer;
    formationFocus: Schema.Attribute.Text;
    formationScope: Schema.Attribute.Enumeration<
      ['Individual', 'Household', 'Ecclesia', 'Network']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Individual'>;
    lastSyncedAt: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::guidebook-node.guidebook-node'
    > &
      Schema.Attribute.Private;
    minimumDwellTime: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<120>;
    minimumWordCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<50>;
    nodeId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    nodeType: Schema.Attribute.Enumeration<
      ['Awakening', 'Healing', 'Warfare', 'Formation', 'Commissioning']
    >;
    notionPageId: Schema.Attribute.String & Schema.Attribute.Unique;
    orderInPhase: Schema.Attribute.Integer & Schema.Attribute.Required;
    phase: Schema.Attribute.Relation<
      'manyToOne',
      'api::formation-phase.formation-phase'
    >;
    publishedAt: Schema.Attribute.DateTime;
    publishedVersion: Schema.Attribute.String;
    scriptureReferences: Schema.Attribute.Text;
    sectionMetadata: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<{
        'canonical-formation': {
          confidence: 'authoritative';
          mutability: 'immutable';
        };
        'implementation-notes': {
          confidence: 'suggestive';
          mutability: 'contextual';
        };
        'kingdom-pattern': {
          confidence: 'authoritative';
          mutability: 'immutable';
        };
        'node-declaration': {
          confidence: 'liturgical';
          mutability: 'immutable';
        };
        'operational-protocol': {
          confidence: 'illustrative';
          mutability: 'contextual';
        };
        'scripture-anchors': {
          confidence: 'authoritative';
          mutability: 'immutable';
        };
        'structural-principles': {
          confidence: 'authoritative';
          mutability: 'immutable';
        };
        warnings: {
          confidence: 'authoritative';
          mutability: 'immutable';
        };
      }>;
    sensitivity: Schema.Attribute.Enumeration<
      ['Low', 'Medium', 'High', 'Critical']
    > &
      Schema.Attribute.DefaultTo<'Medium'>;
    slug: Schema.Attribute.UID<'title'>;
    status: Schema.Attribute.Enumeration<
      [
        'Draft',
        'Review',
        'Ready',
        'Synced',
        'Published',
        'Deprecated',
        'Needs Revision',
      ]
    > &
      Schema.Attribute.DefaultTo<'Draft'>;
    strapiEntryId: Schema.Attribute.String & Schema.Attribute.Unique;
    syncedToStrapi: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    syncErrors: Schema.Attribute.Text;
    syncLock: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    unlockRequirements: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videoMedia: Schema.Attribute.Media<'videos'>;
    videoUrl: Schema.Attribute.String;
  };
}

export interface ApiHeroSectionHeroSection extends Struct.SingleTypeSchema {
  collectionName: 'hero_sections';
  info: {
    displayName: 'Hero Section (legacy)';
    pluralName: 'hero-sections';
    singularName: 'hero-section';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    buttonLink: Schema.Attribute.String;
    buttonText: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::hero-section.hero-section'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiImageImage extends Struct.CollectionTypeSchema {
  collectionName: 'images';
  info: {
    description: '';
    displayName: 'Image';
    pluralName: 'images';
    singularName: 'image';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    altText: Schema.Attribute.String;
    categories: Schema.Attribute.Relation<
      'manyToMany',
      'api::category.category'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    imageFile: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::image.image'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    team_member: Schema.Attribute.Relation<
      'manyToOne',
      'api::team-member.team-member'
    >;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiInsightVoteInsightVote extends Struct.CollectionTypeSchema {
  collectionName: 'insight_votes';
  info: {
    description: 'Community validation votes for iron insights';
    displayName: 'Insight Vote';
    pluralName: 'insight-votes';
    singularName: 'insight-vote';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    comment: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    insight: Schema.Attribute.Relation<
      'manyToOne',
      'api::iron-insight.iron-insight'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::insight-vote.insight-vote'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    votedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    voteType: Schema.Attribute.Enumeration<
      ['helpful', 'profound', 'needs_work']
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiIronInsightIronInsight extends Struct.CollectionTypeSchema {
  collectionName: 'iron_insights';
  info: {
    description: 'AI-analyzed and sharpened insights from user reflections';
    displayName: 'Iron Insight';
    pluralName: 'iron-insights';
    singularName: 'iron-insight';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    aiAnalysis: Schema.Attribute.JSON & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    depthScore: Schema.Attribute.Float &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 10;
          min: 0;
        },
        number
      >;
    insightId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::iron-insight.iron-insight'
    > &
      Schema.Attribute.Private;
    originalContent: Schema.Attribute.Text & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    readinessLevel: Schema.Attribute.Enumeration<
      ['emerging', 'forming', 'maturing', 'established']
    > &
      Schema.Attribute.Required;
    reflection: Schema.Attribute.Relation<
      'oneToOne',
      'api::formation-reflection.formation-reflection'
    >;
    routing: Schema.Attribute.Enumeration<
      ['publish', 'journal', 'thread', 'review']
    > &
      Schema.Attribute.Required;
    routingReason: Schema.Attribute.Text;
    sharpenedInsight: Schema.Attribute.RichText & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['pending', 'published', 'archived']> &
      Schema.Attribute.DefaultTo<'pending'>;
    teachingMoment: Schema.Attribute.RichText;
    themes: Schema.Attribute.Relation<
      'manyToMany',
      'api::scripture-theme.scripture-theme'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    verse: Schema.Attribute.Relation<
      'manyToOne',
      'api::scripture-verse.scripture-verse'
    >;
    votes: Schema.Attribute.Relation<
      'oneToMany',
      'api::insight-vote.insight-vote'
    >;
    voteScore: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiLessonCommentLessonComment
  extends Struct.CollectionTypeSchema {
  collectionName: 'lesson_comments';
  info: {
    description: 'Comments on course lessons with proper relations';
    displayName: 'Lesson Comment';
    pluralName: 'lesson-comments';
    singularName: 'lesson-comment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    approved: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    course: Schema.Attribute.Relation<'manyToOne', 'api::course.course'>;
    courseSlug: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    lesson: Schema.Attribute.Relation<'manyToOne', 'api::lesson.lesson'>;
    lessonSlug: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::lesson-comment.lesson-comment'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiLessonProgressLessonProgress
  extends Struct.CollectionTypeSchema {
  collectionName: 'lesson_progresses';
  info: {
    displayName: 'Lesson Progress';
    pluralName: 'lesson-progresses';
    singularName: 'lesson-progress';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    completed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    completedAt: Schema.Attribute.DateTime;
    courseSlug: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    lessonSlug: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::lesson-progress.lesson-progress'
    > &
      Schema.Attribute.Private;
    progressPercent: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    secondsWatched: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiLessonLesson extends Struct.CollectionTypeSchema {
  collectionName: 'lessons';
  info: {
    displayName: 'Lesson';
    pluralName: 'lessons';
    singularName: 'lesson';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Relation<'manyToOne', 'api::category.category'>;
    checksum: Schema.Attribute.String;
    comments: Schema.Attribute.Relation<
      'oneToMany',
      'api::lesson-comment.lesson-comment'
    >;
    content: Schema.Attribute.RichText;
    course: Schema.Attribute.Relation<'manyToOne', 'api::course.course'> &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    duration: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    featuredInResources: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource-directory.resource-directory'
    >;
    keyScripture: Schema.Attribute.Text;
    lastSyncedAt: Schema.Attribute.DateTime;
    lessonId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    lessonTitle: Schema.Attribute.String;
    lessonType: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::lesson.lesson'
    > &
      Schema.Attribute.Private;
    module: Schema.Attribute.Relation<'manyToOne', 'api::module.module'>;
    notionPageId: Schema.Attribute.String & Schema.Attribute.Unique;
    order: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    previewAvailable: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    publishedAt: Schema.Attribute.DateTime;
    requiredAccessLevel: Schema.Attribute.Enumeration<
      ['basic', 'full', 'leader']
    > &
      Schema.Attribute.DefaultTo<'basic'>;
    resources: Schema.Attribute.Component<'shared.resource-link', true>;
    runtime: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    source: Schema.Attribute.Component<'media.video-source', false>;
    speakers: Schema.Attribute.Relation<'manyToMany', 'api::speaker.speaker'>;
    status: Schema.Attribute.Enumeration<
      [
        'Draft',
        'Review',
        'Ready',
        'Synced',
        'Published',
        'Deprecated',
        'Needs Revision',
      ]
    > &
      Schema.Attribute.DefaultTo<'Draft'>;
    strapiEntryId: Schema.Attribute.String & Schema.Attribute.Unique;
    summary: Schema.Attribute.Text;
    syncedToStrapi: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    syncErrors: Schema.Attribute.Text;
    syncLock: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    transcript: Schema.Attribute.RichText;
    transcriptFile: Schema.Attribute.Media<'files'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videoUrl: Schema.Attribute.String;
  };
}

export interface ApiLivingCommentaryLivingCommentary
  extends Struct.CollectionTypeSchema {
  collectionName: 'living_commentaries';
  info: {
    description: 'Validated community wisdom layer on scripture';
    displayName: 'Living Commentary';
    pluralName: 'living-commentaries';
    singularName: 'living-commentary';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.RichText & Schema.Attribute.Required;
    contributors: Schema.Attribute.Relation<
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    curatedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    helpfulCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::living-commentary.living-commentary'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    qualityScore: Schema.Attribute.Float &
      Schema.Attribute.SetMinMax<
        {
          max: 10;
          min: 0;
        },
        number
      >;
    sourceInsights: Schema.Attribute.Relation<
      'oneToMany',
      'api::iron-insight.iron-insight'
    >;
    themes: Schema.Attribute.Relation<
      'manyToMany',
      'api::scripture-theme.scripture-theme'
    >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      [
        'exegesis',
        'application',
        'cross_reference',
        'cultural_context',
        'theological_insight',
      ]
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verse: Schema.Attribute.Relation<
      'manyToOne',
      'api::scripture-verse.scripture-verse'
    >;
    viewCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiMarginReflectionMarginReflection
  extends Struct.CollectionTypeSchema {
  collectionName: 'margin_reflections';
  info: {
    description: 'Public margin notes on scripture passages';
    displayName: 'Margin Reflection';
    pluralName: 'margin-reflections';
    singularName: 'margin-reflection';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    author: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    content: Schema.Attribute.RichText & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    helpfulCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    isValidated: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::margin-reflection.margin-reflection'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sourceInsight: Schema.Attribute.Relation<
      'oneToOne',
      'api::iron-insight.iron-insight'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    validatedAt: Schema.Attribute.DateTime;
    validatedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    verse: Schema.Attribute.Relation<
      'manyToOne',
      'api::scripture-verse.scripture-verse'
    >;
    viewCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiMediaItemMediaItem extends Struct.CollectionTypeSchema {
  collectionName: 'media_items';
  info: {
    displayName: 'Media Item';
    pluralName: 'media-items';
    singularName: 'media-item';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    autoPublish: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    category: Schema.Attribute.Relation<'manyToOne', 'api::category.category'>;
    chapters: Schema.Attribute.Component<'media.chapter', true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ctaLabel: Schema.Attribute.String;
    ctaUrl: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    durationSec: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    episodeNumber: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    excerpt: Schema.Attribute.Text;
    featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    featuredInResources: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource-directory.resource-directory'
    >;
    gallery: Schema.Attribute.Media<'images', true>;
    hashtags: Schema.Attribute.String;
    legacyCategory: Schema.Attribute.String & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::media-item.media-item'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    publishFacebook: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    publishInstagram: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    publishLocals: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    publishPatreon: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    publishRumble: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    publishStatus: Schema.Attribute.JSON;
    publishTruthSocial: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    publishX: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    publishYouTube: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    reflectionPrompts: Schema.Attribute.Component<
      'media.reflection-prompt',
      true
    >;
    releasedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    requiredAccessLevel: Schema.Attribute.Enumeration<
      ['basic', 'full', 'leader']
    > &
      Schema.Attribute.DefaultTo<'basic'>;
    resources: Schema.Attribute.Component<'media.resource', true>;
    seoDescription: Schema.Attribute.Text;
    seoImage: Schema.Attribute.Media<'images'>;
    seoTitle: Schema.Attribute.String;
    series: Schema.Attribute.Relation<'manyToOne', 'api::series.series'>;
    shortDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    socialThumbnail: Schema.Attribute.Media<'images'>;
    source: Schema.Attribute.Component<'media.video-source', false>;
    speakers: Schema.Attribute.Relation<'manyToMany', 'api::speaker.speaker'>;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    thumbnail: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    transcript: Schema.Attribute.RichText;
    type: Schema.Attribute.Enumeration<
      ['testimony', 'teaching', 'worship', 'podcast', 'short']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'testimony'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videoUrl: Schema.Attribute.String;
    views: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    weekNumber: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
  };
}

export interface ApiMediaProgressMediaProgress
  extends Struct.CollectionTypeSchema {
  collectionName: 'media_progresses';
  info: {
    description: 'Tracks user playback progress for media items';
    displayName: 'Media Progress';
    pluralName: 'media-progresses';
    singularName: 'media-progress';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    completed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currentTime: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    duration: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    lastUpdated: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::media-progress.media-progress'
    > &
      Schema.Attribute.Private;
    mediaItem: Schema.Attribute.Relation<
      'manyToOne',
      'api::media-item.media-item'
    > &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiModuleModule extends Struct.CollectionTypeSchema {
  collectionName: 'modules';
  info: {
    description: 'Ordered structural unit within a course.';
    displayName: 'Module';
    pluralName: 'modules';
    singularName: 'module';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    course: Schema.Attribute.Relation<'manyToOne', 'api::course.course'> &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.RichText;
    lessons: Schema.Attribute.Relation<'oneToMany', 'api::lesson.lesson'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::module.module'
    > &
      Schema.Attribute.Private;
    moduleId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    order: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiOutreachCampaignOutreachCampaign
  extends Struct.CollectionTypeSchema {
  collectionName: 'outreach_campaigns';
  info: {
    description: 'Recurring outreach initiatives that can be linked from stories or the outreach page';
    displayName: 'Outreach Campaign';
    pluralName: 'outreach-campaigns';
    singularName: 'outreach-campaign';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.RichText;
    donationLink: Schema.Attribute.String;
    endDate: Schema.Attribute.Date;
    giveCode: Schema.Attribute.String;
    impactMetrics: Schema.Attribute.Component<'impact.metric', true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::outreach-campaign.outreach-campaign'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    startDate: Schema.Attribute.Date;
    stories: Schema.Attribute.Relation<
      'oneToMany',
      'api::outreach-story.outreach-story'
    >;
    summary: Schema.Attribute.Text;
    supportingMedia: Schema.Attribute.Media<'images' | 'videos', true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiOutreachStoryOutreachStory
  extends Struct.CollectionTypeSchema {
  collectionName: 'outreach_stories';
  info: {
    description: 'Stories and testimonies from community outreach';
    displayName: 'Outreach Story';
    pluralName: 'outreach-stories';
    singularName: 'outreach-story';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    body: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::outreach-story.outreach-story'
    > &
      Schema.Attribute.Private;
    media: Schema.Attribute.Media<'images' | 'videos' | 'files', true>;
    publishedAt: Schema.Attribute.DateTime;
    relatedCampaign: Schema.Attribute.Relation<
      'manyToOne',
      'api::outreach-campaign.outreach-campaign'
    >;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    slug: Schema.Attribute.UID<'title'> & Schema.Attribute.Required;
    storyDate: Schema.Attribute.Date;
    summary: Schema.Attribute.Text;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPrayerPrayer extends Struct.CollectionTypeSchema {
  collectionName: 'prayers';
  info: {
    displayName: 'Prayer';
    pluralName: 'prayers';
    singularName: 'prayer';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    answered: Schema.Attribute.Boolean;
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    body: Schema.Attribute.Text;
    city: Schema.Attribute.String;
    content: Schema.Attribute.Blocks;
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.String;
    featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::prayer.prayer'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    prayedCount: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    replies: Schema.Attribute.Relation<'oneToMany', 'api::reply.reply'>;
    status: Schema.Attribute.Enumeration<['open', 'answered', 'closed']> &
      Schema.Attribute.DefaultTo<'open'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPresignedUploadPresignedUpload
  extends Struct.CollectionTypeSchema {
  collectionName: 'presigned_uploads';
  info: {
    description: 'Tracks files uploaded via presigned URLs';
    displayName: 'Presigned Upload';
    pluralName: 'presigned-uploads';
    singularName: 'presigned-upload';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    filename: Schema.Attribute.String & Schema.Attribute.Required;
    key: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::presigned-upload.presigned-upload'
    > &
      Schema.Attribute.Private;
    mimeType: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    size: Schema.Attribute.BigInteger & Schema.Attribute.Required;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    uploadedAt: Schema.Attribute.DateTime;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiProjectProject extends Struct.CollectionTypeSchema {
  collectionName: 'projects';
  info: {
    description: '';
    displayName: 'Project';
    pluralName: 'projects';
    singularName: 'project';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::project.project'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    publishedDate: Schema.Attribute.Date;
    thumbnail: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videoURL: Schema.Attribute.String;
  };
}

export interface ApiProtocolDiagnosticProtocolDiagnostic
  extends Struct.CollectionTypeSchema {
  collectionName: 'protocol_diagnostics';
  info: {
    description: 'A quick diagnostic that maps a condition to a recommended protocol phase.';
    displayName: 'Protocol Diagnostic';
    pluralName: 'protocol-diagnostics';
    singularName: 'protocol-diagnostic';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descriptionMd: Schema.Attribute.RichText;
    diagnosticKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::protocol-diagnostic.protocol-diagnostic'
    > &
      Schema.Attribute.Private;
    order: Schema.Attribute.Integer & Schema.Attribute.Required;
    protocol: Schema.Attribute.Relation<
      'manyToOne',
      'api::formation-protocol.formation-protocol'
    >;
    publishedAt: Schema.Attribute.DateTime;
    recommendedPhase: Schema.Attribute.Relation<
      'manyToOne',
      'api::protocol-phase.protocol-phase'
    >;
    recommendedPhaseSlug: Schema.Attribute.String;
    trigger: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProtocolPhaseProtocolPhase
  extends Struct.CollectionTypeSchema {
  collectionName: 'protocol_phases';
  info: {
    description: 'An ordered phase within a formation protocol.';
    displayName: 'Protocol Phase';
    pluralName: 'protocol-phases';
    singularName: 'protocol-phase';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    aimMd: Schema.Attribute.RichText;
    cadence: Schema.Attribute.Enumeration<
      ['once', 'daily', 'weekly', 'seasonal', 'as_needed']
    > &
      Schema.Attribute.DefaultTo<'as_needed'>;
    commonTraps: Schema.Attribute.Component<'protocol.labeled-note', true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    declarationMd: Schema.Attribute.RichText;
    lane: Schema.Attribute.Enumeration<['boot', 'daily', 'commission']>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::protocol-phase.protocol-phase'
    > &
      Schema.Attribute.Private;
    order: Schema.Attribute.Integer & Schema.Attribute.Required;
    practices: Schema.Attribute.Component<'protocol.practice', true>;
    prayerMd: Schema.Attribute.RichText;
    protocol: Schema.Attribute.Relation<
      'manyToOne',
      'api::formation-protocol.formation-protocol'
    >;
    publishedAt: Schema.Attribute.DateTime;
    scriptureAnchors: Schema.Attribute.Component<
      'protocol.scripture-anchor',
      true
    >;
    signsOfAlignment: Schema.Attribute.Component<'protocol.labeled-note', true>;
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    summaryMd: Schema.Attribute.RichText;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReplyReply extends Struct.CollectionTypeSchema {
  collectionName: 'replies';
  info: {
    displayName: 'Reply (paused)';
    pluralName: 'replies';
    singularName: 'reply';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    author: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-profile.user-profile'
    >;
    content: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::reply.reply'> &
      Schema.Attribute.Private;
    prayer: Schema.Attribute.Relation<'manyToOne', 'api::prayer.prayer'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiResourceDirectoryResourceDirectory
  extends Struct.SingleTypeSchema {
  collectionName: 'resource_directories';
  info: {
    displayName: 'Resource Directory';
    pluralName: 'resource-directories';
    singularName: 'resource-directory';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    featuredArticles: Schema.Attribute.Relation<
      'manyToMany',
      'api::article.article'
    >;
    featuredBlogPosts: Schema.Attribute.Relation<
      'manyToMany',
      'api::blog-post.blog-post'
    >;
    featuredLessons: Schema.Attribute.Relation<
      'manyToMany',
      'api::lesson.lesson'
    >;
    featuredMediaItems: Schema.Attribute.Relation<
      'manyToMany',
      'api::media-item.media-item'
    >;
    heroCopy: Schema.Attribute.RichText;
    highlights: Schema.Attribute.Component<'shared.highlight', true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::resource-directory.resource-directory'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    requiredAccessLevel: Schema.Attribute.Enumeration<
      ['basic', 'full', 'leader']
    > &
      Schema.Attribute.DefaultTo<'basic'>;
    sections: Schema.Attribute.Component<'resource.resource-card', true>;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiResourceResource extends Struct.CollectionTypeSchema {
  collectionName: 'resources';
  info: {
    description: 'External lesson resources, references, or downloads.';
    displayName: 'Resource';
    pluralName: 'resources';
    singularName: 'resource';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    checksum: Schema.Attribute.String;
    course: Schema.Attribute.Relation<'manyToOne', 'api::course.course'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    lastSyncedAt: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::resource.resource'
    > &
      Schema.Attribute.Private;
    notionPageId: Schema.Attribute.String & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    resourceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    resourceType: Schema.Attribute.Enumeration<
      ['article', 'video', 'audio', 'document', 'tool', 'link']
    >;
    strapiEntryId: Schema.Attribute.String & Schema.Attribute.Unique;
    syncedToStrapi: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    syncErrors: Schema.Attribute.Text;
    syncLock: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String;
  };
}

export interface ApiScriptureAlignmentScriptureAlignment
  extends Struct.CollectionTypeSchema {
  collectionName: 'scripture_alignments';
  info: {
    description: 'Interlinear word alignment mapping';
    displayName: 'Scripture Alignment';
    pluralName: 'scripture-alignments';
    singularName: 'scripture-alignment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    alignmentType: Schema.Attribute.Enumeration<
      ['one_to_one', 'one_to_many', 'many_to_one', 'implicit']
    > &
      Schema.Attribute.DefaultTo<'one_to_one'>;
    confidence: Schema.Attribute.Float &
      Schema.Attribute.SetMinMax<
        {
          max: 1;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-alignment.scripture-alignment'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    sourceToken: Schema.Attribute.Relation<
      'manyToOne',
      'api::scripture-token.scripture-token'
    >;
    targetWord: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiScriptureBookScriptureBook
  extends Struct.CollectionTypeSchema {
  collectionName: 'scripture_books';
  info: {
    description: 'Canonical grouping of scripture works (Law, Prophets, Writings, etc.)';
    displayName: 'Scripture Book';
    pluralName: 'scripture-books';
    singularName: 'scripture-book';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    canonicalOrder: Schema.Attribute.Integer & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    greekName: Schema.Attribute.String;
    hebrewName: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-book.scripture-book'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'>;
    testament: Schema.Attribute.Enumeration<
      ['tanakh', 'renewed_covenant', 'apocrypha']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    works: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-work.scripture-work'
    >;
  };
}

export interface ApiScriptureLemmaScriptureLemma
  extends Struct.CollectionTypeSchema {
  collectionName: 'scripture_lemmas';
  info: {
    description: 'Lexical root form for word study';
    displayName: 'Scripture Lemma';
    pluralName: 'scripture-lemmas';
    singularName: 'scripture-lemma';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    definition: Schema.Attribute.Text;
    etymology: Schema.Attribute.Text;
    glossaryTerm: Schema.Attribute.Relation<
      'oneToOne',
      'api::glossary-term.glossary-term'
    >;
    language: Schema.Attribute.Enumeration<['hebrew', 'aramaic', 'greek']> &
      Schema.Attribute.Required;
    lemmaId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-lemma.scripture-lemma'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    rootForm: Schema.Attribute.String & Schema.Attribute.Required;
    strongsNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    tokens: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-token.scripture-token'
    >;
    transliteration: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    usageCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiScriptureThemeScriptureTheme
  extends Struct.CollectionTypeSchema {
  collectionName: 'scripture_themes';
  info: {
    description: 'Thematic tagging for scripture passages';
    displayName: 'Scripture Theme';
    pluralName: 'scripture-themes';
    singularName: 'scripture-theme';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      [
        'covenant',
        'kingdom',
        'holiness',
        'redemption',
        'worship',
        'prophecy',
        'wisdom',
        'law',
        'grace',
        'spirit',
      ]
    >;
    childThemes: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-theme.scripture-theme'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-theme.scripture-theme'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    parentTheme: Schema.Attribute.Relation<
      'manyToOne',
      'api::scripture-theme.scripture-theme'
    >;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verseCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    verses: Schema.Attribute.Relation<
      'manyToMany',
      'api::scripture-verse.scripture-verse'
    >;
  };
}

export interface ApiScriptureTokenScriptureToken
  extends Struct.CollectionTypeSchema {
  collectionName: 'scripture_tokens';
  info: {
    description: 'Word-level token for interlinear analysis';
    displayName: 'Scripture Token';
    pluralName: 'scripture-tokens';
    singularName: 'scripture-token';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    gloss: Schema.Attribute.String;
    lemma: Schema.Attribute.Relation<
      'manyToOne',
      'api::scripture-lemma.scripture-lemma'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-token.scripture-token'
    > &
      Schema.Attribute.Private;
    morphology: Schema.Attribute.JSON;
    partOfSpeech: Schema.Attribute.Enumeration<
      [
        'noun',
        'verb',
        'adjective',
        'pronoun',
        'preposition',
        'conjunction',
        'article',
        'particle',
        'proper_noun',
      ]
    >;
    position: Schema.Attribute.Integer & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    strongsNumber: Schema.Attribute.String;
    surfaceForm: Schema.Attribute.String & Schema.Attribute.Required;
    tokenId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    transliteration: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verse: Schema.Attribute.Relation<
      'manyToOne',
      'api::scripture-verse.scripture-verse'
    >;
  };
}

export interface ApiScriptureVerseScriptureVerse
  extends Struct.CollectionTypeSchema {
  collectionName: 'scripture_verses';
  info: {
    description: 'Individual verse from YahScriptures translation';
    displayName: 'Scripture Verse';
    pluralName: 'scripture-verses';
    singularName: 'scripture-verse';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    chapter: Schema.Attribute.Integer & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    footnotes: Schema.Attribute.JSON;
    hasFootnotes: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-verse.scripture-verse'
    > &
      Schema.Attribute.Private;
    paleoHebrewDivineNames: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    publishedAt: Schema.Attribute.DateTime;
    reflections: Schema.Attribute.Relation<
      'oneToMany',
      'api::formation-reflection.formation-reflection'
    >;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    themes: Schema.Attribute.Relation<
      'manyToMany',
      'api::scripture-theme.scripture-theme'
    >;
    tokens: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-token.scripture-token'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verse: Schema.Attribute.Integer & Schema.Attribute.Required;
    verseId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    work: Schema.Attribute.Relation<
      'manyToOne',
      'api::scripture-work.scripture-work'
    >;
  };
}

export interface ApiScriptureWorkScriptureWork
  extends Struct.CollectionTypeSchema {
  collectionName: 'scripture_works';
  info: {
    description: 'A work/book in the YahScriptures collection (103 total)';
    displayName: 'Scripture Work';
    pluralName: 'scripture-works';
    singularName: 'scripture-work';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    author: Schema.Attribute.String;
    canonicalName: Schema.Attribute.String & Schema.Attribute.Required;
    canonicalOrder: Schema.Attribute.Integer & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    estimatedDate: Schema.Attribute.String;
    genre: Schema.Attribute.Enumeration<
      [
        'law',
        'history',
        'wisdom',
        'prophecy',
        'gospel',
        'epistle',
        'apocalyptic',
      ]
    >;
    greekName: Schema.Attribute.String;
    hebrewName: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-work.scripture-work'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    shortCode: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    summary: Schema.Attribute.Text;
    testament: Schema.Attribute.Enumeration<
      ['tanakh', 'renewed_covenant', 'apocrypha']
    > &
      Schema.Attribute.Required;
    totalChapters: Schema.Attribute.Integer & Schema.Attribute.Required;
    totalVerses: Schema.Attribute.Integer & Schema.Attribute.Required;
    translatedTitle: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verses: Schema.Attribute.Relation<
      'oneToMany',
      'api::scripture-verse.scripture-verse'
    >;
    workId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
  };
}

export interface ApiSeriesSeries extends Struct.CollectionTypeSchema {
  collectionName: 'series';
  info: {
    description: 'Organize related media items into thematic collections.';
    displayName: 'Series';
    pluralName: 'series-collection';
    singularName: 'series';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    coverImage: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.RichText;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::series.series'
    > &
      Schema.Attribute.Private;
    mediaItems: Schema.Attribute.Relation<
      'oneToMany',
      'api::media-item.media-item'
    >;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSettingSetting extends Struct.CollectionTypeSchema {
  collectionName: 'settings';
  info: {
    displayName: 'Setting (legacy)';
    pluralName: 'settings';
    singularName: 'setting';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    defaultSEO: Schema.Attribute.Component<'general.se-ometadata', false>;
    favicon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::setting.setting'
    > &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    publishedAt: Schema.Attribute.DateTime;
    siteName: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSpeakerSpeaker extends Struct.CollectionTypeSchema {
  collectionName: 'speakers';
  info: {
    displayName: 'Speaker';
    pluralName: 'speakers';
    singularName: 'speaker';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    bio: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    displayName: Schema.Attribute.String;
    featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lessons: Schema.Attribute.Relation<'manyToMany', 'api::lesson.lesson'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::speaker.speaker'
    > &
      Schema.Attribute.Private;
    mediaItems: Schema.Attribute.Relation<
      'manyToMany',
      'api::media-item.media-item'
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    organization: Schema.Attribute.String;
    photo: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    socialLinks: Schema.Attribute.Component<'shared.social-link', true>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiStatStat extends Struct.CollectionTypeSchema {
  collectionName: 'stats';
  info: {
    displayName: 'Impact Stat';
    pluralName: 'stats';
    singularName: 'stat';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    body: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    headline: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::stat.stat'> &
      Schema.Attribute.Private;
    metrics: Schema.Attribute.Component<'impact.metric', true>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTagTag extends Struct.CollectionTypeSchema {
  collectionName: 'tags';
  info: {
    displayName: 'Tag';
    pluralName: 'tags';
    singularName: 'tag';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    audio_files: Schema.Attribute.Relation<
      'manyToMany',
      'api::audio-file.audio-file'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    images: Schema.Attribute.Relation<'manyToMany', 'api::image.image'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::tag.tag'> &
      Schema.Attribute.Private;
    mediaItems: Schema.Attribute.Relation<
      'manyToMany',
      'api::media-item.media-item'
    >;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videos: Schema.Attribute.Relation<'manyToMany', 'api::video.video'>;
  };
}

export interface ApiTeamMemberTeamMember extends Struct.CollectionTypeSchema {
  collectionName: 'team_members';
  info: {
    description: '';
    displayName: 'Team Member';
    pluralName: 'team-members';
    singularName: 'team-member';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    bio: Schema.Attribute.Blocks;
    blog_posts: Schema.Attribute.Relation<
      'oneToMany',
      'api::blog-post.blog-post'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    images: Schema.Attribute.Relation<'oneToMany', 'api::image.image'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::team-member.team-member'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    profilePicture: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.String;
    socialLinks: Schema.Attribute.Component<'general.social-links', true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTestimonialTestimonial extends Struct.CollectionTypeSchema {
  collectionName: 'testimonials';
  info: {
    displayName: 'Testimonial (paused)';
    pluralName: 'testimonials';
    singularName: 'testimonial';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    clientImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    clientName: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    feedback: Schema.Attribute.Blocks;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::testimonial.testimonial'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTestimonyTestimony extends Struct.CollectionTypeSchema {
  collectionName: 'testimonies';
  info: {
    description: 'Stories of transformation shared through Ruach Studios';
    displayName: 'Testimony';
    pluralName: 'testimonies';
    singularName: 'testimony';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    ageRange: Schema.Attribute.Enumeration<
      [
        'Under 18',
        'Age 18-24',
        'Age 25-34',
        'Age 35-44',
        'Age 45-54',
        'Age 55+',
      ]
    >;
    contact_preference: Schema.Attribute.Enumeration<
      ['Email', 'Phone', 'Text', 'None']
    >;
    core_message: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    join_future_projects: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::testimony.testimony'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    media_consent: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    media_upload: Schema.Attribute.Media<'images' | 'videos'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    on_camera: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    phone: Schema.Attribute.String;
    prayer_request: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    referral_source: Schema.Attribute.Enumeration<
      ['Friend', 'Church', 'Social Media', 'Event', 'Other']
    >;
    scripture_anchor: Schema.Attribute.String;
    socialHandles: Schema.Attribute.String;
    story_after: Schema.Attribute.Text & Schema.Attribute.Required;
    story_before: Schema.Attribute.Text & Schema.Attribute.Required;
    story_encounter: Schema.Attribute.Text & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTrendingVideoTrendingVideo
  extends Struct.CollectionTypeSchema {
  collectionName: 'trending_videos';
  info: {
    description: '';
    displayName: 'Trending Video (read-only)';
    pluralName: 'trending-videos';
    singularName: 'trending-video';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    lastUpdated: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::trending-video.trending-video'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    trendingScore: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    views: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiUserProfileUserProfile extends Struct.CollectionTypeSchema {
  collectionName: 'user_profiles';
  info: {
    description: '';
    displayName: 'User Profile';
    pluralName: 'user-profiles';
    singularName: 'user-profile';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    bio: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    fullName: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-profile.user-profile'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    preferences: Schema.Attribute.JSON;
    profilePicture: Schema.Attribute.Media<'images' | 'files'>;
    publishedAt: Schema.Attribute.DateTime;
    reply: Schema.Attribute.Relation<'oneToOne', 'api::reply.reply'>;
    role: Schema.Attribute.Enumeration<
      ['Artist', 'Supporter', 'Collaborator']
    > &
      Schema.Attribute.DefaultTo<'Supporter'>;
    socialLinks: Schema.Attribute.Component<'general.social-links', true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users_permissions_user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiVideoHeroVideoHero extends Struct.CollectionTypeSchema {
  collectionName: 'video_heroes';
  info: {
    description: '';
    displayName: 'video-hero';
    pluralName: 'video-heroes';
    singularName: 'video-hero';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    button: Schema.Attribute.Component<'general.button', true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::video-hero.video-hero'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiVideoVideo extends Struct.CollectionTypeSchema {
  collectionName: 'videos';
  info: {
    description: '';
    displayName: 'Video (read-only)';
    pluralName: 'videos';
    singularName: 'video';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    categories: Schema.Attribute.Relation<
      'manyToMany',
      'api::category.category'
    >;
    channels: Schema.Attribute.Relation<'manyToMany', 'api::channel.channel'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    isShort: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::video.video'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    publishedDate: Schema.Attribute.Date;
    requiredAccessLevel: Schema.Attribute.Enumeration<
      ['basic', 'full', 'leader']
    > &
      Schema.Attribute.DefaultTo<'basic'>;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    thumbnail: Schema.Attribute.Media<'files' | 'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    trending_video: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    uid: Schema.Attribute.UID;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videoUrl: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiVolunteerSignupVolunteerSignup
  extends Struct.CollectionTypeSchema {
  collectionName: 'volunteer_signups';
  info: {
    description: 'Volunteer signup submissions from the website';
    displayName: 'Volunteer Signup';
    pluralName: 'volunteer-signups';
    singularName: 'volunteer-signup';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    availability: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::volunteer-signup.volunteer-signup'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.Text;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    accessLevel: Schema.Attribute.Enumeration<['basic', 'full', 'leader']> &
      Schema.Attribute.DefaultTo<'basic'>;
    activeMembership: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    comment_reports: Schema.Attribute.Relation<
      'oneToMany',
      'api::comment-report.comment-report'
    >;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    course_licenses: Schema.Attribute.Relation<
      'oneToMany',
      'api::course-license.course-license'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    entitlements: Schema.Attribute.JSON;
    lesson_comments: Schema.Attribute.Relation<
      'oneToMany',
      'api::lesson-comment.lesson-comment'
    >;
    lesson_progresses: Schema.Attribute.Relation<
      'oneToMany',
      'api::lesson-progress.lesson-progress'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    membershipCurrentPeriodEnd: Schema.Attribute.DateTime;
    membershipEndedAt: Schema.Attribute.DateTime;
    membershipPlanName: Schema.Attribute.String;
    membershipStartedAt: Schema.Attribute.DateTime;
    membershipStatus: Schema.Attribute.Enumeration<
      [
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused',
      ]
    > &
      Schema.Attribute.DefaultTo<'incomplete'>;
    membershipTier: Schema.Attribute.Enumeration<
      ['supporter', 'partner', 'builder', 'steward']
    > &
      Schema.Attribute.DefaultTo<'supporter'>;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    stripeCustomerId: Schema.Attribute.String & Schema.Attribute.Private;
    stripeSubscriptionId: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_profile: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-profile.user-profile'
    >;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::about.about': ApiAboutAbout;
      'api::article.article': ApiArticleArticle;
      'api::assignment.assignment': ApiAssignmentAssignment;
      'api::audio-file.audio-file': ApiAudioFileAudioFile;
      'api::author.author': ApiAuthorAuthor;
      'api::blog-post.blog-post': ApiBlogPostBlogPost;
      'api::canon-axiom.canon-axiom': ApiCanonAxiomCanonAxiom;
      'api::canon-release.canon-release': ApiCanonReleaseCanonRelease;
      'api::category.category': ApiCategoryCategory;
      'api::channel.channel': ApiChannelChannel;
      'api::comment-report.comment-report': ApiCommentReportCommentReport;
      'api::community-outreach-page.community-outreach-page': ApiCommunityOutreachPageCommunityOutreachPage;
      'api::contact-info.contact-info': ApiContactInfoContactInfo;
      'api::contact-message.contact-message': ApiContactMessageContactMessage;
      'api::contact-submission.contact-submission': ApiContactSubmissionContactSubmission;
      'api::course-license.course-license': ApiCourseLicenseCourseLicense;
      'api::course-profile.course-profile': ApiCourseProfileCourseProfile;
      'api::course.course': ApiCourseCourse;
      'api::donation.donation': ApiDonationDonation;
      'api::event.event': ApiEventEvent;
      'api::faq.faq': ApiFaqFaq;
      'api::formation-event.formation-event': ApiFormationEventFormationEvent;
      'api::formation-journey.formation-journey': ApiFormationJourneyFormationJourney;
      'api::formation-phase.formation-phase': ApiFormationPhaseFormationPhase;
      'api::formation-protocol.formation-protocol': ApiFormationProtocolFormationProtocol;
      'api::formation-reflection.formation-reflection': ApiFormationReflectionFormationReflection;
      'api::gallery.gallery': ApiGalleryGallery;
      'api::global.global': ApiGlobalGlobal;
      'api::glossary-term.glossary-term': ApiGlossaryTermGlossaryTerm;
      'api::guidebook-node.guidebook-node': ApiGuidebookNodeGuidebookNode;
      'api::hero-section.hero-section': ApiHeroSectionHeroSection;
      'api::image.image': ApiImageImage;
      'api::insight-vote.insight-vote': ApiInsightVoteInsightVote;
      'api::iron-insight.iron-insight': ApiIronInsightIronInsight;
      'api::lesson-comment.lesson-comment': ApiLessonCommentLessonComment;
      'api::lesson-progress.lesson-progress': ApiLessonProgressLessonProgress;
      'api::lesson.lesson': ApiLessonLesson;
      'api::living-commentary.living-commentary': ApiLivingCommentaryLivingCommentary;
      'api::margin-reflection.margin-reflection': ApiMarginReflectionMarginReflection;
      'api::media-item.media-item': ApiMediaItemMediaItem;
      'api::media-progress.media-progress': ApiMediaProgressMediaProgress;
      'api::module.module': ApiModuleModule;
      'api::outreach-campaign.outreach-campaign': ApiOutreachCampaignOutreachCampaign;
      'api::outreach-story.outreach-story': ApiOutreachStoryOutreachStory;
      'api::prayer.prayer': ApiPrayerPrayer;
      'api::presigned-upload.presigned-upload': ApiPresignedUploadPresignedUpload;
      'api::project.project': ApiProjectProject;
      'api::protocol-diagnostic.protocol-diagnostic': ApiProtocolDiagnosticProtocolDiagnostic;
      'api::protocol-phase.protocol-phase': ApiProtocolPhaseProtocolPhase;
      'api::reply.reply': ApiReplyReply;
      'api::resource-directory.resource-directory': ApiResourceDirectoryResourceDirectory;
      'api::resource.resource': ApiResourceResource;
      'api::scripture-alignment.scripture-alignment': ApiScriptureAlignmentScriptureAlignment;
      'api::scripture-book.scripture-book': ApiScriptureBookScriptureBook;
      'api::scripture-lemma.scripture-lemma': ApiScriptureLemmaScriptureLemma;
      'api::scripture-theme.scripture-theme': ApiScriptureThemeScriptureTheme;
      'api::scripture-token.scripture-token': ApiScriptureTokenScriptureToken;
      'api::scripture-verse.scripture-verse': ApiScriptureVerseScriptureVerse;
      'api::scripture-work.scripture-work': ApiScriptureWorkScriptureWork;
      'api::series.series': ApiSeriesSeries;
      'api::setting.setting': ApiSettingSetting;
      'api::speaker.speaker': ApiSpeakerSpeaker;
      'api::stat.stat': ApiStatStat;
      'api::tag.tag': ApiTagTag;
      'api::team-member.team-member': ApiTeamMemberTeamMember;
      'api::testimonial.testimonial': ApiTestimonialTestimonial;
      'api::testimony.testimony': ApiTestimonyTestimony;
      'api::trending-video.trending-video': ApiTrendingVideoTrendingVideo;
      'api::user-profile.user-profile': ApiUserProfileUserProfile;
      'api::video-hero.video-hero': ApiVideoHeroVideoHero;
      'api::video.video': ApiVideoVideo;
      'api::volunteer-signup.volunteer-signup': ApiVolunteerSignupVolunteerSignup;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
