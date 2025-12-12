// POST /api/hike-options
app.post("/api/hike-options", async (req, res) => {
  try {
    const { destination, days, experience } = req.body || {};

    if (!destination || !experience) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["destination", "experience"],
      });
    }

    const daysNum = Number(days || 1);
    if (!Number.isFinite(daysNum) || daysNum < 1 || daysNum > 30) {
      return res.status(400).json({ error: "days must be a number between 1 and 30" });
    }

    // If no key on Render, return a fallback instead of crashing
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        hikes: fallbackHikes(destination, experience),
        source: "fallback_no_key",
      });
    }

    const prompt = `
You are a hiking assistant for the Canadian Rockies.
Return ONLY valid JSON (no markdown, no extra text).

Create 6 hike options in/near "${destination}" suitable for "${experience}".
Each option must include:
- id (short string)
- name
- region (e.g., Banff NP, Yoho NP)
- distance_km (number)
- elevation_m (number)
- duration_hours (string like "3-5")
- difficulty (Beginner/Intermediate/Advanced)
- highlights (array of 3 short strings)
- notes (1 short sentence: parking/shuttle/season/wildlife)
- day_fit (which day it best fits if trip is ${daysNum} day(s): 1..${daysNum})

Return JSON shape:
{ "hikes": [ ... ] }
`.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: "Return strict JSON only." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion?.choices?.[0]?.message?.content?.trim() || "";

    // Try strict parse; if model added extra text, extract first {...}
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse JSON from model response");
      parsed = JSON.parse(match[0]);
    }

    const hikes = Array.isArray(parsed?.hikes) ? parsed.hikes : null;
    if (!hikes) throw new Error("Model response missing 'hikes' array");

    return res.json({ hikes, source: "openai" });
  } catch (err) {
    console.error("❌ /api/hike-options error:", err);
    // Return fallback instead of 500 (prevents frontend from breaking)
    return res.json({
      hikes: fallbackHikes(req?.body?.destination || "your area", req?.body?.experience || "Beginner"),
      source: "fallback_error",
      error: err?.message || "Unknown error",
    });
  }
});

// Simple fallback so UI always works even if OpenAI fails
function fallbackHikes(destination, experience) {
  const level = String(experience || "Beginner");
  return [
    {
      id: "h1",
      name: "Scenic Lakeside Walk",
      region: destination,
      distance_km: 4.5,
      elevation_m: 120,
      duration_hours: "1.5-2.5",
      difficulty: level,
      highlights: ["Lake views", "Easy navigation", "Great photos"],
      notes: "Arrive early for parking; watch for wildlife.",
      day_fit: 1,
    },
    {
      id: "h2",
      name: "Valley Trail to Viewpoint",
      region: destination,
      distance_km: 8.0,
      elevation_m: 280,
      duration_hours: "3-4",
      difficulty: level,
      highlights: ["River valley", "Viewpoint", "Good for half-day"],
      notes: "Carry layers; conditions change quickly.",
      day_fit: 1,
    },
    {
      id: "h3",
      name: "Moderate Ridge Loop",
      region: destination,
      distance_km: 10.5,
      elevation_m: 500,
      duration_hours: "4-6",
      difficulty: level,
      highlights: ["Ridge views", "Wildflowers (seasonal)", "Big scenery"],
      notes: "Check trail status and bring bear spray.",
      day_fit: 2,
    },
    {
      id: "h4",
      name: "Waterfall Out-and-Back",
      region: destination,
      distance_km: 6.5,
      elevation_m: 220,
      duration_hours: "2.5-3.5",
      difficulty: level,
      highlights: ["Waterfall", "Forest trail", "Family-friendly sections"],
      notes: "Trails can be icy/muddy depending on season.",
      day_fit: 2,
    },
    {
      id: "h5",
      name: "High Viewpoint Ascent",
      region: destination,
      distance_km: 12.0,
      elevation_m: 650,
      duration_hours: "5-7",
      difficulty: level,
      highlights: ["Panoramic views", "Alpine feel", "Epic summit photo"],
      notes: "Start early; bring extra water and snacks.",
      day_fit: 3,
    },
    {
      id: "h6",
      name: "Canyon + Lookout Route",
      region: destination,
      distance_km: 9.0,
      elevation_m: 350,
      duration_hours: "3.5-5",
      difficulty: level,
      highlights: ["Canyon walls", "Lookout", "Good variety"],
      notes: "Expect crowds; go early or late for quieter trails.",
      day_fit: 1,
    },
  ];
}
