-- Guard only automated publications. Existing stories keep their URLs and edits.
BEGIN;
CREATE SCHEMA IF NOT EXISTS ovc_internal;
CREATE TABLE IF NOT EXISTS ovc_internal.recent_headlines (
  title_key text PRIMARY KEY,
  post_id uuid NOT NULL,
  accepted_at timestamptz NOT NULL
);
REVOKE ALL ON ovc_internal.recent_headlines FROM PUBLIC;

CREATE OR REPLACE FUNCTION ovc_internal.guard_headline()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  normalized text;
  accepted uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM 'publicado'
     OR NEW.publish_method IS NULL
     OR NEW.publish_method NOT IN ('portal', 'esportes_radar', 'brasilon',
       'jovempan_politica', 'internacional', 'economia_mercado', 'fofocas') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'publicado' THEN
    RETURN NEW;
  END IF;
  normalized := lower(trim(regexp_replace(NEW.titulo, '[[:space:]]+', ' ', 'g')));
  IF normalized IS NULL OR normalized = '' THEN RETURN NEW; END IF;

  INSERT INTO ovc_internal.recent_headlines AS prior (title_key, post_id, accepted_at)
  VALUES (md5(normalized), NEW.id, clock_timestamp())
  ON CONFLICT (title_key) DO UPDATE SET post_id = excluded.post_id,
    accepted_at = excluded.accepted_at
  WHERE prior.post_id = excluded.post_id
     OR prior.accepted_at <= excluded.accepted_at - interval '10 minutes'
  RETURNING post_id INTO accepted;
  IF accepted IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'Manchete automática já publicada nos últimos 10 minutos';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION ovc_internal.guard_headline() FROM PUBLIC;
DROP TRIGGER IF EXISTS ovc_guard_headline ON public.posts;
CREATE TRIGGER ovc_guard_headline BEFORE INSERT OR UPDATE OF status ON public.posts
  FOR EACH ROW EXECUTE FUNCTION ovc_internal.guard_headline();
COMMIT;
