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
// ---------------------------------------------
// NEW ENDPOINT: Suggest hike options
// ---------------------------------------------
app.post("/api/hike-options", async (req, res) => {
  const { destination, days, experience } = req.body;

  // For now, we let OpenAI create structured options.
  // Later, we can replace this with real hike data (Parks Canada, AllTrails etc.)

  const prompt = `
  Suggest ${days} days of hiking options in ${destination}.
  For each day, return 2 hike options.
  Format the response as VALID JSON only:
  {
    "hikes": [
      {
        "day": 1,
        "options": [
          { "name": "...", "distance_km": 0, "elevation_m": 0, "difficulty": "...", "notes": "..." },
          { "name": "...", "distance_km": 0, "elevation_m": 0, "difficulty": "...", "notes": "..." }
        ]
      }
    ]
  }
  Important: difficulty should match ${experience} level.
  `;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const jsonText = completion.choices[0].message.content;
    const data = JSON.parse(jsonText);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate hike options" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


