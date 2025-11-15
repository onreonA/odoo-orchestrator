-- Sprint 9: Template Analytics Database Function
-- Migration: 20251115000006_template_analytics_function.sql
-- Description: Creates function to update template analytics automatically

-- Function to update template analytics
CREATE OR REPLACE FUNCTION update_template_analytics(p_template_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_date DATE := CURRENT_DATE;
  v_usage_count INTEGER := 0;
  v_success_count INTEGER := 0;
  v_failure_count INTEGER := 0;
  v_avg_rating DECIMAL(3, 2) := NULL;
  v_avg_deployment_time INTEGER := NULL;
  v_total_feedback INTEGER := 0;
  v_positive_feedback INTEGER := 0;
  v_negative_feedback INTEGER := 0;
BEGIN
  -- Count deployments for today
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status = 'success')::INTEGER,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER,
    AVG(duration_seconds)::INTEGER
  INTO 
    v_usage_count,
    v_success_count,
    v_failure_count,
    v_avg_deployment_time
  FROM template_deployments
  WHERE template_id = p_template_id
    AND DATE(created_at) = v_date;

  -- Count feedback for today
  SELECT 
    COUNT(*)::INTEGER,
    AVG(rating),
    COUNT(*) FILTER (WHERE sentiment = 'positive')::INTEGER,
    COUNT(*) FILTER (WHERE sentiment = 'negative')::INTEGER
  INTO 
    v_total_feedback,
    v_avg_rating,
    v_positive_feedback,
    v_negative_feedback
  FROM template_feedback
  WHERE template_id = p_template_id
    AND DATE(created_at) = v_date;

  -- Insert or update analytics record
  INSERT INTO template_analytics (
    template_id,
    date,
    usage_count,
    success_count,
    failure_count,
    avg_rating,
    avg_deployment_time_seconds,
    total_feedback_count,
    positive_feedback_count,
    negative_feedback_count
  )
  VALUES (
    p_template_id,
    v_date,
    v_usage_count,
    v_success_count,
    v_failure_count,
    v_avg_rating,
    v_avg_deployment_time,
    v_total_feedback,
    v_positive_feedback,
    v_negative_feedback
  )
  ON CONFLICT (template_id, date)
  DO UPDATE SET
    usage_count = EXCLUDED.usage_count,
    success_count = EXCLUDED.success_count,
    failure_count = EXCLUDED.failure_count,
    avg_rating = EXCLUDED.avg_rating,
    avg_deployment_time_seconds = EXCLUDED.avg_deployment_time_seconds,
    total_feedback_count = EXCLUDED.total_feedback_count,
    positive_feedback_count = EXCLUDED.positive_feedback_count,
    negative_feedback_count = EXCLUDED.negative_feedback_count,
    updated_at = NOW();
END;
$$;

-- Function to aggregate analytics for a date range
CREATE OR REPLACE FUNCTION aggregate_template_analytics(
  p_template_id TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_usage INTEGER,
  total_success INTEGER,
  total_failure INTEGER,
  avg_rating DECIMAL(3, 2),
  avg_deployment_time INTEGER,
  total_feedback INTEGER,
  positive_feedback INTEGER,
  negative_feedback INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(usage_count), 0)::INTEGER,
    COALESCE(SUM(success_count), 0)::INTEGER,
    COALESCE(SUM(failure_count), 0)::INTEGER,
    AVG(avg_rating),
    AVG(avg_deployment_time_seconds)::INTEGER,
    COALESCE(SUM(total_feedback_count), 0)::INTEGER,
    COALESCE(SUM(positive_feedback_count), 0)::INTEGER,
    COALESCE(SUM(negative_feedback_count), 0)::INTEGER
  FROM template_analytics
  WHERE template_id = p_template_id
    AND date BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Trigger to automatically update analytics when feedback is created
CREATE OR REPLACE FUNCTION trigger_update_template_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM update_template_analytics(NEW.template_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_feedback_analytics_update
  AFTER INSERT OR UPDATE ON template_feedback
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_template_analytics();

-- Trigger to automatically update analytics when deployment is created/updated
CREATE OR REPLACE FUNCTION trigger_update_deployment_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM update_template_analytics(NEW.template_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deployment_analytics_update
  AFTER INSERT OR UPDATE ON template_deployments
  FOR EACH ROW
  WHEN (NEW.template_id IS NOT NULL)
  EXECUTE FUNCTION trigger_update_deployment_analytics();

-- Comments
COMMENT ON FUNCTION update_template_analytics IS 'Updates template analytics for a specific template and date';
COMMENT ON FUNCTION aggregate_template_analytics IS 'Aggregates template analytics for a date range';
COMMENT ON FUNCTION trigger_update_template_analytics IS 'Trigger function to update analytics when feedback is created/updated';
COMMENT ON FUNCTION trigger_update_deployment_analytics IS 'Trigger function to update analytics when deployment is created/updated';



