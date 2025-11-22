import { boolean, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const toolsCatalog = pgTable('tools_catalog', {
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
  status: text('status').notNull().default('Validé'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ToolRecord = typeof toolsCatalog.$inferSelect;

export const tools = pgTable('tools', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  type: text('type').notNull(),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  source: text('source').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sections = pgTable('sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subsections = pgTable('subsections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  formatLabel: text('format_label'),
  colorLabel: text('color_label'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

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
  label: text('label').notNull().unique(),
  colorLabel: text('color_label'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

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

export const tests = pgTable('tests', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  shortDescription: text('short_description'),
  objective: text('objective'),
  ageMinMonths: integer('age_min_months'),
  ageMaxMonths: integer('age_max_months'),
  population: text('population'),
  durationMinutes: integer('duration_minutes'),
  materials: text('materials'),
  isStandardized: boolean('is_standardized').default(false),
  publisher: text('publisher'),
  priceRange: text('price_range'),
  buyLink: text('buy_link'),
  notes: text('notes'),
  bibliography: jsonb('bibliography')
    .notNull()
    .$type<Array<{ label: string; url: string }>>()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TestRecord = typeof tests.$inferSelect;

export const domains = pgTable('domains', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: text('label').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

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

export const pathologies = pgTable('pathologies', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PathologyRecord = typeof pathologies.$inferSelect;

export const pathologyTranslations = pgTable(
  'pathology_translations',
  {
    pathologyId: uuid('pathology_id')
      .notNull()
      .references(() => pathologies.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    label: text('label').notNull(),
    description: text('description'),
    synonyms: text('synonyms')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.pathologyId, table.locale] }),
  }),
);

export type PathologyTranslationRecord = typeof pathologyTranslations.$inferSelect;

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
