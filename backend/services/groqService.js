const Groq = require("groq-sdk");
const { executeWithRetry } = require('./retryHelper');

let groq;
try {
    if (process.env.GROQ_API_KEY) {
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
} catch (error) {
    console.warn("[Groq] Initialization failed:", error.message);
}

async function analyzeWithGroq(prompt) {
    if (!groq) {
        throw new Error("GROQ_API_KEY is not configured.");
    }

    // Try Qwen first, then fallback to Llama 3.3
    const models = ["qwen-2.5-32b", "llama-3.3-70b-versatile"];
    let lastError = null;

    for (const model of models) {
        try {
            console.log(`[Groq] Trying model sequence: ${model}`);
            // We use executeWithRetry for each model. Let's do 2 attempts per model.
            return await executeWithRetry(async (attempt) => {
                console.log(`[Groq] Attempt ${attempt}: Calling ${model}...`);
                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are an expert technical interviewer. Only return raw JSON without markdown formatting." },
                        { role: "user", content: prompt }
                    ],
                    model: model,
                    temperature: 0.5,
                    max_tokens: 1024,
                });
                
                const text = completion.choices[0]?.message?.content;
                if (!text) {
                    throw new Error(`Empty response received from Groq (${model}).`);
                }

                const cleanJson = text.replace(/```json|```/g, "").trim();
                const parsed = JSON.parse(cleanJson);
                
                console.log(`[Groq] Success with ${model}`);
                return {
                    ...parsed,
                    analysisSource: "groq",
                    confidence: "medium-high"
                };
            }, 2);
        } catch (error) {
            console.warn(`[Groq] Model ${model} failed after retries. Error: ${error.message}`);
            lastError = error;
            // Proceeds to the next model in the sequence
        }
    }
    
    console.log("[Groq] All models in sequence failed.");
    throw lastError || new Error("Groq analysis failed.");
}

module.exports = { analyzeWithGroq };
