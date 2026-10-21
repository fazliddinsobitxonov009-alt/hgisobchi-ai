/**
 * HISOBCHI AI — BACKEND SERVER & REAL OPENAI CHAT INTEGRATION
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

app.use(helmet());
app.use(cors());
app.use(express.json());

// Server health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', message: 'Hisobchi AI serveri muvaffaqiyatli ishlamoqda' });
});

// POST /api/ai/chat endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, financialContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Xabarlar formati noto‘g‘ri.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API kaliti serverda sozlanmagan. Iltimos, .env faylini to‘ldiring.' 
      });
    }

    // Professional system prompt with real calculated numbers
    const systemPrompt = {
      role: 'system',
      content: `Sen "Hisobchi AI" — O‘zbekistondagi tadbirkorlar, kichik biznes egalari va investorlar uchun mo‘ljallangan professional moliyaviy maslahatchi va ekspertisan.
Foydalanuvchining tizimdagi aniq moliyaviy ko‘rsatkichlari:
- Jami Kirim: ${financialContext?.totalIncome || 0} UZS
- Jami Chiqim: ${financialContext?.totalExpense || 0} UZS
- Sof Foyda: ${financialContext?.netProfit || 0} UZS
- Foyda Marjasi: ${financialContext?.profitMargin || 0}%

Qoidalaring:
1. Faqat o‘zbek tilida ravon, tushunarli va amaliy javob ber.
2. Savollarga javob berishda yuqoridagi aniq raqamlarga tayan. Raqamlarni o‘zing to‘qib chiqarma.
3. Investorlar uchun biznesning jozibadorligi, xavflar va pul oqimi bo‘yicha professional tahlil taqdim et.
4. Moliyaviy natijalar kafolatlanmaganligini va muhim qarorlar uchun ma'lumotlarni mustaqil tekshirish zarurligini eslatib o't.`
    };

    const apiMessages = [systemPrompt, ...messages];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API xatoligi yuz berdi.');
    }

    const reply = data.choices[0].message.content;

    res.json({
      success: true,
      reply: reply
    });

  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'AI chat xizmatida xatolik yuz berdi. API kalitini tekshiring.' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Hisobchi AI Server http://localhost:${PORT} da ishga tushdi.`);
});