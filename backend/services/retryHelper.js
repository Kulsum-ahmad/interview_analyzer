const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithRetry(operation, maxAttempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation(attempt);
        } catch (error) {
            lastError = error;
            console.warn(`[RetryHelper] Operation failed on attempt ${attempt}: ${error.message || error}`);
            if (attempt < maxAttempts) {
                // attempt 1 -> wait 1 sec, attempt 2 -> wait 2 sec
                const delay = attempt === 1 ? 1000 : 2000;
                console.log(`[RetryHelper] Waiting ${delay}ms before retrying...`);
                await wait(delay);
            }
        }
    }
    throw lastError;
}

module.exports = { executeWithRetry };
