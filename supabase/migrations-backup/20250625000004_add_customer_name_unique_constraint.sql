-- Add unique constraint to customer names to ensure slug uniqueness
-- This prevents duplicate customer names that would create conflicting URL slugs

-- First, check if there are any duplicate names that need to be resolved
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count duplicate customer names
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT name, COUNT(*) as count
        FROM customers
        GROUP BY name
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- If duplicates exist, raise an error with helpful information
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Cannot add unique constraint: % duplicate customer names found. Please resolve duplicate names before applying this migration.', duplicate_count;
    END IF;
END $$;

-- Add the unique constraint
ALTER TABLE customers 
ADD CONSTRAINT customers_name_unique UNIQUE (name);

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT customers_name_unique ON customers IS 
'Ensures customer names are unique to prevent URL slug conflicts in routing';
