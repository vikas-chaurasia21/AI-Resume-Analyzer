const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const { GoogleGenerativeAI } = require("@google/generative-ai")

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json({ limit: "10mb" }))

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// ======================================================
// HELPER: sleep
// ======================================================
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// ======================================================
// HELPER: check if error is a "temporary" error
// (503 overloaded, 429 rate limit, etc.)
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

            // Agar retryable error hai aur retries bache hain, wait karke try karo
            if (isRetryableError(error) && attempt < maxRetries) {
                const waitTime = attempt * 1500 // 1.5s, 3s, 4.5s...
                console.log(`Waiting ${waitTime}ms before retry...`)
                await sleep(waitTime)
                continue
            }

            // Agar retryable nahi hai (jaise 400 bad request), turant fail karo
            if (!isRetryableError(error)) {
                throw error
            }
        }
    }

    // Saare retries khatam ho gaye is model ke liye
    throw lastError
}

// ======================================================
// HELPER: try multiple models in sequence (fallback chain)
// ======================================================
async function getAIFeedbackWithFallback(prompt) {
    // Yahan apne available models daal do (order matters — pehla priority hai)
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

    // Saare models fail ho gaye
    throw lastError
}

// ======================================================
// ROUTE
// ======================================================
app.post("/analyze-ai", async function (req, res) {
    console.log("POST request recieved")

    try {
        const resumeText = req.body.resumeText

        if (!resumeText) {
            return res.status(400).json({
                error: "Resume text is required.",
            })
        }

        const prompt = `
    Analyze this resume and give feedback in simple and short English.
    
    Return:
    1. keep answer under 120 to 150 words.
    2. Give only 4 section
    3. No long paragraphs
    4. Suggestions
    5. Best Role Fit

    Return exactly:

    Summary:
    Strength:
    Weaknesses:
    Suggestions:
    
    Resume:
    ${resumeText}
    `

        const aiFeedback = await getAIFeedbackWithFallback(prompt)

        res.json({
            aiFeedback,
        })
    } catch (error) {
        console.log("AI Error:", error.message)

        // User ko friendly message do, technical detail chhupao
        const isOverload = isRetryableError(error)

        res.status(500).json({
            error: isOverload
                ? "AI service is currently busy (high demand). Please try again in a few seconds."
                : error.message,
        })
    }
})

const PORT = process.env.PORT || 5000

app.listen(PORT, function () {
    console.log(`Server running on ${PORT}`)
})