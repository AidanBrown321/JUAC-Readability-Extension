export default async function handler(req, res) {
    // Needed for google chrome http requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { text, size } = req.body;
    if (!text || !size) {
      return res.status(400).json({ error: 'Missing text or size' });
    }
    
    console.log("Incoming request body:", req.body);
    console.log("OPENAI_API_KEY present?", !!process.env.OPENAI_API_KEY);

    const prompt = `Summarize the following text in a ${size} summary:\n\n${text}`;
  
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5
        })
      });
  
      const data = await openaiRes.json();
      const summary = data.choices?.[0]?.message?.content?.trim();
  
      if (!summary) {
        return res.status(500).json({ error: 'Failed to generate summary' });
      }
  
      res.status(200).json({ summary });
    } catch (err) {
      console.error("OpenAI error:", err);
      res.status(500).json({ error: 'Server error' });
    }
  }
  