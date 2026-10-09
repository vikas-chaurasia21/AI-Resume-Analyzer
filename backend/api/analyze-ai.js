const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function handler(req, res) {
  // Vercel frontend ko backend call karne dena
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Browser ki preflight request handle hogi
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        error: "Resume text is required",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
Analyze this resume and provide concise feedback.

Rules:
- Keep the response under 150 words
- Use simple English
- Avoid long paragraphs

Return exactly:

Summary:
Strengths:
Weaknesses:
Suggestions:
Best Role Fit:

Resume:
${resumeText}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiFeedback = response.text();

    return res.status(200).json({
      aiFeedback,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    return res.status(500).json({
      error: error.message || "AI analysis failed",
    });
  }
};
