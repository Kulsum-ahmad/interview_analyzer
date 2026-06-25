const { GoogleGenerativeAI } = require("@google/generative-ai");
const { executeWithRetry } = require('./retryHelper');

// Initialize Gemini
let genAI;
try {
    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (error) {
    console.warn("[Gemini] Initialization failed:", error.message);
}

/**
 * Analyzes the prompt using Gemini 2.5 Flash.
 */
async function analyzeWithGemini(prompt) {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    return await executeWithRetry(async (attempt) => {
        console.log(`[Gemini] Attempt ${attempt}: Calling gemini-2.5-flash...`);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        if (!text) {
            throw new Error("Empty response received from Gemini.");
        }

        const cleanJson = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        
        console.log("[Gemini] Success");
        
        // Return standard structure + confidence + source
        return {
            ...parsed,
            analysisSource: "gemini",
            confidence: "high"
        };
    });
}

module.exports = { analyzeWithGemini };
