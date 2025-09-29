-- Data migration: Move existing contact data from old structure to new contacts table
-- This migration handles the transition from primary_contact_name/email to primary_contact_id

-- 1. Create contacts for existing customers that have primary_contact_name and primary_contact_email
INSERT INTO mvp.contacts (id, first_name, last_name, email, phone, title, company_id, is_primary, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    CASE 
        WHEN primary_contact_name ~ '^[A-Za-z]+ [A-Za-z]+$' THEN 
            split_part(primary_contact_name, ' ', 1)
        ELSE 
            primary_contact_name
    END as first_name,
    CASE 
        WHEN primary_contact_name ~ '^[A-Za-z]+ [A-Za-z]+$' THEN 
            split_part(primary_contact_name, ' ', 2)
        ELSE 
            ''
    END as last_name,
    COALESCE(primary_contact_email, '') as email,
    NULL as phone,
    'Primary Contact' as title,
    id as company_id,
    true as is_primary,
    NOW() as created_at,
    NOW() as updated_at
FROM mvp.customers 
WHERE (primary_contact_name IS NOT NULL AND primary_contact_name != '')
   OR (primary_contact_email IS NOT NULL AND primary_contact_email != '');

-- 2. Update customers with the new primary_contact_id
UPDATE mvp.customers 
SET primary_contact_id = c.id
FROM mvp.contacts c
WHERE c.company_id = mvp.customers.id 
  AND c.is_primary = true
  AND mvp.customers.primary_contact_id IS NULL;

-- 3. Also handle public schema if it exists
DO $$
BEGIN
    -- Check if public.customers table exists and has the old columns
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'customers'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'customers' 
        AND column_name IN ('primary_contact_name', 'primary_contact_email')
    ) THEN
        
        -- Create contacts for existing public customers
        INSERT INTO public.contacts (id, first_name, last_name, email, phone, title, customer_id, is_primary, created_at, updated_at)
        SELECT 
            gen_random_uuid() as id,
            CASE 
                WHEN primary_contact_name ~ '^[A-Za-z]+ [A-Za-z]+$' THEN 
                    split_part(primary_contact_name, ' ', 1)
                ELSE 
                    primary_contact_name
            END as first_name,
            CASE 
                WHEN primary_contact_name ~ '^[A-Za-z]+ [A-Za-z]+$' THEN 
                    split_part(primary_contact_name, ' ', 2)
                ELSE 
                    ''
            END as last_name,
            COALESCE(primary_contact_email, '') as email,
            NULL as phone,
            'Primary Contact' as title,
            id as customer_id,
            true as is_primary,
            NOW() as created_at,
            NOW() as updated_at
        FROM public.customers 
        WHERE (primary_contact_name IS NOT NULL AND primary_contact_name != '')
           OR (primary_contact_email IS NOT NULL AND primary_contact_email != '');

        -- Update public customers with the new primary_contact_id
        UPDATE public.customers 
        SET primary_contact_id = c.id
        FROM public.contacts c
        WHERE c.customer_id = public.customers.id 
          AND c.is_primary = true
          AND public.customers.primary_contact_id IS NULL;
    END IF;
END $$;

-- 4. Create a function to help with future contact creation
CREATE OR REPLACE FUNCTION mvp.create_primary_contact(
    p_customer_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_title TEXT DEFAULT 'Primary Contact'
)
RETURNS UUID AS $$
DECLARE
    v_contact_id UUID;
BEGIN
    -- Create the contact
    INSERT INTO mvp.contacts (first_name, last_name, email, phone, title, company_id, is_primary, created_at, updated_at)
    VALUES (p_first_name, p_last_name, p_email, p_phone, p_title, p_customer_id, true, NOW(), NOW())
    RETURNING id INTO v_contact_id;
    
    -- Update the customer
    UPDATE mvp.customers 
    SET primary_contact_id = v_contact_id, updated_at = NOW()
    WHERE id = p_customer_id;
    
    RETURN v_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the same function for public schema if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'customers'
    ) THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.create_primary_contact(
            p_customer_id UUID,
            p_first_name TEXT,
            p_last_name TEXT,
            p_email TEXT,
            p_phone TEXT DEFAULT NULL,
            p_title TEXT DEFAULT ''Primary Contact''
        )
        RETURNS UUID AS $func$
        DECLARE
            v_contact_id UUID;
        BEGIN
            INSERT INTO public.contacts (first_name, last_name, email, phone, title, customer_id, is_primary, created_at, updated_at)
            VALUES (p_first_name, p_last_name, p_email, p_phone, p_title, p_customer_id, true, NOW(), NOW())
            RETURNING id INTO v_contact_id;
            
            UPDATE public.customers 
            SET primary_contact_id = v_contact_id, updated_at = NOW()
            WHERE id = p_customer_id;
            
            RETURN v_contact_id;
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;
        ';
    END IF;
END $$;
