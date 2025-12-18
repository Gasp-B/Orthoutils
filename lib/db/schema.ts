import {
  boolean,
  customType,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  tsvector,
  uniqueIndex,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const auth = pgSchema('auth');
const tsvector = customType<{ data: string; driverData: string }>({
  dataType: () => 'tsvector',
});

export const validationStatusEnum = pgEnum('validation_status', ['draft', 'in_review', 'published', 'archived']);

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const validationStatusEnum = pgEnum('validation_status', ['draft', 'in_review', 'published', 'archived']);

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const validationStatusEnum = pgEnum('validation_status', ['draft', 'in_review', 'published', 'archived']);

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const authUsers = auth.table('users', {
  id: uuid('id').primaryKey(),
});

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    label: text('label').notNull(),
    colorLabel: text('color_label'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    labelConstraint: uniqueIndex('tags_label_key').on(table.label),
  }),
);

export const tagsTranslations = pgTable(
  'tags_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    label: text('label').notNull(),
    synonyms: text('synonyms').array().notNull().default(sql`'{}'::text[]`),
  },
  (table) => ({
    localeConstraint: uniqueIndex('tags_translations_tag_id_locale_key').on(table.tagId, table.locale),
  }),
);

export const tests = pgTable(
  'tests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ageMinMonths: integer('age_min_months'),
    ageMaxMonths: integer('age_max_months'),
    durationMinutes: integer('duration_minutes'),
    isStandardized: boolean('is_standardized').default(false),
    buyLink: text('buy_link'),
    bibliography: jsonb('bibliography')
      .notNull()
      .$type<Array<{ label: string; url: string }>>()
      .default(sql`'[]'::jsonb`),
    status: validationStatusEnum('status').notNull().default('draft'),
    ftsVector: tsvector('fts_vector'),
    validatedBy: uuid('validated_by').references(() => authUsers.id),
    validatedAt: timestamp('validated_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => authUsers.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ftsVector: tsvector('fts_vector'),
  },
);

export type TestRecord = typeof tests.$inferSelect;

export const testsTranslations = pgTable(
  'tests_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    testId: uuid('test_id')
      .notNull()
      .references(() => tests.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    shortDescription: text('short_description'),
    objective: text('objective'),
    population: text('population'),
    materials: text('materials'),
    publisher: text('publisher'),
    priceRange: text('price_range'),
    notes: text('notes'),
  },
  (table) => ({
    localeConstraint: uniqueIndex('tests_translations_test_id_locale_key').on(table.testId, table.locale),
    slugLocaleConstraint: uniqueIndex('tests_translations_slug_locale_key').on(table.slug, table.locale),
  }),
);

export const toolsCatalog = pgTable(
  'tools_catalog',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    colorLabel: text('color_label'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    description: text('description'),
    links: jsonb('links')
      .notNull()
      .$type<Array<{ label: string; url: string }>>()
      .default(sql`'[]'::jsonb`),
    notes: text('notes'),
    targetPopulation: text('target_population'),
    status: validationStatusEnum('status').notNull().default('draft'),
    ftsVector: tsvector('fts_vector'),
    validatedBy: uuid('validated_by').references(() => authUsers.id),
    validatedAt: timestamp('validated_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => authUsers.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    titleConstraint: uniqueIndex('tools_catalog_title_key').on(table.title),
  }),
);

export const toolsCatalogTranslations = pgTable(
  'tools_catalog_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    toolCatalogId: uuid('tool_catalog_id')
      .notNull()
      .references(() => toolsCatalog.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    description: text('description'),
    notes: text('notes'),
    targetPopulation: text('target_population'),
  },
  (table) => ({
    localeConstraint: uniqueIndex('tools_catalog_translations_tool_catalog_id_locale_key').on(
      table.toolCatalogId,
      table.locale,
    ),
  }),
);

export const domains = pgTable('domains', {
  id: uuid('id').defaultRandom().primaryKey(),
});

