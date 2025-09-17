import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();

// ✅ Configure CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",                         // local dev
      "https://trip-planner-frontend-six.vercel.app", // deployed frontend
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// ✅ Route: Generate Trip Itinerary
app.post("/api/plan", async (req, res) => {
  try {
    const { destination, start_date, days, experience } = req.body;

    if (!destination || !start_date || !days || !experience) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `
      Generate a detailed hiking and camping itinerary for ${days} day(s)
      in ${destination}, starting on ${start_date}.
      The experience level is ${experience}.
      Provide times, activities, hiking trails, meal recommendations, and safety tips.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res.status(500).json({ error: "Failed to generate itinerary" });
    }

    const plan = data.choices[0].message.content;

    res.json({ plan });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


