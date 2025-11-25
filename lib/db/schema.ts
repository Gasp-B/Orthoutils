import {
  boolean,
  check,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const auth = pgSchema('auth');

export const authUsers = auth.table('users', {
  id: uuid('id').primaryKey(),
});

export const sections = pgTable('sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sectionsTranslations = pgTable(
  'sections_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    label: text('label').notNull(),
    description: text('description'),
  },
  (table) => ({
    localeConstraint: uniqueIndex('sections_translations_section_id_locale_key').on(table.sectionId, table.locale),
  }),
);

export const subsections = pgTable('subsections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  formatLabel: text('format_label'),
  colorLabel: text('color_label'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subsectionsTranslations = pgTable(
  'subsections_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subsectionId: uuid('subsection_id')
      .notNull()
      .references(() => subsections.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    label: text('label').notNull(),
    formatLabel: text('format_label'),
    colorLabel: text('color_label'),
    notes: text('notes'),
  },
  (table) => ({
    localeConstraint: uniqueIndex('subsections_translations_subsection_id_locale_key').on(
      table.subsectionId,
      table.locale,
    ),
  }),
);

export const sectionSubsections = pgTable(
  'section_subsections',
  {
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    subsectionId: uuid('subsection_id')
      .notNull()
      .references(() => subsections.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sectionId, table.subsectionId] }),
  }),
);

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  colorLabel: text('color_label'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tagsTranslations = pgTable(
  'tags_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    label: text('label').notNull(),
  },
  (table) => ({
    localeConstraint: uniqueIndex('tags_translations_tag_id_locale_key').on(table.tagId, table.locale),
  }),
);

export const subsectionTags = pgTable(
  'subsection_tags',
  {
    subsectionId: uuid('subsection_id')
      .notNull()
      .references(() => subsections.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.subsectionId, table.tagId] }),
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
    status: text('status').notNull().default('draft'),
    validatedBy: uuid('validated_by').references(() => authUsers.id),
    validatedAt: timestamp('validated_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => authUsers.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusCheck: check('tests_status_check', sql`${table.status} in ('draft','in_review','published','archived')`),
  }),
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

export const pathologies = pgTable(
  'pathologies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugConstraint: uniqueIndex('pathologies_slug_key').on(table.slug),
  }),
);

export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const resourcesTranslations = pgTable(
  'resources_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    description: text('description'),
  },
  (table) => ({
    localeConstraint: uniqueIndex('resources_translations_resource_id_locale_key').on(
      table.resourceId,
      table.locale,
    ),
  }),
);

export const pathologyTranslations = pgTable(
  'pathology_translations',
  {
    pathologyId: uuid('pathology_id')
      .notNull()
      .references(() => pathologies.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    label: text('label').notNull(),
    description: text('description'),
    synonyms: text('synonyms').array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.pathologyId, table.locale] }),
  }),
);

export const testPathologies = pgTable(
  'test_pathologies',
  {
    testId: uuid('test_id')
      .notNull()
      .references(() => tests.id, { onDelete: 'cascade' }),
    pathologyId: uuid('pathology_id')
      .notNull()
      .references(() => pathologies.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.testId, table.pathologyId] }),
  }),
);

export type PathologyRecord = typeof pathologies.$inferSelect;
export type PathologyTranslationRecord = typeof pathologyTranslations.$inferSelect;
export type TestPathologyRecord = typeof testPathologies.$inferSelect;
export type ResourceRecord = typeof resources.$inferSelect;
export type NewResourceRecord = typeof resources.$inferInsert;
export type ResourceTranslationRecord = typeof resourcesTranslations.$inferSelect;
export type NewResourceTranslationRecord = typeof resourcesTranslations.$inferInsert;
