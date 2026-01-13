-- Update Version Numbering Convention
-- Divide all version numbers by 10: 1.x → 0.1.x, 2.0 → 0.1.7, 3.0 → 0.2.0
-- Philosophy: True 1.0 should be when a customer has successfully used the product (GA-ready)
-- Building toward 1.0, not already at it

-- ============================================================================
-- UPDATE RELEASES TABLE
-- ============================================================================

-- Update Phase 1 releases: 1.x → 0.1.x
UPDATE releases SET version = '0.1.0' WHERE version = '1.0';
UPDATE releases SET version = '0.1.1' WHERE version = '1.1';
UPDATE releases SET version = '0.1.2' WHERE version = '1.2';
UPDATE releases SET version = '0.1.3' WHERE version = '1.3';
UPDATE releases SET version = '0.1.4' WHERE version = '1.4';
UPDATE releases SET version = '0.1.5' WHERE version = '1.5';
UPDATE releases SET version = '0.1.6' WHERE version = '1.6';

-- Update Phase 2 (Parking Lot): 2.0 → 0.1.7
-- Reslot as continuation of 0.1.x series before major 0.2.0 release
UPDATE releases SET version = '0.1.7' WHERE version = '2.0';

-- Update Phase 3 (Human OS Check-Ins): 3.0 → 0.2.0
-- Accelerate to 0.2.0 as first major release with competitive moat
UPDATE releases SET version = '0.2.0' WHERE version = '3.0';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN releases.version IS 'Semantic versioning: 0.x.y for pre-1.0, 1.0+ for GA. True 1.0 = customer successfully using product with their customers.';
