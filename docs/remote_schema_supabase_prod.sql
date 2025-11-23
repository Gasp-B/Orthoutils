


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."validation_status" AS ENUM (
    'draft',
    'in_review',
    'published',
    'archived'
);


ALTER TYPE "public"."validation_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_status"("target_status" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT public.has_moderation_access() OR target_status = 'published';
$$;


ALTER FUNCTION "public"."can_view_status"("target_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_status"("target_status" "public"."validation_status") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT public.has_moderation_access() OR target_status = 'published';
$$;


ALTER FUNCTION "public"."can_view_status"("target_status" "public"."validation_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_write_status_row"("new_status" "public"."validation_status", "new_validated_by" "uuid", "new_validated_at" timestamp with time zone) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    public.has_moderation_access()
    AND (
      (new_status = 'published' AND new_validated_by IS NOT NULL AND new_validated_at IS NOT NULL)
      OR (new_status <> 'published' AND new_validated_by IS NULL AND new_validated_at IS NULL)
    );
$$;


ALTER FUNCTION "public"."can_write_status_row"("new_status" "public"."validation_status", "new_validated_by" "uuid", "new_validated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_moderation_access"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT auth.role() = 'service_role' OR public.is_admin_or_editor();
$$;


ALTER FUNCTION "public"."has_moderation_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_editor"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '') IN ('admin', 'editor');
$$;


ALTER FUNCTION "public"."is_admin_or_editor"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_tests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_tests_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."domains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."domains_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "domain_id" "uuid" NOT NULL,
    "locale" "text" NOT NULL,
    "label" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."domains_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."section_subsections" (
    "section_id" "uuid" NOT NULL,
    "subsection_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."section_subsections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sections_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "locale" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."sections_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subsection_tags" (
    "subsection_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."subsection_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subsections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "format_label" "text",
    "color_label" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."subsections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subsections_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subsection_id" "uuid" NOT NULL,
    "locale" "text" NOT NULL,
    "label" "text" NOT NULL,
    "format_label" "text",
    "color_label" "text",
    "notes" "text"
);


ALTER TABLE "public"."subsections_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "color_label" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "locale" "text" NOT NULL,
    "label" "text" NOT NULL
);


ALTER TABLE "public"."tags_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_domains" (
    "test_id" "uuid" NOT NULL,
    "domain_id" "uuid" NOT NULL
);


ALTER TABLE "public"."test_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_tags" (
    "test_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."test_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "age_min_months" integer,
    "age_max_months" integer,
    "duration_minutes" integer,
    "is_standardized" boolean DEFAULT false,
    "buy_link" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "bibliography" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "public"."validation_status" DEFAULT 'draft'::"public"."validation_status" NOT NULL,
    "validated_by" "uuid",
    "validated_at" timestamp with time zone,
    "created_by" "uuid"
);


ALTER TABLE "public"."tests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tests_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "test_id" "uuid" NOT NULL,
    "locale" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "short_description" "text",
    "objective" "text",
    "population" "text",
    "materials" "text",
    "publisher" "text",
    "price_range" "text",
    "notes" "text"
);


ALTER TABLE "public"."tests_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "type" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "source" "text" NOT NULL,
    "status" "public"."validation_status" DEFAULT 'draft'::"public"."validation_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "validated_by" "uuid",
    "validated_at" timestamp with time zone
);


ALTER TABLE "public"."tools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tools_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "color_label" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "description" "text",
    "links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "notes" "text",
    "target_population" "text",
    "status" "public"."validation_status" DEFAULT 'draft'::"public"."validation_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "validated_by" "uuid",
    "validated_at" timestamp with time zone
);


ALTER TABLE "public"."tools_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tools_catalog_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tool_catalog_id" "uuid" NOT NULL,
    "locale" "text" NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "notes" "text",
    "target_population" "text"
);


ALTER TABLE "public"."tools_catalog_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tools_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tool_id" "uuid" NOT NULL,
    "locale" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "type" "text" NOT NULL
);


ALTER TABLE "public"."tools_translations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."domains"
    ADD CONSTRAINT "domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domains_translations"
    ADD CONSTRAINT "domains_translations_domain_id_locale_key" UNIQUE ("domain_id", "locale");



ALTER TABLE ONLY "public"."domains_translations"
    ADD CONSTRAINT "domains_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domains_translations"
    ADD CONSTRAINT "domains_translations_slug_locale_key" UNIQUE ("slug", "locale");



