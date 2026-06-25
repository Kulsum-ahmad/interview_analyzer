const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { analyzeWithGemini } = require('./services/geminiService');
const { analyzeWithGroq } = require('./services/groqService');
const { analyzeWithLocal } = require('./services/localEvaluator');

const app = express();
app.use(cors());
app.use(express.json());

// Local backup data for fallback questions
const fallbackQuestions = {
    'Software Engineer': [
        "Explain the difference between a process and a thread, and when you would use one over the other.",
        "What is the difference between SQL and NoSQL databases, and how do you choose between them?",
        "Can you describe how garbage collection works in a language of your choice?",
        "What are the SOLID design principles, and why are they important in object-oriented programming?",
        "How do you approach debugging a memory leak in a large application?"
    ],
    'Frontend Developer': [
        "What is the difference between state and props in React, and how does the virtual DOM work?",
        "Can you explain the box model in CSS and the difference between content-box and border-box?",
        "What is event delegation in JavaScript, and how does event bubbling work?",
        "How do you optimize a web application's performance to improve Core Web Vitals?",
        "Explain the difference between local storage, session storage, and cookies."
    ],
    'Backend Developer': [
        "How do you secure a RESTful API and handle user authentication safely?",
        "Explain the concept of database indexing. How does it speed up queries and what are the trade-offs?",
        "What is horizontal vs vertical scaling, and how do you design a system for horizontal scaling?",
        "What is the difference between synchronous and asynchronous operations, and when would you use a message queue?",
        "How do you handle database migrations and database concurrency issues in a distributed system?"
    ],
    'Full Stack Engineer': [
        "How do you secure a RESTful API and handle user authentication safely?",
        "What is the difference between state and props in React, and how does the virtual DOM work?",
        "What is the difference between SQL and NoSQL databases, and how do you choose between them?",
        "How do you optimize a web application's performance to improve Core Web Vitals?",
        "What is horizontal vs vertical scaling, and how do you design a system for horizontal scaling?"
    ],
    'Mobile Engineer': [
        "What are the core lifecycle methods of an Activity in Android or View in iOS?",
        "Explain the difference between model-view-controller (MVC) and model-view-viewmodel (MVVM) architectures.",
        "How do you optimize mobile app battery and network utilization when fetching remote data?",
        "What is the difference between reactive programming and imperative programming in mobile development?",
        "How do you handle local data persistence and offline synchronization in a mobile application?"
    ],
    'DevOps Engineer': [
        "What is Infrastructure as Code (IaC) and how does it fit into a CI/CD pipeline?",
        "Can you explain the difference between a container (like Docker) and a virtual machine?",
        "How do you approach blue-green deployments vs canary releases?",
        "What is GitOps, and how does it compare to traditional push-based deployment pipelines?",
        "How do you monitor application health and collect logs across a cluster of servers?"
    ],
    'Cloud Architect': [
        "What is serverless computing, and what are its pros and cons compared to VM instances?",
        "How do you design a highly-available, multi-region architecture in the cloud?",
        "What is the principle of least privilege, and how do you implement IAM controls?",
        "Can you explain the difference between object storage, block storage, and file storage?",
        "How do you optimize cloud resource utilization and reduce monthly billing costs?"
    ],
    'AI / Machine Learning Engineer': [
        "Can you explain the difference between overfitting and underfitting, and how to mitigate them?",
        "What is the difference between supervised, unsupervised, and reinforcement learning?",
        "How does backpropagation work in neural networks?",
        "What metrics would you use to evaluate a classification model with highly imbalanced classes?",
        "Explain the difference between L1 and L2 regularization."
    ],
    'Data Scientist': [
        "Explain how a random forest classifier works and how you would evaluate its performance.",
        "What is the Central Limit Theorem, and why is it important in statistics?",
        "How do you handle missing values or outliers in a dataset before modeling?",
        "What is the difference between A/B testing and multivariate testing?",
        "Explain the concept of dimensionality reduction and how PCA works."
    ],
    'Cyber Security Analyst': [
        "What is a SQL injection vulnerability and how do you protect an application from it?",
        "Can you explain the difference between symmetric and asymmetric encryption?",
        "What is a Cross-Site Scripting (XSS) attack, and how do you mitigate it?",
        "What are the steps of the cyber kill chain or incident response life cycle?",
        "How does a multi-factor authentication (MFA) system work securely?"
    ],
    'Database Administrator (DBA)': [
        "What is database normalization, and when might you choose to denormalize a database?",
        "Explain the difference between clustered and non-clustered indexes.",
        "How do you configure and manage database replication for high availability?",
        "What are ACID transactions, and how does a relational database enforce them?",
        "How do you diagnose and resolve deadlocks in SQL database transactions?"
    ],
    'Embedded Systems Engineer': [
        "Explain the concept of an interrupt in embedded systems and how you manage ISRs.",
        "What is a watchdog timer, and how is it used to recover from system crashes?",
        "What is the difference between volatile, non-volatile, and const variables in embedded C?",
        "How do SPI, I2C, and UART serial communication protocols differ in usage?",
        "What is a real-time operating system (RTOS) and when is it required over bare-metal programming?"
    ],
    'Game Developer': [
        "What is a game loop and how does frame rate independent movement work?",
        "Explain the difference between axis-aligned bounding box (AABB) and bounding sphere collision detection.",
        "How do you optimize rendering performance in a 3D game engine?",
        "What is object pooling, and how does it prevent garbage collection spikes in games?",
        "Explain the concept of shader programs and the difference between vertex and fragment shaders."
    ],
    'Blockchain Developer': [
        "Explain the consensus mechanism of Proof of Work vs. Proof of Stake.",
        "What is a smart contract, and how does the Ethereum Virtual Machine (EVM) execute it?",
        "What are reentrancy attacks in solidity, and how do you prevent them?",
        "What is the difference between a public blockchain and a private blockchain?",
        "Explain the concept of gas fees and how transactions are prioritized on a blockchain network."
    ],
    'QA Automation Engineer': [
        "What is the difference between unit testing, integration testing, and end-to-end testing?",
        "What is page object model (POM) pattern in automated UI testing?",
        "How do you handle dynamic loading elements and waits in Selenium/Playwright scripts?",
        "What is regression testing, and how do you select test cases for automation?",
        "Explain the concept of parameterized testing and data-driven automation frameworks."
    ],
    'Network Engineer': [
        "What happens when you type google.com into your browser? Explain the DNS lookup process.",
        "Explain the difference between TCP and UDP protocols and when to use each.",
        "What is subnetting, and how do you calculate the network range for a CIDR block?",
        "How does the Border Gateway Protocol (BGP) routing work across the internet?",
        "What is the purpose of NAT (Network Address Translation) and how does it solve IPv4 address exhaustion?"
    ]
};

