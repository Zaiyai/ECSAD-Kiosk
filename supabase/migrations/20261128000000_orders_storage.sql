ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS device_token text,
  ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.orders
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.order_items
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS orders_device_token_created_at_idx
  ON public.orders (device_token, created_at DESC);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx
  ON public.order_items (order_id);

CREATE OR REPLACE FUNCTION public.create_panelist_orders(p_orders jsonb)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  order_data jsonb;
BEGIN
  IF jsonb_typeof(p_orders) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'p_orders must be a JSON array' USING ERRCODE = '22023';
  END IF;

  FOR order_data IN
    SELECT value FROM jsonb_array_elements(p_orders)
  LOOP
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
      order_data->>'panelist_name',
      order_data->>'device_token',
      order_data->>'meal',
      order_data->>'status',
      order_data->>'note',
      (order_data->>'created_at')::timestamptz,
      (order_data->>'updated_at')::timestamptz
    );

    IF jsonb_typeof(order_data->'items') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Each order must include an items array' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.order_items (order_id, category, item_name)
    SELECT
      (order_data->>'id')::uuid,
      item.value->>'category',
      item.value->>'item_name'
    FROM jsonb_array_elements(order_data->'items') AS item(value);
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_panelist_order_items(
  p_order_id uuid,
  p_device_token text,
  p_meal text,
  p_items jsonb
)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  current_order public.orders%ROWTYPE;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'p_items must be a JSON array' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO current_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;
  IF current_order.device_token IS DISTINCT FROM p_device_token THEN
    RETURN 'forbidden';
  END IF;
  IF current_order.status <> 'reviewing' THEN
    RETURN 'locked';
  END IF;
  IF current_order.meal <> p_meal THEN
    RETURN 'meal_mismatch';
  END IF;

  UPDATE public.orders
  SET updated_at = now()
  WHERE id = p_order_id;

  DELETE FROM public.order_items
  WHERE order_id = p_order_id;

  INSERT INTO public.order_items (order_id, category, item_name)
  SELECT
    p_order_id,
    item.value->>'category',
    item.value->>'item_name'
  FROM jsonb_array_elements(p_items) AS item(value);

  RETURN 'ok';
END;
$function$;

REVOKE ALL ON FUNCTION public.create_panelist_orders(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_panelist_orders(jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.update_panelist_order_items(uuid, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_panelist_order_items(uuid, text, text, jsonb)
  TO service_role;
