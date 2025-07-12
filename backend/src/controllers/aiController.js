const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Controller for generating question descriptions with AI
exports.generateDescription = async (req, res) => {
  try {
    const { title, tags } = req.body;

    if (!title || !tags || tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title and at least one tag',
      });
    }

    // Format tags for the prompt
    const tagNames = Array.isArray(tags) 
      ? tags.map(tag => typeof tag === 'object' ? tag.name : tag).join(', ') 
      : tags;

    // Create the system prompt
    const systemPrompt = 
      "You are a helpful assistant. Write a clear, 2-paragraph, richly formatted description for a programming Q&A site. Use the title and tags as context.";

    // Generate description
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // or your chosen model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Title: ${title}\nTags: ${tagNames}\nGenerate a detailed question description with formatting.` }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    // Extract the response
    const generatedDescription = completion.choices[0].message.content;

    res.status(200).json({
      success: true,
      description: generatedDescription,
    });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating description',
      error: error.message,
    });
  }
};