const defaultFallbackQuestions = [
    "What is your approach to learning a new programming language or technology stack?",
    "Can you describe a challenging technical project you worked on and how you resolved the obstacles?",
    "How do you ensure code quality and maintainability in a team-based engineering environment?",
    "Explain the concept of version control (like Git) and how you resolve merge conflicts.",
    "What are design patterns, and can you explain one that you have used in your past projects?"
];

function getLocalFallbackQuestion(jobRole, roundNumber) {
    const list = fallbackQuestions[jobRole] || defaultFallbackQuestions;
    const index = (roundNumber - 1) % list.length;
    return list[index];
}

// START MULTI-ROUND INTERVIEW
app.post('/api/interview/start', async (req, res) => {
    const { jobRole, difficulty } = req.body;

    const prompt = `
    You are an expert technical interviewer. Start a mock interview for a candidate applying for a ${difficulty}-level ${jobRole} position.
    Greet the candidate briefly (1 sentence) and ask the first, realistic, and specific technical or situational interview question suitable for their role and experience level.
    
    Provide your response strictly in this JSON format:
    {
      "question": "The greeting and interview question here"
    }`;

    try {
        const data = await analyzeWithGemini(prompt);
        res.json(data);
    } catch (geminiError) {
        console.warn("[Waterfall] Gemini failed on start:", geminiError.message);
        try {
            const data = await analyzeWithGroq(prompt);
            res.json(data);
        } catch (groqError) {
            console.warn("[Waterfall] Groq failed on start:", groqError.message);
            // Local fallback for start question
            const firstQuestion = getLocalFallbackQuestion(jobRole, 1);
            res.json({
                question: `Hello! Welcome to your mock interview. Let's get started. ${firstQuestion}`
            });
        }
    }
});

