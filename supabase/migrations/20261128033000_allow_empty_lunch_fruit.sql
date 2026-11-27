CREATE OR REPLACE FUNCTION public.create_panelist_orders(p_orders jsonb)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  order_data jsonb;
  food_count integer;
  coffee_count integer;
  fruit_count integer;
  rice_count integer;
  drink_count integer;
BEGIN
  IF jsonb_typeof(p_orders) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'p_orders must be a JSON array' USING ERRCODE = '22023';
  END IF;

  FOR order_data IN
    SELECT value FROM jsonb_array_elements(p_orders)
  LOOP
    IF COALESCE(order_data->>'meal', '') NOT IN ('breakfast', 'lunch') THEN
      RAISE EXCEPTION 'Each order must specify a supported meal' USING ERRCODE = '22023';
    END IF;
    IF COALESCE(btrim(order_data->>'panelist_name'), '') = ''
      OR COALESCE(btrim(order_data->>'device_token'), '') = '' THEN
      RAISE EXCEPTION 'Each order must include a panelist name and device token' USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(order_data->'items') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Each order must include an items array' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(order_data->'items') AS item(value)
      WHERE COALESCE(btrim(item.value->>'item_name'), '') = ''
        OR (
          order_data->>'meal' = 'breakfast'
          AND COALESCE(item.value->>'category', '') NOT IN ('food', 'coffee', 'drink')
        )
        OR (
          order_data->>'meal' = 'lunch'
          AND COALESCE(item.value->>'category', '') NOT IN ('food', 'fruit', 'rice', 'drink')
        )
    ) THEN
      RAISE EXCEPTION 'Order items do not match the selected meal' USING ERRCODE = '22023';
    END IF;

    SELECT
      count(*) FILTER (WHERE item.value->>'category' = 'food'),
      count(*) FILTER (WHERE item.value->>'category' = 'coffee'),
      count(*) FILTER (WHERE item.value->>'category' = 'fruit'),
      count(*) FILTER (WHERE item.value->>'category' = 'rice'),
      count(*) FILTER (WHERE item.value->>'category' = 'drink')
    INTO food_count, coffee_count, fruit_count, rice_count, drink_count
    FROM jsonb_array_elements(order_data->'items') AS item(value);

    IF food_count < 1 OR drink_count <> 1
      OR (
        order_data->>'meal' = 'breakfast'
        AND (coffee_count <> 1 OR fruit_count <> 0 OR rice_count <> 0)
      )
      OR (
        order_data->>'meal' = 'lunch'
        AND (rice_count <> 1 OR coffee_count <> 0)
      ) THEN
      RAISE EXCEPTION 'Order selections are incomplete' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.orders (
      id,
      panelist_name,
      device_token,
      meal,
      status,
      note,
      created_at,
      updated_at
    )
    VALUES (
      (order_data->>'id')::uuid,
      btrim(order_data->>'panelist_name'),
      btrim(order_data->>'device_token'),
      order_data->>'meal',
      'reviewing',
      order_data->>'note',
      (order_data->>'created_at')::timestamptz,
      (order_data->>'updated_at')::timestamptz
    );

    INSERT INTO public.order_items (order_id, category, item_name)
    SELECT
      (order_data->>'id')::uuid,
      item.value->>'category',
      btrim(item.value->>'item_name')
    FROM jsonb_array_elements(order_data->'items') AS item(value);
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_panelist_orders(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_panelist_orders(jsonb)
  TO anon, service_role;
