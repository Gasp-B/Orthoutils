-- Rename taxonomy from pathologies to themes

-- Tables
ALTER TABLE IF EXISTS pathologies RENAME TO themes;
ALTER TABLE IF EXISTS pathology_translations RENAME TO theme_translations;
ALTER TABLE IF EXISTS test_pathologies RENAME TO test_themes;
ALTER TABLE IF EXISTS resource_pathologies RENAME TO resource_themes;

-- Columns
ALTER TABLE IF EXISTS theme_translations RENAME COLUMN pathology_id TO theme_id;
ALTER TABLE IF EXISTS test_themes RENAME COLUMN pathology_id TO theme_id;
ALTER TABLE IF EXISTS resource_themes RENAME COLUMN pathology_id TO theme_id;

-- Primary keys and indexes
ALTER TABLE IF EXISTS themes RENAME CONSTRAINT pathologies_pkey TO themes_pkey;
ALTER INDEX IF EXISTS pathologies_slug_key RENAME TO themes_slug_key;
ALTER TABLE IF EXISTS theme_translations RENAME CONSTRAINT pathology_translations_pkey TO theme_translations_pkey;
ALTER TABLE IF EXISTS test_themes RENAME CONSTRAINT test_pathologies_pkey TO test_themes_pkey;
ALTER TABLE IF EXISTS resource_themes RENAME CONSTRAINT resource_pathologies_pkey TO resource_themes_pkey;

-- Foreign keys
ALTER TABLE IF EXISTS theme_translations RENAME CONSTRAINT pathology_translations_pathology_id_fkey TO theme_translations_theme_id_fkey;
ALTER TABLE IF EXISTS test_themes RENAME CONSTRAINT test_pathologies_pathology_id_fkey TO test_themes_theme_id_fkey;
ALTER TABLE IF EXISTS test_themes RENAME CONSTRAINT test_pathologies_test_id_fkey TO test_themes_test_id_fkey;
ALTER TABLE IF EXISTS resource_themes RENAME CONSTRAINT resource_pathologies_pathology_id_fkey TO resource_themes_theme_id_fkey;
ALTER TABLE IF EXISTS resource_themes RENAME CONSTRAINT resource_pathologies_resource_id_fkey TO resource_themes_resource_id_fkey;

-- Policies
ALTER POLICY "Public read pathologies" ON themes RENAME TO "Public read themes";
ALTER POLICY "Authenticated modify pathologies" ON themes RENAME TO "Authenticated modify themes";
ALTER POLICY "Public read pathology_translations" ON theme_translations RENAME TO "Public read theme_translations";
ALTER POLICY "Authenticated modify pathology_translations" ON theme_translations RENAME TO "Authenticated modify theme_translations";
ALTER POLICY "Public read test_pathologies" ON test_themes RENAME TO "Public read test_themes";
ALTER POLICY "Authenticated modify test_pathologies" ON test_themes RENAME TO "Authenticated modify test_themes";
ALTER POLICY resource_pathologies_public_select ON resource_themes RENAME TO resource_themes_public_select;
ALTER POLICY resource_pathologies_service_write ON resource_themes RENAME TO resource_themes_service_write;
