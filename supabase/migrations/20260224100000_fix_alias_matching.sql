-- =============================================================================
-- Fix find_alias: prefix stripping + reversed FTS direction
-- =============================================================================
-- Problem: FTS checked to_tsvector(pattern) @@ plainto_tsquery(request)
-- which requires the pattern to contain ALL request words. Since patterns
-- are shorter than requests, this almost never matches.
--
-- Fix: 1) Strip common command prefixes and retry exact match
--      2) Reverse FTS: does request contain the pattern's keywords?
-- =============================================================================

CREATE OR REPLACE FUNCTION human_os.find_alias(
  p_request TEXT,
  p_layer TEXT DEFAULT 'public',
  p_context TEXT[] DEFAULT '{}'
) RETURNS TABLE (
  id UUID,
  pattern TEXT,
  description TEXT,
  mode human_os.execution_mode,
  tools_required TEXT[],
  actions JSONB,
  match_type TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cleaned TEXT;
BEGIN
  -- Stage 1: Exact pattern match (with {variable} → regex)
  RETURN QUERY
  SELECT
    a.id, a.pattern, a.description, a.mode, a.tools_required, a.actions,
    'exact'::TEXT as match_type
  FROM human_os.aliases a
  WHERE a.enabled = true
    AND (a.layer = 'public' OR a.layer = p_layer)
    AND (a.context = '{}' OR a.context && p_context)
    AND p_request ~* ('^' || regexp_replace(a.pattern, '\{[^}]+\}', '(.+)', 'g') || '$')
  ORDER BY a.priority, a.layer DESC
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Stage 1b: Strip common command prefixes and retry exact match
  v_cleaned := regexp_replace(
    p_request,
    '^\s*(show me|show|list all|list|give me|display|get me|get|find me|tell me about|tell me|what are|what''s my|what''s)\s+',
    '', 'i'
  );
  v_cleaned := trim(v_cleaned);

  IF v_cleaned <> p_request AND v_cleaned <> '' THEN
    RETURN QUERY
    SELECT
      a.id, a.pattern, a.description, a.mode, a.tools_required, a.actions,
      'exact_stripped'::TEXT as match_type
    FROM human_os.aliases a
    WHERE a.enabled = true
      AND (a.layer = 'public' OR a.layer = p_layer)
      AND (a.context = '{}' OR a.context && p_context)
      AND v_cleaned ~* ('^' || regexp_replace(a.pattern, '\{[^}]+\}', '(.+)', 'g') || '$')
    ORDER BY a.priority, a.layer DESC
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;
  END IF;

  -- Stage 2: Reversed FTS — does request contain the pattern's keywords?
  -- Strip {var} placeholders from pattern before generating tsquery
  RETURN QUERY
  SELECT
    a.id, a.pattern, a.description, a.mode, a.tools_required, a.actions,
    'fuzzy'::TEXT as match_type
  FROM human_os.aliases a
  WHERE a.enabled = true
    AND (a.layer = 'public' OR a.layer = p_layer)
    AND to_tsvector('english', p_request) @@ plainto_tsquery(
      'english',
      regexp_replace(a.pattern, '\{[^}]+\}', '', 'g')
    )
  ORDER BY
    ts_rank(
      to_tsvector('english', p_request),
      plainto_tsquery('english', regexp_replace(a.pattern, '\{[^}]+\}', '', 'g'))
    ) DESC,
    length(a.pattern) DESC,
    a.priority
  LIMIT 3;
END;
$$;
