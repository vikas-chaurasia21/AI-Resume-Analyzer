const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const { GoogleGenerativeAI } = require("@google/generative-ai")

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json({limit:"10mb"}))

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

app.post("/analyze-ai", async function (req , res) {
    console.log("POST request recieved")
    try{
        const resumeText = req.body.resumeText

        if(!resumeText){    
            return res.status(400).json({
                error: "Resume text is required."
            })
        }
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        })
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
        const result = await model.generateContent(prompt)

        const response = await result.response

        const aiFeedback = response.text()

        res.json({
            aiFeedback
        })
    }
    catch(error){
        console.log("AI Error:" ,error.message)

        res.status(500).json({
            error: error.message
        })
    }
})

const PORT = process.env.PORT || 5000

app.listen(PORT , function(){
    console.log('Server running on ${PORT}')
})