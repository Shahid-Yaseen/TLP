-- Migration 025: Seed Initial Stock Tickers
-- This migration adds initial stock ticker data to the database

-- Insert stock tickers (using the data from the frontend)
INSERT INTO stock_tickers (symbol, name, price, change, change_percent, exchange, is_active, display_order)
VALUES
  ('RKLB', 'RocketLab', 420069.00, 69.00, 0.03, 'NASDAQ', true, 1),
  ('RKLB', 'RocketLab', 420069.00, 69.00, 0.03, 'NASDAQ', true, 2),
  ('RKLB', 'RocketLab', 420069.00, 69.00, 0.03, 'NASDAQ', true, 3),
  ('RKLB', 'RocketLab', 420069.00, -69.00, -0.03, 'NASDAQ', true, 4),
  ('RKLB', 'RocketLab', 420069.00, -69.00, -0.03, 'NASDAQ', true, 5)
ON CONFLICT DO NOTHING;

-- Verify the insert
SELECT COUNT(*) as total_tickers FROM stock_tickers;

