-- Add goodhang to the products table
-- Note: x_human.product_type enum already includes 'goodhang'

INSERT INTO human_os.products (id, name, description) VALUES
  ('goodhang', 'Good Hang', 'AI-native social network with D&D-style personality assessment')
ON CONFLICT (id) DO NOTHING;
