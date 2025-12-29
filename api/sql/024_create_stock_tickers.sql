-- Migration 024: Create Stock Tickers Table
-- This migration creates a table for managing stock ticker data displayed on the news page

CREATE TABLE IF NOT EXISTS stock_tickers (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL, -- e.g., 'RKLB', 'SPCE', 'BA'
    name TEXT NOT NULL, -- e.g., 'RocketLab', 'Virgin Galactic', 'Boeing'
    price DECIMAL(12, 2) NOT NULL,
    change DECIMAL(12, 2) NOT NULL, -- positive or negative change amount
    change_percent DECIMAL(5, 2) NOT NULL, -- percentage change
    exchange TEXT DEFAULT 'NASDAQ', -- NASDAQ, NYSE, etc.
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0, -- Order in which to display tickers
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active tickers
CREATE INDEX IF NOT EXISTS idx_stock_tickers_active ON stock_tickers(is_active, display_order);

-- Add comment
COMMENT ON TABLE stock_tickers IS 'Stock ticker data displayed on the news page';
COMMENT ON COLUMN stock_tickers.display_order IS 'Order in which tickers are displayed (lower numbers first)';