ALTER TABLE ONLY "public"."section_subsections"
    ADD CONSTRAINT "section_subsections_pkey" PRIMARY KEY ("section_id", "subsection_id");



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sections_translations"
    ADD CONSTRAINT "sections_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sections_translations"
    ADD CONSTRAINT "sections_translations_section_id_locale_key" UNIQUE ("section_id", "locale");



ALTER TABLE ONLY "public"."subsection_tags"
    ADD CONSTRAINT "subsection_tags_pkey" PRIMARY KEY ("subsection_id", "tag_id");



ALTER TABLE ONLY "public"."subsections"
    ADD CONSTRAINT "subsections_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."subsections"
    ADD CONSTRAINT "subsections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subsections_translations"
    ADD CONSTRAINT "subsections_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subsections_translations"
    ADD CONSTRAINT "subsections_translations_subsection_id_locale_key" UNIQUE ("subsection_id", "locale");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags_translations"
    ADD CONSTRAINT "tags_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags_translations"
    ADD CONSTRAINT "tags_translations_tag_id_locale_key" UNIQUE ("tag_id", "locale");



ALTER TABLE ONLY "public"."test_domains"
    ADD CONSTRAINT "test_domains_pkey" PRIMARY KEY ("test_id", "domain_id");



ALTER TABLE ONLY "public"."test_tags"
    ADD CONSTRAINT "test_tags_pkey" PRIMARY KEY ("test_id", "tag_id");



ALTER TABLE ONLY "public"."tests"
    ADD CONSTRAINT "tests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tests_translations"
    ADD CONSTRAINT "tests_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tests_translations"
    ADD CONSTRAINT "tests_translations_slug_locale_key" UNIQUE ("slug", "locale");



ALTER TABLE ONLY "public"."tests_translations"
    ADD CONSTRAINT "tests_translations_test_id_locale_key" UNIQUE ("test_id", "locale");



ALTER TABLE ONLY "public"."tools_catalog"
    ADD CONSTRAINT "tools_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tools_catalog"
    ADD CONSTRAINT "tools_catalog_title_key" UNIQUE ("title");



ALTER TABLE ONLY "public"."tools_catalog_translations"
    ADD CONSTRAINT "tools_catalog_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tools_catalog_translations"
    ADD CONSTRAINT "tools_catalog_translations_tool_catalog_id_locale_key" UNIQUE ("tool_catalog_id", "locale");



ALTER TABLE ONLY "public"."tools"
    ADD CONSTRAINT "tools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tools_translations"
    ADD CONSTRAINT "tools_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tools_translations"
    ADD CONSTRAINT "tools_translations_tool_id_locale_key" UNIQUE ("tool_id", "locale");



CREATE INDEX "idx_tools_catalog_created_at" ON "public"."tools_catalog" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_tools_created_at" ON "public"."tools" USING "btree" ("created_at" DESC);



CREATE OR REPLACE TRIGGER "set_tests_updated_at" BEFORE UPDATE ON "public"."tests" FOR EACH ROW EXECUTE FUNCTION "public"."set_tests_updated_at"();



ALTER TABLE ONLY "public"."domains_translations"
    ADD CONSTRAINT "domains_translations_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_subsections"
    ADD CONSTRAINT "section_subsections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_subsections"
    ADD CONSTRAINT "section_subsections_subsection_id_fkey" FOREIGN KEY ("subsection_id") REFERENCES "public"."subsections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sections_translations"
    ADD CONSTRAINT "sections_translations_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subsection_tags"
    ADD CONSTRAINT "subsection_tags_subsection_id_fkey" FOREIGN KEY ("subsection_id") REFERENCES "public"."subsections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subsections_translations"
    ADD CONSTRAINT "subsections_translations_subsection_id_fkey" FOREIGN KEY ("subsection_id") REFERENCES "public"."subsections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags_translations"
    ADD CONSTRAINT "tags_translations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_domains"
    ADD CONSTRAINT "test_domains_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_domains"
    ADD CONSTRAINT "test_domains_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_tags"
    ADD CONSTRAINT "test_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_tags"
    ADD CONSTRAINT "test_tags_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tests"
    ADD CONSTRAINT "tests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tests_translations"
    ADD CONSTRAINT "tests_translations_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tests"
    ADD CONSTRAINT "tests_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tools_catalog_translations"
    ADD CONSTRAINT "tools_catalog_translations_tool_catalog_id_fkey" FOREIGN KEY ("tool_catalog_id") REFERENCES "public"."tools_catalog"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tools_catalog"
    ADD CONSTRAINT "tools_catalog_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tools_translations"
    ADD CONSTRAINT "tools_translations_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tools"
    ADD CONSTRAINT "tools_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "auth"."users"("id");