// RESPOND TO INTERVIEW QUESTION & GET NEXT QUESTION
app.post('/api/interview/respond', async (req, res) => {
    const { jobRole, difficulty, currentQuestion, currentAnswer, chatHistory, currentRound, totalRounds } = req.body;

    const isFinalRound = currentRound >= totalRounds;

    const prompt = `
    You are an expert technical interviewer for a ${difficulty}-level ${jobRole} position.
    
    You asked the candidate: "${currentQuestion}"
    The candidate responded: "${currentAnswer}"
    
    Here is the history of the conversation so far for context:
    ${JSON.stringify(chatHistory || [])}
    
    Tasks:
    1. Analyze the candidate's answer for this round. Be critical but constructive.
    2. Assess pacing and filler words (e.g., 'um', 'uh', 'like', 'basically', 'actually', 'you know'). Identify specific filler words they used.
    3. Rate the candidate's answer out of 10.
    4. Provide a polished, professional, industry-standard rewrite/rephrasing of their answer.
    5. ${isFinalRound ? 'Generate a final, comprehensive overall performance summary including core strengths and areas to work on.' : 'Formulate a follow-up question based on their answer (to dive deeper into a technology or concept they mentioned) or, if the topic is exhausted, transition to a new relevant topic.'}
    
    Provide your response strictly in this JSON format:
    {
      "analysis": {
        "score": "X/10 (where X is a number)",
        "fillerWordAnalysis": "Feedback on pacing and specific filler words identified",
        "technicalFeedback": "Constructive feedback on accuracy, completeness, and structure",
        "improvedVersion": "A polished, strong response"
      },
      "isEnded": ${isFinalRound},
      "nextQuestion": ${isFinalRound ? 'null' : '"The next question text here"'},
      "overallSummary": ${isFinalRound ? '"A detailed summary of the entire interview performance, highlighting overall strengths, key gaps in knowledge, and action items for improvement."' : 'null'}
    }`;

    try {
        const data = await analyzeWithGemini(prompt);
        res.json(data);
    } catch (geminiError) {
        console.warn("[Waterfall] Gemini failed on respond:", geminiError.message);
        try {
            const data = await analyzeWithGroq(prompt);
            res.json(data);
        } catch (groqError) {
            console.warn("[Waterfall] Groq failed on respond:", groqError.message);
            // Local Fallback Evaluator
            const localAnalysis = analyzeWithLocal(currentAnswer, jobRole);
            
            res.json({
                analysis: {
                    score: localAnalysis.score,
                    fillerWordAnalysis: localAnalysis.fillerWordAnalysis,
                    technicalFeedback: localAnalysis.technicalFeedback,
                    improvedVersion: localAnalysis.improvedVersion
                },
                isEnded: isFinalRound,
                nextQuestion: isFinalRound ? null : getLocalFallbackQuestion(jobRole, currentRound + 1),
                overallSummary: isFinalRound ? "Local Analysis Summary: You demonstrated solid knowledge across the rounds. Ensure you practice technical depth and eliminate pauses to project maximum confidence. (System fallback report)" : null,
                analysisSource: localAnalysis.analysisSource,
                confidence: localAnalysis.confidence
            });
        }
    }
});

app.listen(5002, () => console.log('Backend running on port 5002'));