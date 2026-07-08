const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/split/scan — parse a bill image using Gemini Vision
router.post('/scan', protect, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }

    let base64Data = image;
    let mimeType = 'image/jpeg';

    if (image.startsWith('data:')) {
      const parts = image.split(',');
      if (parts.length === 2) {
        mimeType = parts[0].split(':')[1].split(';')[0];
        base64Data = parts[1];
      }
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a restaurant bill parser. Analyze this bill/receipt image and extract every line item. Return ONLY valid JSON, no markdown, no code fences:

{
  "restaurant": "restaurant/establishment name",
  "date": "YYYY-MM-DD" or null,
  "items": [
    { "name": "item name", "price": price_as_number, "qty": quantity_as_number }
  ],
  "subtotal": number or null,
  "tax": number or null,
  "serviceCharge": number or null,
  "tip": number or null,
  "total": total_amount_as_number,
  "currency": "INR" or "USD" etc
}

Important:
- List EVERY individual item on the bill
- Price should be per-item price (not total for qty)
- Include tax, service charge, tip separately if visible
- Total should be the final amount
- If you can't read something, make your best guess from context`;

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

    let parsed;
    try {
      const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return res.status(422).json({
        message: 'Could not parse the bill. Please try a clearer photo.',
        raw: responseText,
      });
    }

    // Ensure items have IDs for frontend assignment
    const items = (parsed.items || []).map((item, idx) => ({
      id: `item_${idx}`,
      name: item.name,
      price: item.price || 0,
      qty: item.qty || 1,
      assignedTo: [],
    }));

    res.json({
      restaurant: parsed.restaurant || 'Unknown',
      date: parsed.date || null,
      items,
      subtotal: parsed.subtotal || null,
      tax: parsed.tax || 0,
      serviceCharge: parsed.serviceCharge || 0,
      tip: parsed.tip || 0,
      total: parsed.total || items.reduce((s, i) => s + i.price * i.qty, 0),
      currency: parsed.currency || 'INR',
    });
  } catch (err) {
    console.error('Split scan error:', err);
    if (err.message && err.message.toLowerCase().includes('api key')) {
      return res.status(500).json({ message: 'Gemini API key not configured properly.', rawError: err.message });
    }
    res.status(500).json({ message: 'Failed to scan bill.', rawError: err.message });
  }
});

// POST /api/split/calculate — calculate each person's share
router.post('/calculate', protect, async (req, res) => {
  try {
    const { items, tax = 0, serviceCharge = 0, tip = 0, total, people } = req.body;

    if (!items || !people || people.length === 0) {
      return res.status(400).json({ message: 'Items and people are required' });
    }

    const itemsSubtotal = items.reduce((sum, item) => {
      return sum + (item.price * (item.qty || 1));
    }, 0);

    const extras = (tax || 0) + (serviceCharge || 0) + (tip || 0);
    const extraRatio = itemsSubtotal > 0 ? extras / itemsSubtotal : 0;

    // Calculate each person's share
    const shares = {};
    people.forEach((person) => {
      shares[person] = { name: person, itemsTotal: 0, items: [], extraShare: 0, total: 0 };
    });

    items.forEach((item) => {
      const assignedPeople = item.assignedTo || [];
      if (assignedPeople.length === 0) {
        // Unassigned items split equally among everyone
        const perPerson = (item.price * (item.qty || 1)) / people.length;
        people.forEach((person) => {
          shares[person].itemsTotal += perPerson;
          shares[person].items.push({
            name: item.name,
            amount: perPerson,
            shared: true,
            sharedWith: people.length,
          });
        });
      } else {
        const perPerson = (item.price * (item.qty || 1)) / assignedPeople.length;
        assignedPeople.forEach((person) => {
          if (shares[person]) {
            shares[person].itemsTotal += perPerson;
            shares[person].items.push({
              name: item.name,
              amount: perPerson,
              shared: assignedPeople.length > 1,
              sharedWith: assignedPeople.length,
            });
          }
        });
      }
    });

    // Add proportional extras
    Object.values(shares).forEach((share) => {
      share.extraShare = share.itemsTotal * extraRatio;
      share.total = Math.round((share.itemsTotal + share.extraShare) * 100) / 100;
      share.itemsTotal = Math.round(share.itemsTotal * 100) / 100;
      share.extraShare = Math.round(share.extraShare * 100) / 100;
    });

    const grandTotal = Object.values(shares).reduce((s, share) => s + share.total, 0);

    res.json({
      shares: Object.values(shares),
      summary: {
        itemsSubtotal: Math.round(itemsSubtotal * 100) / 100,
        tax,
        serviceCharge,
        tip,
        extras: Math.round(extras * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
      },
    });
  } catch (err) {
    console.error('Split calculate error:', err);
    res.status(500).json({ message: 'Failed to calculate split' });
  }
});

module.exports = router;
