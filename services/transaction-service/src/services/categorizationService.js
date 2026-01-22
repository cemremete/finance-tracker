const Fuse = require('fuse.js');
const { categoryKeywords, categoryInfo, DEFAULT_CATEGORY } = require('../config/categories');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

class CategorizationService {
  constructor() {
    // Build flat keyword list for fuzzy matching
    this.keywordMap = new Map();
    this.fuseData = [];
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        this.keywordMap.set(keyword.toLowerCase(), category);
        this.fuseData.push({ keyword: keyword.toLowerCase(), category });
      }
    }

    // Initialize Fuse.js for fuzzy matching
    this.fuse = new Fuse(this.fuseData, {
      keys: ['keyword'],
      threshold: 0.3, // Lower = more strict matching
      includeScore: true
    });
  }

  /**
   * Auto-categorize a transaction based on merchant name
   * @param {string} merchantName - The merchant/description of transaction
   * @param {string} userId - User ID for personalized mappings
   * @returns {Object} { category, confidence, method }
   */
  async categorize(merchantName, userId = null) {
    if (!merchantName) {
      return { category: DEFAULT_CATEGORY, confidence: 0, method: 'default' };
    }

    const normalizedName = merchantName.toLowerCase().trim();

    // 1. Check user's custom mappings first (highest priority)
    if (userId) {
      const userMapping = await this.getUserMapping(userId, normalizedName);
      if (userMapping) {
        return {
          category: userMapping.category,
          confidence: userMapping.confidence,
          method: 'user_mapping'
        };
      }
    }

    // 2. Exact keyword match
    for (const [keyword, category] of this.keywordMap) {
      if (normalizedName.includes(keyword)) {
        return { category, confidence: 1.0, method: 'exact_match' };
      }
    }

    // 3. Fuzzy match using Fuse.js
    const fuzzyResults = this.fuse.search(normalizedName);
    if (fuzzyResults.length > 0 && fuzzyResults[0].score < 0.4) {
      return {
        category: fuzzyResults[0].item.category,
        confidence: 1 - fuzzyResults[0].score,
        method: 'fuzzy_match'
      };
    }

    // 4. No match found
    return { category: DEFAULT_CATEGORY, confidence: 0, method: 'default' };
  }

  /**
   * Get user's custom category mapping
   */
  async getUserMapping(userId, keyword) {
    try {
      const result = await query(
        `SELECT category, confidence FROM user_category_mappings 
         WHERE user_id = $1 AND $2 ILIKE '%' || keyword || '%'
         ORDER BY confidence DESC, usage_count DESC
         LIMIT 1`,
        [userId, keyword]
      );
      return result.rows[0] || null;
    } catch (err) {
      logger.error('Error getting user mapping:', err);
      return null;
    }
  }

  /**
   * Save user's category correction (for learning)
   */
  async saveUserCorrection(userId, merchantName, category) {
    const keyword = this.extractKeyword(merchantName);
    
    try {
      await query(
        `INSERT INTO user_category_mappings (user_id, keyword, category, usage_count)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (user_id, keyword) 
         DO UPDATE SET 
           category = $3,
           usage_count = user_category_mappings.usage_count + 1,
           confidence = LEAST(1.0, user_category_mappings.confidence + 0.1),
           updated_at = NOW()`,
        [userId, keyword, category]
      );
      logger.info({ userId, keyword, category }, 'User category mapping saved');
    } catch (err) {
      logger.error('Error saving user correction:', err);
    }
  }

  /**
   * Extract the most significant keyword from merchant name
   */
  extractKeyword(merchantName) {
    // Remove common words and extract main keyword
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'of', 'in', 'at', 'to', 'for'];
    const words = merchantName.toLowerCase()
      .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w));
    
    return words[0] || merchantName.toLowerCase().substring(0, 20);
  }

  /**
   * Bulk categorize transactions
   */
  async bulkCategorize(transactions, userId) {
    const results = [];
    
    for (const tx of transactions) {
      const { category, confidence, method } = await this.categorize(
        tx.merchant_name || tx.description,
        userId
      );
      results.push({
        ...tx,
        category,
        auto_categorized: method !== 'default',
        categorization_confidence: confidence,
        categorization_method: method
      });
    }
    
    return results;
  }

  /**
   * Get all available categories with info
   */
  getCategories() {
    return Object.entries(categoryInfo).map(([key, info]) => ({
      id: key,
      ...info
    }));
  }

  /**
   * Suggest categories based on partial input
   */
  suggestCategories(partialMerchant) {
    if (!partialMerchant || partialMerchant.length < 2) {
      return [];
    }

    const results = this.fuse.search(partialMerchant.toLowerCase(), { limit: 5 });
    const suggestions = new Set();
    
    for (const result of results) {
      suggestions.add(result.item.category);
    }
    
    return Array.from(suggestions).map(cat => ({
      category: cat,
      ...categoryInfo[cat]
    }));
  }
}

module.exports = new CategorizationService();