ALTER TABLE "public"."domains" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "domains_manage_moderators" ON "public"."domains" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."has_moderation_access"());



CREATE POLICY "domains_select_moderators" ON "public"."domains" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "domains_select_published" ON "public"."domains" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."test_domains" "td"
     JOIN "public"."tests" "t" ON (("t"."id" = "td"."test_id")))
  WHERE (("td"."domain_id" = "domains"."id") AND ("t"."status" = 'published'::"public"."validation_status")))));



ALTER TABLE "public"."domains_translations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "domains_translations_manage_moderators" ON "public"."domains_translations" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."has_moderation_access"());



CREATE POLICY "domains_translations_select_moderators" ON "public"."domains_translations" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "domains_translations_select_published" ON "public"."domains_translations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."test_domains" "td"
     JOIN "public"."tests" "t" ON (("t"."id" = "td"."test_id")))
  WHERE (("td"."domain_id" = "domains_translations"."domain_id") AND ("t"."status" = 'published'::"public"."validation_status")))));



ALTER TABLE "public"."section_subsections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sections_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subsection_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subsections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subsections_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_manage_moderators" ON "public"."tags" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."has_moderation_access"());



CREATE POLICY "tags_select_moderators" ON "public"."tags" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "tags_select_published" ON "public"."tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."test_tags" "tt"
     JOIN "public"."tests" "t" ON (("t"."id" = "tt"."test_id")))
  WHERE (("tt"."tag_id" = "tags"."id") AND ("t"."status" = 'published'::"public"."validation_status")))));



ALTER TABLE "public"."tags_translations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_translations_manage_moderators" ON "public"."tags_translations" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."has_moderation_access"());



CREATE POLICY "tags_translations_select_moderators" ON "public"."tags_translations" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "tags_translations_select_published" ON "public"."tags_translations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."test_tags" "tt"
     JOIN "public"."tests" "t" ON (("t"."id" = "tt"."test_id")))
  WHERE (("tt"."tag_id" = "tags_translations"."tag_id") AND ("t"."status" = 'published'::"public"."validation_status")))));



ALTER TABLE "public"."test_domains" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "test_domains_manage_moderators" ON "public"."test_domains" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."has_moderation_access"());



CREATE POLICY "test_domains_select_moderators" ON "public"."test_domains" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "test_domains_select_published" ON "public"."test_domains" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tests" "t"
  WHERE (("t"."id" = "test_domains"."test_id") AND ("t"."status" = 'published'::"public"."validation_status")))));



ALTER TABLE "public"."test_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "test_tags_manage_moderators" ON "public"."test_tags" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."has_moderation_access"());



CREATE POLICY "test_tags_select_moderators" ON "public"."test_tags" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "test_tags_select_published" ON "public"."test_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tests" "t"
  WHERE (("t"."id" = "test_tags"."test_id") AND ("t"."status" = 'published'::"public"."validation_status")))));



ALTER TABLE "public"."tests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tests_manage_moderators" ON "public"."tests" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."can_write_status_row"("status", "validated_by", "validated_at"));



CREATE POLICY "tests_select_moderators" ON "public"."tests" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "tests_select_published" ON "public"."tests" FOR SELECT USING (("status" = 'published'::"public"."validation_status"));



ALTER TABLE "public"."tests_translations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tests_translations_manage_moderators" ON "public"."tests_translations" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."has_moderation_access"());



CREATE POLICY "tests_translations_select_moderators" ON "public"."tests_translations" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "tests_translations_select_published" ON "public"."tests_translations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tests" "t"
  WHERE (("t"."id" = "tests_translations"."test_id") AND ("t"."status" = 'published'::"public"."validation_status")))));



ALTER TABLE "public"."tools" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tools_catalog" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tools_catalog_manage_moderators" ON "public"."tools_catalog" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."can_write_status_row"("status", "validated_by", "validated_at"));



CREATE POLICY "tools_catalog_select_moderators" ON "public"."tools_catalog" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "tools_catalog_select_published" ON "public"."tools_catalog" FOR SELECT USING (("status" = 'published'::"public"."validation_status"));



ALTER TABLE "public"."tools_catalog_translations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tools_catalog_translations_manage_moderators" ON "public"."tools_catalog_translations" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."has_moderation_access"());



CREATE POLICY "tools_catalog_translations_select_moderators" ON "public"."tools_catalog_translations" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "tools_catalog_translations_select_published" ON "public"."tools_catalog_translations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tools_catalog" "tc"
  WHERE (("tc"."id" = "tools_catalog_translations"."tool_catalog_id") AND ("tc"."status" = 'published'::"public"."validation_status")))));



