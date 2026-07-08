const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/pricecheck
router.post('/', protect, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    // Fetch the page content
    let pageContent = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(parsedUrl.href, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const html = await response.text();

      // Extract useful parts — title, meta tags, JSON-LD, price-related content
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // Extract meta tags
      const metaTags = [];
      const metaRegex = /<meta[^>]+(name|property|itemprop)=["']([^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
      let match;
      while ((match = metaRegex.exec(html)) !== null) {
        metaTags.push({ attr: match[2], content: match[3] });
      }

      // Extract JSON-LD structured data
      const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      const jsonLdData = [];
      if (jsonLdMatches) {
        for (const jm of jsonLdMatches) {
          try {
            const inner = jm.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
            jsonLdData.push(JSON.parse(inner));
          } catch { /* skip invalid JSON-LD */ }
        }
      }

      // Extract visible price-related text (simplified)
      const pricePatterns = html.match(/(?:₹|Rs\.?|INR|MRP|price|discount|offer|save|off|original|was|now)\s*:?\s*[\d,]+\.?\d*/gi) || [];

      pageContent = `
PAGE TITLE: ${title}

META TAGS:
${metaTags.slice(0, 20).map((m) => `${m.attr}: ${m.content}`).join('\n')}

STRUCTURED DATA (JSON-LD):
${jsonLdData.length > 0 ? JSON.stringify(jsonLdData, null, 2).slice(0, 3000) : 'None found'}

PRICE-RELATED TEXT FOUND:
${pricePatterns.slice(0, 20).join('\n')}

SOURCE URL: ${parsedUrl.href}
DOMAIN: ${parsedUrl.hostname}`;
    } catch (fetchErr) {
      pageContent = `Could not fetch page content. URL: ${parsedUrl.href}, Domain: ${parsedUrl.hostname}. Error: ${fetchErr.message}`;
    }

    // Send to Gemini for analysis
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash' });

    const prompt = `You are a consumer protection analyst specializing in detecting dark patterns and fake discounts in e-commerce. Analyze the following product page data and provide your assessment.

${pageContent}

Return ONLY valid JSON (no markdown, no code fences):
{
  "productName": "name of the product",
  "currentPrice": numeric price or null,
  "originalPrice": claimed original/MRP price or null,
  "claimedDiscount": "the discount claim as shown (e.g. '40% off')" or null,
  "verdict": "genuine" | "suspicious" | "fake_discount" | "insufficient_data",
  "confidenceLevel": "high" | "medium" | "low",
  "analysis": "2-3 sentence explanation of your findings",
  "darkPatterns": ["list of dark patterns detected, if any"],
  "tips": ["2-3 actionable tips for the consumer"],
  "realDiscount": "your estimate of the actual discount percentage" or null
}

Guidelines:
- If the original price seems artificially inflated, flag it
- Check if the "discount" is a common marketing tactic
- Look for dark patterns like fake urgency, hidden fees, forced bundles
- If data is insufficient, say so honestly — don't make things up
- Be consumer-friendly in your analysis`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    let parsed;
    try {
      const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        productName: 'Unknown Product',
        verdict: 'insufficient_data',
        confidenceLevel: 'low',
        analysis: responseText.slice(0, 500),
        darkPatterns: [],
        tips: ['Try pasting a direct product page URL for better results'],
      };
    }

    res.json({
      ...parsed,
      url: parsedUrl.href,
      domain: parsedUrl.hostname,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Price check error:', err);
    if (err.message?.includes('API_KEY') || err.message?.includes('apiKey')) {
      return res.status(500).json({ message: 'Gemini API key not configured.' });
    }
    res.status(500).json({ message: 'Failed to analyze product. Please try again.' });
  }
});

module.exports = router;
