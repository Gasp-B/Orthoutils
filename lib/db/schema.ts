import { jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
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
  name: text('name').notNull(),
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
