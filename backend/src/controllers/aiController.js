const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Google Generative AI
let genAI = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('AIzaSy')) {
  genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);
  console.log('✅ Google Generative AI initialized');
} else {
  console.warn('⚠️ Google Generative AI not initialized - invalid or missing API key');
}

// Controller to generate AI-powered question descriptions
exports.generateDescription = async (req, res) => {
  console.log('\n=== AI Description Generation ===');

  try {
    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a question title',
      });
    }

    const fallbackDescription = `This question is about **${title}**.

Please describe your issue in detail, including:
- What you're trying to achieve
- What you've tried so far
- What results you're getting
- Any specific challenges or errors
- Relevant code snippets or examples

A clear, detailed question will help others provide better answers.`;

    if (!genAI) {
      return res.status(200).json({
        success: true,
        description: fallbackDescription,
      });
    }

    const prompt = `
    You are an AI assistant on a developer Q&A site like Stack Overflow.

    A developer asked: **"${title}"**

    Write a full markdown-formatted description from the person asking. The description should:
    - Be 2–3 paragraphs
    - Explain the technical question or problem in detail
    - Sound like a real person explaining what they've tried and what they're struggling with
    - Use markdown formatting with at least one heading, bold text, and maybe bullet points
    - Include relevant technical details based on the question topic
    - Ask for specific help or guidance

    Generate only the markdown description as if the developer wrote it.
    `;

    try {
      console.log('⏳ Generating content using Gemini...');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedDescription = response.text();

      console.log('✅ AI Description Generated');
      return res.status(200).json({
        success: true,
        description: generatedDescription,
      });
    } catch (aiError) {
      console.error('❌ Gemini AI Error:', aiError.message);
      return res.status(200).json({
        success: true,
        description: fallbackDescription,
      });
    }
  } catch (error) {
    console.error('❌ Controller Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate description',
      description: fallbackDescription,
    });
  }
};
