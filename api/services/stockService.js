const axios = require('axios');

/**
 * Stock Service
 * 
 * Handles fetching stock data from external APIs.
 * Uses Finnhub as the primary provider (requires API key).
 * Falls back to Yahoo Finance public API if no key is provided.
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

/**
 * Fetch stock quote data for a symbol
 * @param {string} symbol Stock symbol (e.g., RKLB, SPCE)
 * @returns {Promise<object>} Quote data (price, change, change_percent)
 */
async function getStockQuote(symbol) {
    if (!symbol) throw new Error('Symbol is required');

    // Use Finnhub if API key is available
    if (FINNHUB_API_KEY) {
        try {
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`);
            if (!response.ok) throw new Error(`Finnhub API error: ${response.statusText}`);

            const data = await response.json();

            // Finnhub fields: c=current, d=change, dp=change percent
            if (data.c === 0 && data.d === null) {
                throw new Error(`No data found for symbol: ${symbol}`);
            }

            return {
                price: data.c,
                change: data.d,
                change_percent: data.dp,
                last_updated: new Date()
            };
        } catch (error) {
            console.warn(`Finnhub fetch failed for ${symbol}:`, error.message);
            // Fallback to Yahoo if possible
        }
    }

    // Fallback: Yahoo Finance public query API
    // Note: This is unofficial and might be rate-limited
    try {
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol.toUpperCase()}`);
        if (!response.ok) throw new Error(`Yahoo Finance API error: ${response.statusText}`);

        const data = await response.json();
        const result = data?.quoteResponse?.result?.[0];

        if (!result) {
            throw new Error(`Symbol not found on Yahoo Finance: ${symbol}`);
        }

        return {
            name: result.shortName || result.longName,
            price: result.regularMarketPrice,
            change: result.regularMarketChange,
            change_percent: result.regularMarketChangePercent,
            exchange: result.fullExchangeName || result.exchange,
            last_updated: new Date()
        };
    } catch (error) {
        console.error(`All stock fetch attempts failed for ${symbol}:`, error.message);
        throw error;
    }
}

/**
 * Search for a stock symbol by company name
 * @param {string} name Company name
 * @returns {Promise<Array>} List of matching symbols
 */
async function searchStock(name) {
    if (!name) return [];

    if (FINNHUB_API_KEY) {
        try {
            const response = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(name)}&token=${FINNHUB_API_KEY}`);
            if (!response.ok) throw new Error(`Finnhub search error: ${response.statusText}`);

            const data = await response.json();
            return (data.result || []).map(item => ({
                symbol: item.symbol,
                name: item.description,
                type: item.type
            }));
        } catch (error) {
            console.warn('Finnhub search failed:', error.message);
        }
    }

    // Fallback search using Yahoo Finance suggestions
    try {
        const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(name)}`);
        if (!response.ok) throw new Error(`Yahoo search error: ${response.statusText}`);

        const data = await response.json();
        return (data.quotes || []).map(item => ({
            symbol: item.symbol,
            name: item.shortname || item.longname,
            type: item.quoteType
        }));
    } catch (error) {
        console.error('All stock search attempts failed:', error.message);
        return [];
    }
}

module.exports = {
    getStockQuote,
    searchStock
};
