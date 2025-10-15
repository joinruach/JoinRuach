import type { Schema, Struct } from '@strapi/strapi';

export interface ApiSeriesSeries extends Struct.CollectionTypeSchema {
  collectionName: 'series';
  info: {
    singularName: 'series';
    pluralName: 'series';
    displayName: 'Series';
    description: 'Organize related media items into thematic collections.';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    title: Schema.Attribute.String & Schema.Attribute.Required;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    description: Schema.Attribute.RichText;
    coverImage: Schema.Attribute.Media<'images'>;
    mediaItems: Schema.Attribute.Relation<'oneToMany', 'api::media-item.media-item'>;
    createdAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'api::series.series': ApiSeriesSeries;
    }
  }
}
