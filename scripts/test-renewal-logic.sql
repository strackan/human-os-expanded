-- Test script for renewal date logic
-- This script tests the CASE WHEN logic used in the seed.sql file

-- Show current date
SELECT CURRENT_DATE as current_date;

-- Test the renewal date logic for each customer
-- This simulates what happens in the seed.sql file

SELECT 
  'Acme Corporation' as customer_name,
  '2024-08-15'::date as original_date,
  CASE 
    WHEN DATE '2024-08-15' <= CURRENT_DATE THEN DATE '2024-08-15' + INTERVAL '1 year'
    ELSE DATE '2024-08-15'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-08-15' <= CURRENT_DATE THEN DATE '2024-08-15' + INTERVAL '1 year'
    ELSE DATE '2024-08-15'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'RiskyCorp' as customer_name,
  '2024-07-30'::date as original_date,
  CASE 
    WHEN DATE '2024-07-30' <= CURRENT_DATE THEN DATE '2024-07-30' + INTERVAL '1 year'
    ELSE DATE '2024-07-30'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-07-30' <= CURRENT_DATE THEN DATE '2024-07-30' + INTERVAL '1 year'
    ELSE DATE '2024-07-30'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'TechStart Inc' as customer_name,
  '2024-09-20'::date as original_date,
  CASE 
    WHEN DATE '2024-09-20' <= CURRENT_DATE THEN DATE '2024-09-20' + INTERVAL '1 year'
    ELSE DATE '2024-09-20'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-09-20' <= CURRENT_DATE THEN DATE '2024-09-20' + INTERVAL '1 year'
    ELSE DATE '2024-09-20'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'Global Solutions' as customer_name,
  '2024-10-05'::date as original_date,
  CASE 
    WHEN DATE '2024-10-05' <= CURRENT_DATE THEN DATE '2024-10-05' + INTERVAL '1 year'
    ELSE DATE '2024-10-05'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-10-05' <= CURRENT_DATE THEN DATE '2024-10-05' + INTERVAL '1 year'
    ELSE DATE '2024-10-05'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'StartupXYZ' as customer_name,
  '2024-07-15'::date as original_date,
  CASE 
    WHEN DATE '2024-07-15' <= CURRENT_DATE THEN DATE '2024-07-15' + INTERVAL '1 year'
    ELSE DATE '2024-07-15'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-07-15' <= CURRENT_DATE THEN DATE '2024-07-15' + INTERVAL '1 year'
    ELSE DATE '2024-07-15'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'Nimbus Analytics' as customer_name,
  '2024-11-12'::date as original_date,
  CASE 
    WHEN DATE '2024-11-12' <= CURRENT_DATE THEN DATE '2024-11-12' + INTERVAL '1 year'
    ELSE DATE '2024-11-12'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-11-12' <= CURRENT_DATE THEN DATE '2024-11-12' + INTERVAL '1 year'
    ELSE DATE '2024-11-12'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'Venture Partners' as customer_name,
  '2024-12-01'::date as original_date,
  CASE 
    WHEN DATE '2024-12-01' <= CURRENT_DATE THEN DATE '2024-12-01' + INTERVAL '1 year'
    ELSE DATE '2024-12-01'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-12-01' <= CURRENT_DATE THEN DATE '2024-12-01' + INTERVAL '1 year'
    ELSE DATE '2024-12-01'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'Horizon Systems' as customer_name,
  '2024-06-25'::date as original_date,
  CASE 
    WHEN DATE '2024-06-25' <= CURRENT_DATE THEN DATE '2024-06-25' + INTERVAL '1 year'
    ELSE DATE '2024-06-25'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-06-25' <= CURRENT_DATE THEN DATE '2024-06-25' + INTERVAL '1 year'
    ELSE DATE '2024-06-25'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'Quantum Soft' as customer_name,
  '2024-09-10'::date as original_date,
  CASE 
    WHEN DATE '2024-09-10' <= CURRENT_DATE THEN DATE '2024-09-10' + INTERVAL '1 year'
    ELSE DATE '2024-09-10'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-09-10' <= CURRENT_DATE THEN DATE '2024-09-10' + INTERVAL '1 year'
    ELSE DATE '2024-09-10'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'Apex Media' as customer_name,
  '2024-08-05'::date as original_date,
  CASE 
    WHEN DATE '2024-08-05' <= CURRENT_DATE THEN DATE '2024-08-05' + INTERVAL '1 year'
    ELSE DATE '2024-08-05'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-08-05' <= CURRENT_DATE THEN DATE '2024-08-05' + INTERVAL '1 year'
    ELSE DATE '2024-08-05'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'Stellar Networks' as customer_name,
  '2024-10-22'::date as original_date,
  CASE 
    WHEN DATE '2024-10-22' <= CURRENT_DATE THEN DATE '2024-10-22' + INTERVAL '1 year'
    ELSE DATE '2024-10-22'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-10-22' <= CURRENT_DATE THEN DATE '2024-10-22' + INTERVAL '1 year'
    ELSE DATE '2024-10-22'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'FusionWare' as customer_name,
  '2024-07-08'::date as original_date,
  CASE 
    WHEN DATE '2024-07-08' <= CURRENT_DATE THEN DATE '2024-07-08' + INTERVAL '1 year'
    ELSE DATE '2024-07-08'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-07-08' <= CURRENT_DATE THEN DATE '2024-07-08' + INTERVAL '1 year'
    ELSE DATE '2024-07-08'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'Dynamic Ventures' as customer_name,
  '2024-11-30'::date as original_date,
  CASE 
    WHEN DATE '2024-11-30' <= CURRENT_DATE THEN DATE '2024-11-30' + INTERVAL '1 year'
    ELSE DATE '2024-11-30'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-11-30' <= CURRENT_DATE THEN DATE '2024-11-30' + INTERVAL '1 year'
    ELSE DATE '2024-11-30'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'Prime Holdings' as customer_name,
  '2024-12-15'::date as original_date,
  CASE 
    WHEN DATE '2024-12-15' <= CURRENT_DATE THEN DATE '2024-12-15' + INTERVAL '1 year'
    ELSE DATE '2024-12-15'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-12-15' <= CURRENT_DATE THEN DATE '2024-12-15' + INTERVAL '1 year'
    ELSE DATE '2024-12-15'
  END - CURRENT_DATE) as days_until_renewal;

SELECT 
  'BetaWorks' as customer_name,
  '2024-09-05'::date as original_date,
  CASE 
    WHEN DATE '2024-09-05' <= CURRENT_DATE THEN DATE '2024-09-05' + INTERVAL '1 year'
    ELSE DATE '2024-09-05'
  END as calculated_date,
  (CASE 
    WHEN DATE '2024-09-05' <= CURRENT_DATE THEN DATE '2024-09-05' + INTERVAL '1 year'
    ELSE DATE '2024-09-05'
  END - CURRENT_DATE) as days_until_renewal;
