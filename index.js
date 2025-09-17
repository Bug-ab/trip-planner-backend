import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Allow requests only from local dev + your deployed Vercel frontend
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://trip-planner-frontend-six.vercel.app" // vercel frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ✅ Setup OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Trip planner API endpoint
app.post("/api/plan", async (req, res) => {
  try {
    const { destination, start_date, days, experience } = req.body;

    if (!destination || !start_date || !days || !experience) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `Create a detailed ${days}-day hiking and camping itinerary for ${destination}, 
    starting on ${start_date}, for a ${experience} level hiker. 
    Include daily schedule, trail names, distances, difficulty, safety tips, and camping recommendations.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful trip planner." },
        { role: "user", content: prompt },
      ],
    });

    const plan = response.choices[0].message.content;

    res.json({ plan });
  } catch (error) {
    console.error("Error generating itinerary:", error);
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