CREATE POLICY "tools_manage_moderators" ON "public"."tools" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."can_write_status_row"("status", "validated_by", "validated_at"));



CREATE POLICY "tools_select_moderators" ON "public"."tools" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "tools_select_published" ON "public"."tools" FOR SELECT USING (("status" = 'published'::"public"."validation_status"));



ALTER TABLE "public"."tools_translations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tools_translations_manage_moderators" ON "public"."tools_translations" USING ("public"."has_moderation_access"()) WITH CHECK ("public"."has_moderation_access"());



CREATE POLICY "tools_translations_select_moderators" ON "public"."tools_translations" FOR SELECT USING ("public"."has_moderation_access"());



CREATE POLICY "tools_translations_select_published" ON "public"."tools_translations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tools" "t"
  WHERE (("t"."id" = "tools_translations"."tool_id") AND ("t"."status" = 'published'::"public"."validation_status")))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_status"("target_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_status"("target_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_status"("target_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_status"("target_status" "public"."validation_status") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_status"("target_status" "public"."validation_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_status"("target_status" "public"."validation_status") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_write_status_row"("new_status" "public"."validation_status", "new_validated_by" "uuid", "new_validated_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."can_write_status_row"("new_status" "public"."validation_status", "new_validated_by" "uuid", "new_validated_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_write_status_row"("new_status" "public"."validation_status", "new_validated_by" "uuid", "new_validated_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."has_moderation_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."has_moderation_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_moderation_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_editor"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_editor"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_editor"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_tests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_tests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_tests_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."domains" TO "anon";
GRANT ALL ON TABLE "public"."domains" TO "authenticated";
GRANT ALL ON TABLE "public"."domains" TO "service_role";



GRANT ALL ON TABLE "public"."domains_translations" TO "anon";
GRANT ALL ON TABLE "public"."domains_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."domains_translations" TO "service_role";



GRANT ALL ON TABLE "public"."section_subsections" TO "anon";
GRANT ALL ON TABLE "public"."section_subsections" TO "authenticated";
GRANT ALL ON TABLE "public"."section_subsections" TO "service_role";



GRANT ALL ON TABLE "public"."sections" TO "anon";
GRANT ALL ON TABLE "public"."sections" TO "authenticated";
GRANT ALL ON TABLE "public"."sections" TO "service_role";



GRANT ALL ON TABLE "public"."sections_translations" TO "anon";
GRANT ALL ON TABLE "public"."sections_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."sections_translations" TO "service_role";



GRANT ALL ON TABLE "public"."subsection_tags" TO "anon";
GRANT ALL ON TABLE "public"."subsection_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."subsection_tags" TO "service_role";



GRANT ALL ON TABLE "public"."subsections" TO "anon";
GRANT ALL ON TABLE "public"."subsections" TO "authenticated";
GRANT ALL ON TABLE "public"."subsections" TO "service_role";



GRANT ALL ON TABLE "public"."subsections_translations" TO "anon";
GRANT ALL ON TABLE "public"."subsections_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."subsections_translations" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."tags_translations" TO "anon";
GRANT ALL ON TABLE "public"."tags_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."tags_translations" TO "service_role";



GRANT ALL ON TABLE "public"."test_domains" TO "anon";
GRANT ALL ON TABLE "public"."test_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."test_domains" TO "service_role";



GRANT ALL ON TABLE "public"."test_tags" TO "anon";
GRANT ALL ON TABLE "public"."test_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."test_tags" TO "service_role";



GRANT ALL ON TABLE "public"."tests" TO "anon";
GRANT ALL ON TABLE "public"."tests" TO "authenticated";
GRANT ALL ON TABLE "public"."tests" TO "service_role";



GRANT ALL ON TABLE "public"."tests_translations" TO "anon";
GRANT ALL ON TABLE "public"."tests_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."tests_translations" TO "service_role";



GRANT ALL ON TABLE "public"."tools" TO "anon";
GRANT ALL ON TABLE "public"."tools" TO "authenticated";
GRANT ALL ON TABLE "public"."tools" TO "service_role";



GRANT ALL ON TABLE "public"."tools_catalog" TO "anon";
GRANT ALL ON TABLE "public"."tools_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."tools_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."tools_catalog_translations" TO "anon";
GRANT ALL ON TABLE "public"."tools_catalog_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."tools_catalog_translations" TO "service_role";



GRANT ALL ON TABLE "public"."tools_translations" TO "anon";
GRANT ALL ON TABLE "public"."tools_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."tools_translations" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







