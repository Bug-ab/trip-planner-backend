import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Route for generating trip plans
app.post("/api/plan", async (req, res) => {
  const { destination, start_date, days, experience } = req.body;

  const prompt = `
  Create a detailed ${days}-day hiking & camping itinerary in ${destination}.
  Start date: ${start_date}.
  Experience level: ${experience}.
  Include trail names, campsite recommendations, distances, difficulty levels,
  and safety tips.
  Format clearly day by day.
  `;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    res.json({ plan: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate plan" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));


