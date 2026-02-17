const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth, authenticate } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');
const stockService = require('../services/stockService');

const pool = getPool();

/**
 * GET /api/stock-tickers
 * Get all active stock tickers, ordered by display_order
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  try {
    const { active_only } = req.query;
    let query = `
      SELECT 
        id,
        symbol,
        name,
        price,
        change,
        change_percent,
        exchange,
        is_active,
        display_order,
        created_at,
        updated_at
      FROM stock_tickers
    `;

    const params = [];
    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY display_order ASC, id ASC';

    const { rows } = await pool.query(query, params);

    // If no rows found, return empty array instead of error
    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching stock tickers:', error);
    // If table doesn't exist, return empty array
    if (error.message && error.message.includes('does not exist')) {
      console.warn('Stock tickers table does not exist. Please run migration 024_create_stock_tickers.sql');
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to fetch stock tickers', details: error.message });
  }
}));

/**
 * GET /api/stock-tickers/:id
 * Get a single stock ticker by ID
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM stock_tickers WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Stock ticker not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching stock ticker:', error);
    res.status(500).json({ error: 'Failed to fetch stock ticker' });
  }
}));

/**
 * GET /api/stock-tickers/quote/:symbol
 * Fetch real-time quote for a symbol
 * Auth Required: Admin role
 */
router.get('/quote/:symbol', authenticate, role('admin'), asyncHandler(async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await stockService.getStockQuote(symbol);
    res.json(quote);
  } catch (error) {
    console.error(`Error fetching quote for ${req.params.symbol}:`, error);
    res.status(500).json({ error: 'Failed to fetch stock quote', details: error.message });
  }
}));

/**
 * GET /api/stock-tickers/search
 * Search for stock symbols
 * Auth Required: Admin role
 */
router.get('/search', authenticate, role('admin'), asyncHandler(async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await stockService.searchStock(q);
    res.json(results);
  } catch (error) {
    console.error(`Error searching stocks for ${req.query.q}:`, error);
    res.status(500).json({ error: 'Failed to search stocks', details: error.message });
  }
}));

/**
 * POST /api/stock-tickers
 * Create a new stock ticker
 * Auth Required: Admin role
 */
router.post('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  try {
    const {
      symbol,
      name,
      price,
      change,
      change_percent,
      exchange = 'NASDAQ',
      is_active = true,
      display_order = 0
    } = req.body;

    // If only symbol is provided, try to auto-pull the rest
    if (symbol && (!name || price === undefined)) {
      try {
        const quote = await stockService.getStockQuote(symbol);
        name = name || quote.name;
        price = price !== undefined ? price : quote.price;
        change = change !== undefined ? change : quote.change;
        change_percent = change_percent !== undefined ? change_percent : quote.change_percent;
        if (!exchange && quote.exchange) {
          exchange = quote.exchange;
        }
      } catch (error) {
        console.warn(`Auto-pull failed for ${symbol} during create:`, error.message);
        // Continue with manual data if provided
      }
    }

    // Validate required fields
    if (!symbol || !name || price === undefined || change === undefined || change_percent === undefined) {
      return res.status(400).json({ error: 'Missing required fields: symbol, name, price, change, change_percent. Use /quote/:symbol to fetch them automatically.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO stock_tickers
        (symbol, name, price, change, change_percent, exchange, is_active, display_order)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING * `,
      [symbol, name, price, change, change_percent, exchange, is_active, display_order]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating stock ticker:', error);
    res.status(500).json({ error: 'Failed to create stock ticker' });
  }
}));

/**
 * PATCH /api/stock-tickers/:id
 * Update a stock ticker
 * Auth Required: Admin role
 */
router.patch('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      symbol,
      name,
      price,
      change,
      change_percent,
      exchange,
      is_active,
      display_order
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (symbol !== undefined) {
      updates.push(`symbol = $${paramCount++} `);
      values.push(symbol);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount++} `);
      values.push(name);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++} `);
      values.push(price);
    }
    if (change !== undefined) {
      updates.push(`change = $${paramCount++} `);
      values.push(change);
    }
    if (change_percent !== undefined) {
      updates.push(`change_percent = $${paramCount++} `);
      values.push(change_percent);
    }
    if (exchange !== undefined) {
      updates.push(`exchange = $${paramCount++} `);
      values.push(exchange);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++} `);
      values.push(is_active);
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount++} `);
      values.push(display_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE stock_tickers 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
      RETURNING * `,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Stock ticker not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating stock ticker:', error);
    res.status(500).json({ error: 'Failed to update stock ticker' });
  }
}));

/**
 * DELETE /api/stock-tickers/:id
 * Delete a stock ticker
 * Auth Required: Admin role
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM stock_tickers WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Stock ticker not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting stock ticker:', error);
    res.status(500).json({ error: 'Failed to delete stock ticker' });
  }
}));

module.exports = router;

