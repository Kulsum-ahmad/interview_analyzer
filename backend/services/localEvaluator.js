const keywordMaps = {
    'Software Engineer': ['algorithm', 'data structure', 'process', 'thread', 'memory', 'solid', 'design pattern', 'oop', 'git', 'testing'],
    'Frontend Developer': ['react', 'javascript', 'typescript', 'css', 'html', 'component', 'state', 'props', 'hooks', 'api', 'dom', 'virtual dom'],
    'Backend Developer': ['server', 'database', 'api', 'authentication', 'jwt', 'cache', 'scalability', 'microservice', 'sql', 'nosql', 'node', 'express'],
    'Full Stack Engineer': ['frontend', 'backend', 'api', 'database', 'react', 'node', 'component', 'server', 'jwt', 'state'],
    'Mobile Engineer': ['ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'activity', 'view', 'lifecycle', 'state', 'mobile'],
    'DevOps Engineer': ['ci/cd', 'docker', 'kubernetes', 'infrastructure', 'iac', 'terraform', 'aws', 'pipeline', 'gitops', 'monitoring'],
    'Cloud Architect': ['aws', 'ec2', 's3', 'lambda', 'docker', 'kubernetes', 'networking', 'vpc', 'scaling', 'iam', 'serverless'],
    'AI / Machine Learning Engineer': ['model', 'training', 'dataset', 'neural network', 'overfitting', 'bias', 'deep learning', 'pytorch', 'tensorflow', 'regression'],
    'Data Scientist': ['statistics', 'python', 'pandas', 'machine learning', 'regression', 'clustering', 'pca', 'visualization', 'a/b testing', 'data'],
    'Cyber Security Analyst': ['vulnerability', 'xss', 'sql injection', 'encryption', 'firewall', 'mfa', 'authentication', 'threat', 'security', 'malware'],
    'Database Administrator (DBA)': ['index', 'normalization', 'replication', 'acid', 'transaction', 'deadlock', 'backup', 'query', 'nosql', 'rdbms'],
    'Embedded Systems Engineer': ['c', 'c++', 'microcontroller', 'interrupt', 'rtos', 'spi', 'i2c', 'memory', 'hardware', 'uart'],
    'Game Developer': ['engine', 'unity', 'unreal', 'c#', 'c++', 'rendering', 'shader', 'physics', 'frame', 'collision'],
    'Blockchain Developer': ['smart contract', 'ethereum', 'solidity', 'consensus', 'proof of work', 'proof of stake', 'gas', 'evm', 'web3', 'decentralized'],
    'QA Automation Engineer': ['selenium', 'cypress', 'playwright', 'testing', 'automation', 'unit test', 'integration', 'e2e', 'pom', 'regression'],
    'Network Engineer': ['tcp', 'udp', 'ip', 'dns', 'bgp', 'router', 'subnet', 'nat', 'firewall', 'osi', 'latency']
};

function analyzeWithLocal(currentAnswer, jobRole) {
    console.log("[Local Evaluator] Activated.");

    // 1. Gibberish Detection
    const gibberishRegex = /^([a-zA-Z])\1{4,}$|^[qwertyuiopasdfghjklzxcvbnm]{5,}$|^\d+$/i;
    const cleanAnswer = currentAnswer.trim();
    const noVowels = !/[aeiou]/i.test(cleanAnswer);
    
    if (cleanAnswer.length < 5 || gibberishRegex.test(cleanAnswer) || (cleanAnswer.length > 10 && noVowels)) {
        console.log("[Local Evaluator] Detected gibberish.");
        return {
            score: "0/10",
            fillerWordAnalysis: "N/A",
            technicalFeedback: "Response appears invalid or does not contain meaningful language.",
            improvedVersion: "Please provide a complete and meaningful answer to the interview question.",
            analysisSource: "local",
            confidence: "low"
        };
    }

    // 2. Filler Word Detection
    const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know'];
    let fillerCount = 0;
    const words = cleanAnswer.toLowerCase().split(/\s+/);
    
    words.forEach(w => {
        const clean = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        if (fillers.includes(clean)) fillerCount++;
    });
    
    const youKnowCount = (cleanAnswer.toLowerCase().match(/you know/g) || []).length;
    fillerCount += youKnowCount;

    let fillerFeedback = "";
    if (fillerCount === 0) {
        fillerFeedback = "Excellent pacing. No major filler words detected.";
    } else if (fillerCount <= 2) {
        fillerFeedback = `Good pacing. Only noticed ${fillerCount} minor filler word(s).`;
    } else {
        fillerFeedback = `Pacing can be improved. Detected ${fillerCount} filler words. Practice brief pauses instead.`;
    }

    // 3. Technical Keyword Matching
    const roleKeywords = keywordMaps[jobRole] || [];
    let keywordHits = 0;
    roleKeywords.forEach(kw => {
        if (cleanAnswer.toLowerCase().includes(kw)) keywordHits++;
    });

    // 4. Structure Analysis
    const wordCount = words.length;
    let baseScore = 4; // minimum score for valid text
    
    if (wordCount >= 20) baseScore += 1;
    if (wordCount >= 40) baseScore += 1;
    
    if (keywordHits > 0) baseScore += 1;
    if (keywordHits >= 3) baseScore += 1;

    if (fillerCount === 0) baseScore += 1;
    else if (fillerCount > 3) baseScore -= 1;

    // Cap the local score at 8/10 as requested
    let finalScore = Math.min(Math.max(baseScore, 1), 8);

    // 5. Generate generic technical feedback and improved version
    let technicalFeedback = `You provided a ${wordCount < 20 ? 'brief' : 'detailed'} response. `;
    if (keywordHits > 0) {
        technicalFeedback += `You successfully mentioned relevant concepts for a ${jobRole}. `;
    } else {
        technicalFeedback += `Consider incorporating more role-specific terminology to strengthen your answer. `;
    }

    const improvedVersion = `Expand your answer by explaining:\n1. The core concept\n2. Why it is used\n3. A real-world example\n4. Any technical trade-offs`;

    console.log("[Local Evaluator] Success. Score capped at 8.");

    return {
        score: `${finalScore}/10`,
        fillerWordAnalysis: fillerFeedback,
        technicalFeedback: technicalFeedback.trim(),
        improvedVersion: improvedVersion,
        analysisSource: "local",
        confidence: "low"
    };
}

module.exports = { analyzeWithLocal };