export const domainsTranslations = pgTable(
  'domains_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    domainId: uuid('domain_id')
      .notNull()
      .references(() => domains.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    label: text('label').notNull(),
    slug: text('slug').notNull(),
    synonyms: text('synonyms').array().notNull().default(sql`'{}'::text[]`),
  },
  (table) => ({
    localeConstraint: uniqueIndex('domains_translations_domain_id_locale_key').on(table.domainId, table.locale),
    slugLocaleConstraint: uniqueIndex('domains_translations_slug_locale_key').on(table.slug, table.locale),
  }),
);

export const testDomains = pgTable(
  'test_domains',
  {
    testId: uuid('test_id')
      .notNull()
      .references(() => tests.id, { onDelete: 'cascade' }),
    domainId: uuid('domain_id')
      .notNull()
      .references(() => domains.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.testId, table.domainId] }),
  }),
);

export const testTags = pgTable(
  'test_tags',
  {
    testId: uuid('test_id')
      .notNull()
      .references(() => tests.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.testId, table.tagId] }),
  }),
);

export const themes = pgTable(
  'themes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugConstraint: uniqueIndex('themes_slug_key').on(table.slug),
  }),
);

export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(),
  url: text('url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const resourceTypes = pgTable('resource_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const resourceTypesTranslations = pgTable(
  'resource_type_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resourceTypeId: uuid('resource_type_id')
      .notNull()
      .references(() => resourceTypes.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    label: text('label').notNull(),
  },
  (table) => ({
    localeConstraint: uniqueIndex('resource_type_translations_resource_type_id_locale_key').on(
      table.resourceTypeId,
      table.locale,
    ),
  }),
);

export const resourcesTranslations = pgTable(
  'resources_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    description: text('description'),
  },
  (table) => ({
    localeConstraint: uniqueIndex('resources_translations_resource_id_locale_key').on(
      table.resourceId,
      table.locale,
    ),
  }),
);

export const themeTranslations = pgTable(
  'theme_translations',
  {
    themeId: uuid('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    label: text('label').notNull(),
    description: text('description'),
    synonyms: text('synonyms').array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.themeId, table.locale] }),
  }),
);

export const testThemes = pgTable(
  'test_themes',
  {
    testId: uuid('test_id')
      .notNull()
      .references(() => tests.id, { onDelete: 'cascade' }),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.testId, table.themeId] }),
  }),
);

export const themeDomains = pgTable(
  'theme_domains',
  {
    themeId: uuid('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    domainId: uuid('domain_id')
      .notNull()
      .references(() => domains.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.themeId, table.domainId] }),
  }),
);

// ... existant imports

// Ajoutez ces définitions à la suite de vos tables resources / resourcesTranslations

export const resourceDomains = pgTable(
  'resource_domains',
  {
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    domainId: uuid('domain_id')
      .notNull()
      .references(() => domains.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.resourceId, table.domainId] }),
  }),
);

export const resourceTags = pgTable(
  'resource_tags',
  {
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.resourceId, table.tagId] }),
  }),
);

export const resourceThemes = pgTable(
  'resource_themes',
  {
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.resourceId, table.themeId] }),
  }),
);

// ... vous pouvez aussi exporter les types si besoin en bas du fichier
export type ResourceDomainRecord = typeof resourceDomains.$inferSelect;
export type ResourceTagRecord = typeof resourceTags.$inferSelect;
export type ResourceThemeRecord = typeof resourceThemes.$inferSelect;
export type ThemeRecord = typeof themes.$inferSelect;
export type ThemeTranslationRecord = typeof themeTranslations.$inferSelect;
export type TestThemeRecord = typeof testThemes.$inferSelect;
export type ThemeDomainRecord = typeof themeDomains.$inferSelect;
export type ResourceRecord = typeof resources.$inferSelect;
export type NewResourceRecord = typeof resources.$inferInsert;
export type ResourceTranslationRecord = typeof resourcesTranslations.$inferSelect;
export type NewResourceTranslationRecord = typeof resourcesTranslations.$inferInsert;
export type ToolsCatalogRecord = typeof toolsCatalog.$inferSelect;
export type NewToolsCatalogRecord = typeof toolsCatalog.$inferInsert;
export type ToolsCatalogTranslationRecord = typeof toolsCatalogTranslations.$inferSelect;
export type NewToolsCatalogTranslationRecord = typeof toolsCatalogTranslations.$inferInsert;
export type ValidationStatus = (typeof validationStatusEnum.enumValues)[number];
