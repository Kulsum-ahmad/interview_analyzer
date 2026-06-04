const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 2. Initialize using the correct constructor name and pass the key directly
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 

app.post('/api/analyze', async (req, res) => {
    const { interviewAnswer, jobRole } = req.body;

    const prompt = `
    You are an expert technical interviewer for a ${jobRole} role. 
    Analyze the following candidate answer for clarity, technical accuracy, and filler words (like 'um', 'uh', 'like', 'basically').
    
    Candidate Answer: "${interviewAnswer}"
    
    Provide a JSON response strictly in this format:
    {
      "score": "Out of 10",
      "fillerWordAnalysis": "Feedback on their pacing and filler words",
      "technicalFeedback": "Feedback on accuracy",
      "improvedVersion": "A polished, stronger way to say the same thing"
    }`;

    try {
        // 3. Request the flash model from the genAI instance
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean any markdown formatting wrap if Gemini returns it
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        res.json(JSON.parse(cleanJson));
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: "Failed to process interview metrics." });
    }
});

app.listen(5000, () => console.log('Backend running on port 5000'));