-- Quick check to see if the database migration has been run
-- Copy and paste this into your Supabase SQL Editor to check the current status

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'crypto_transactions'
  AND column_name IN ('confirmations', 'credits_awarded', 'processed_at', 'gas_used')
ORDER BY column_name;

-- If this returns 4 rows, the migration has been run successfully
-- If this returns fewer rows, you need to run the URGENT-database-fix.sql migration 