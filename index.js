import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

// --------------------
// App setup (ORDER MATTERS)
// --------------------
const app = express();
app.use(cors());
app.use(express.json());

// Health check (important for Render)
app.get("/", (req, res) => {
  res.send("Trip Planner Backend is running");
});

// --------------------
// OpenAI client
// --------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --------------------
// API: Get hike options (NO itinerary yet)
// --------------------
app.post("/api/hike-options", async (req, res) => {
  try {
    const { destination, days, experience } = req.body;

    if (!destination || !experience) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `
You are a Parks Canada hiking expert.

Suggest 5 hiking trail OPTIONS near ${destination}.
User experience level: ${experience}.
Trip length: ${days} day(s).

For each hike, include:
- Trail name
- Distance (km)
- Elevation gain (m)
- Difficulty
- Why it is good for this experience level

Return as a clear bullet list.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({
      hikes: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Hike options error:", error.message);
    res.status(500).json({ error: "Failed to generate hike options" });
  }
});

// --------------------
// API: Generate final plan (hiking OR camping)
// --------------------
app.post("/api/plan", async (req, res) => {
  try {
    const { destination, start_date, days, experience, camping, selectedHikes } =
      req.body;

    if (!destination || !experience || !days) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = camping
      ? `
Create a ${days}-day CAMPING itinerary in ${destination}.
Experience level: ${experience}
Start date: ${start_date}

Include:
- Day-by-day plan
- Suggested campgrounds (front/backcountry)
- Permit notes
- Gear checklist
- Safety & weather notes
`
      : `
Create a ${days}-day HIKING itinerary in ${destination}.
Experience level: ${experience}
Start date: ${start_date}

Use these selected hikes if provided:
${selectedHikes || "No specific hikes selected"}

Include:
- Day-by-day hikes
- Distances & elevation
- Trailhead logistics
- Safety & weather notes
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({
      plan: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Plan error:", error.message);
    res.status(500).json({ error: "Failed to generate plan" });
  }
});

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Backend running on port ${PORT}`)
);
