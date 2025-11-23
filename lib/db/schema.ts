import { boolean, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
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

export const toolsTranslations = pgTable(
  'tools_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    toolId: uuid('tool_id')
      .notNull()
      .references(() => tools.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    type: text('type').notNull(),
  },
  (table) => ({
    localeConstraint: uniqueIndex('tools_translations_tool_id_locale_key').on(table.toolId, table.locale),
  }),
);

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

export const tests = pgTable('tests', {
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

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
