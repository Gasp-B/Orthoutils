


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
    "bibliography" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
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



ALTER TABLE ONLY "public"."subsection_tags"
    ADD CONSTRAINT "subsection_tags_pkey" PRIMARY KEY ("subsection_id", "tag_id");



ALTER TABLE ONLY "public"."subsections"
    ADD CONSTRAINT "subsections_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."subsections"
    ADD CONSTRAINT "subsections_pkey" PRIMARY KEY ("id");



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



CREATE OR REPLACE TRIGGER "set_tests_updated_at" BEFORE UPDATE ON "public"."tests" FOR EACH ROW EXECUTE FUNCTION "public"."set_tests_updated_at"();



ALTER TABLE ONLY "public"."domains_translations"
    ADD CONSTRAINT "domains_translations_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_subsections"
    ADD CONSTRAINT "section_subsections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_subsections"
    ADD CONSTRAINT "section_subsections_subsection_id_fkey" FOREIGN KEY ("subsection_id") REFERENCES "public"."subsections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subsection_tags"
    ADD CONSTRAINT "subsection_tags_subsection_id_fkey" FOREIGN KEY ("subsection_id") REFERENCES "public"."subsections"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."tests_translations"
    ADD CONSTRAINT "tests_translations_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE CASCADE;



CREATE POLICY "authenticated_modify_domains" ON "public"."domains" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_modify_tags" ON "public"."tags" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_modify_test_domains" ON "public"."test_domains" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_modify_test_tags" ON "public"."test_tags" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_modify_tests" ON "public"."tests" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_select_domains" ON "public"."domains" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_tags" ON "public"."tags" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_test_domains" ON "public"."test_domains" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_test_tags" ON "public"."test_tags" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_tests" ON "public"."tests" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."domains_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."section_subsections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subsection_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subsections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tests_translations" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



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



GRANT ALL ON TABLE "public"."subsection_tags" TO "anon";
GRANT ALL ON TABLE "public"."subsection_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."subsection_tags" TO "service_role";



GRANT ALL ON TABLE "public"."subsections" TO "anon";
GRANT ALL ON TABLE "public"."subsections" TO "authenticated";
GRANT ALL ON TABLE "public"."subsections" TO "service_role";



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







