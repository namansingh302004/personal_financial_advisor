const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/receipt/scan
router.post('/scan', protect, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // Extract base64 data and mime type
    let base64Data = image;
    let mimeType = 'image/jpeg';

    if (image.startsWith('data:')) {
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `You are a receipt parser. Analyze this receipt image and extract the following information. Return ONLY valid JSON, no markdown, no code fences:

{
  "merchant": "store/restaurant name",
  "amount": total amount as a number (the final total paid),
  "date": "YYYY-MM-DD" format (if visible, otherwise null),
  "category": one of ["Food & Dining", "Transport", "Entertainment", "Health & Fitness", "Shopping", "Bills & Utilities", "Education", "Travel", "Groceries", "Other"],
  "items": [{"name": "item name", "price": price_as_number}],
  "note": "brief summary of purchase in 5-10 words"
}

Important:
- Amount should be the TOTAL/GRAND TOTAL, not subtotal
- If the currency symbol is ₹ or Rs, keep the number as-is
- Pick the most appropriate category based on the merchant and items
- If you cannot read something clearly, make your best guess
- Always return valid JSON`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);

    const responseText = result.response.text().trim();

    // Parse JSON from response (handle possible markdown code fences)
    let parsed;
    try {
      const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      return res.status(422).json({
        message: 'Could not parse receipt. Please try a clearer photo.',
        raw: responseText,
      });
    }

    res.json({
      merchant: parsed.merchant || '',
      amount: parsed.amount || 0,
      date: parsed.date || new Date().toISOString().split('T')[0],
      category: parsed.category || 'Other',
      items: parsed.items || [],
      note: parsed.note || '',
    });
  } catch (err) {
    console.error('Receipt scan error:', err);
    if (err.message?.includes('API_KEY') || err.message?.includes('apiKey')) {
      return res.status(500).json({ message: 'Gemini API key not configured.' });
    }
    res.status(500).json({ message: 'Failed to scan receipt. Please try again.' });
  }
});

module.exports = router;
