const cron = require('node-cron');
const { getPool } = require('../config/database');
const stockService = require('./stockService');

/**
 * Stock Sync Service
 * 
 * Periodically updates stock ticker data from external APIs.
 */

const pool = getPool();

/**
 * Update all active stock tickers with real-time data
 */
async function syncAllTickers() {
    console.log('🔄 Starting stock ticker sync...');

    try {
        // Get all active stock tickers
        const { rows: tickers } = await pool.query(
            'SELECT id, symbol FROM stock_tickers WHERE is_active = true'
        );

        console.log(`Found ${tickers.length} active tickers to sync.`);

        let successCount = 0;
        let failCount = 0;

        for (const ticker of tickers) {
            try {
                // Fetch new data
                const quote = await stockService.getStockQuote(ticker.symbol);

                // Update database
                await pool.query(
                    `UPDATE stock_tickers 
           SET price = $1, change = $2, change_percent = $3, updated_at = NOW()
           WHERE id = $4`,
                    [quote.price, quote.change, quote.change_percent, ticker.id]
                );

                successCount++;
                // Be nice to APIs - space out requests
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Failed to sync ticker ${ticker.symbol}:`, error.message);
                failCount++;
            }
        }

        console.log(`✅ Stock ticker sync completed. Success: ${successCount}, Failed: ${failCount}`);
    } catch (error) {
        console.error('CRITICAL: Stock ticker sync failed:', error);
    }
}

/**
 * Initialize cron jobs for stock syncing
 */
function initStockSync() {
    // Sync every 30 minutes during market hours? 
    // For simplicity, let's just sync every hour
    cron.schedule('0 * * * *', () => {
        syncAllTickers();
    });

    console.log('⏰ Stock ticker sync scheduled: Every hour');

    // Run an initial sync on startup after a short delay
    setTimeout(() => {
        syncAllTickers();
    }, 10000);
}

module.exports = {
    syncAllTickers,
    initStockSync
};
