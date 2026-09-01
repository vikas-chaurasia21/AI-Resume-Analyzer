const { GoogleGenerativeAI } = require("@google/generative-ai")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// ======================================================
// HELPER: sleep
// ======================================================
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// ======================================================
// HELPER: check if error is a "temporary" error
// ======================================================
function isRetryableError(error) {
    const message = (error.message || "").toLowerCase()

    return (
        message.includes("503") ||
        message.includes("overloaded") ||
        message.includes("429") ||
        message.includes("rate limit") ||
        message.includes("unavailable")
    )
}

// ======================================================
// HELPER: call a single model with retries
// ======================================================
async function callModelWithRetry(modelName, prompt, maxRetries = 3) {
    const model = genAI.getGenerativeModel({ model: modelName })

    let lastError = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Trying model "${modelName}", attempt ${attempt}...`)

            const result = await model.generateContent(prompt)
            const response = await result.response

            return response.text()
        } catch (error) {
            lastError = error

            console.log(
                `Model "${modelName}" attempt ${attempt} failed: ${error.message}`
            )

            if (isRetryableError(error) && attempt < maxRetries) {
                const waitTime = attempt * 1500
                console.log(`Waiting ${waitTime}ms before retry...`)
                await sleep(waitTime)
                continue
            }

            if (!isRetryableError(error)) {
                throw error
            }
        }
    }

    throw lastError
}

// ======================================================
// HELPER: try multiple models in sequence (fallback chain)
// ======================================================
async function getAIFeedbackWithFallback(prompt) {
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

    let lastError = null

    for (const modelName of modelsToTry) {
        try {
            const feedback = await callModelWithRetry(modelName, prompt, 3)
            console.log(`Success with model: ${modelName}`)
            return feedback
        } catch (error) {
            lastError = error
            console.log(`Model "${modelName}" fully failed, trying next model...`)
        }
    }

    throw lastError
}

// ======================================================
// HELPER: safely parse JSON even if AI wraps it in
// markdown code fences like ```json ... ```
// ======================================================
function parseAIJson(rawText) {
    let cleaned = rawText.trim()

    cleaned = cleaned.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "")

    cleaned = cleaned.trim()

    return JSON.parse(cleaned)
}

// ======================================================
// SERVERLESS FUNCTION
// Vercel routes this file automatically to: /api/analyze-ai
// ======================================================
module.exports = async function handler(req, res) {
    // ----------------------------------------------------
    // CORS headers
    // ----------------------------------------------------
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    console.log("POST request received")

    try {
        const resumeText = req.body.resumeText

        if (!resumeText) {
            return res.status(400).json({
                error: "Resume text is required.",
            })
        }

        // ==================================================
        // PROMPT: field-agnostic, structured JSON output.
        // Works for ANY field — CS, Mechanical, Marketing, etc.
        // ==================================================
        const prompt = `
You are an ATS (Applicant Tracking System) resume analyzer. First detect
the resume's field/industry (e.g. Software Engineering, Mechanical
Engineering, Marketing, Finance, etc.) from the content itself. Then
analyze the resume using criteria relevant to THAT field — do not judge
a Mechanical Engineering resume using software skills, and vice versa.

Return ONLY a valid JSON object, no markdown fences, no extra text,
in exactly this shape:

{
  "detectedField": "string - the field/industry you detected",
  "atsScore": number (0-100, overall score),
  "skillScore": number (0-50, based on relevant technical/domain skills found),
  "sectionScore": number (0-35, based on presence of Education, Projects/Experience, Skills, Certifications sections),
  "actionScore": number (0-15, based on strong action verbs like Built, Designed, Led, Managed),
  "status": "string - one of: Excellent Resume, Good Resume, Needs Improvements",
  "foundSkills": ["array of specific skills/tools found in the resume, relevant to the detected field"],
  "missingSkills": ["array of 5-10 relevant skills/tools for this field that are NOT in the resume"],
  "foundSections": ["array of resume sections that ARE present, from: Education, Experience, Projects, Skills, Certifications"],
  "missingSections": ["array of resume sections that are NOT present, from the same list"],
  "strengths": ["array of 2-5 short strength statements"],
  "weaknesses": ["array of 2-5 short weakness statements"],
  "suggestions": ["array of 2-5 short, actionable suggestions"],
  "aiFeedback": "string - a short paragraph (120-150 words) summarizing Summary, Strength, Weaknesses, Suggestions, and Best Role Fit"
}

Resume:
${resumeText}
`

        const rawResponse = await getAIFeedbackWithFallback(prompt)

        let analysis

        try {
            analysis = parseAIJson(rawResponse)
        } catch (parseError) {
            console.log("JSON parse failed:", parseError.message)
            console.log("Raw response was:", rawResponse)

            return res.status(500).json({
                error: "AI returned an unexpected format. Please try again.",
            })
        }

        res.json(analysis)
    } catch (error) {
        console.log("AI Error:", error.message)

        const isOverload = isRetryableError(error)

        res.status(500).json({
            error: isOverload
                ? "AI service is currently busy (high demand). Please try again in a few seconds."
                : error.message,
        })
    }
}