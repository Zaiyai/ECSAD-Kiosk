DO $migration$
DECLARE
  unsupported_statuses text[];
BEGIN
  SELECT array_agg(DISTINCT COALESCE(status, '<NULL>') ORDER BY COALESCE(status, '<NULL>'))
  INTO unsupported_statuses
  FROM public.orders
  WHERE status IS NULL
     OR status NOT IN ('reviewing', 'preparing', 'served', 'voided');

  IF unsupported_statuses IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot update orders_status_check; unsupported existing statuses: %',
      array_to_string(unsupported_statuses, ', ');
  END IF;
END;
$migration$;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('reviewing', 'preparing', 'served', 'voided'));

ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'reviewing';
