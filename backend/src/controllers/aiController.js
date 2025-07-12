const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize OpenAI API (only if valid key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

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

    // Check if OpenAI is available
    if (!openai) {
      // Fallback: Generate a simple template description
      const tagNames = Array.isArray(tags) 
        ? tags.map(tag => typeof tag === 'object' ? tag.name : tag).join(', ') 
        : tags;

      const fallbackDescription = `This question is about **${title}** and relates to the following technologies: ${tagNames}.

Please provide a detailed description of your problem, including:
- What you've tried so far
- The expected behavior
- The actual behavior you're experiencing
- Any error messages you've encountered
- Relevant code snippets (if applicable)

The more details you provide, the better the community can help you solve your problem.`;

      return res.status(200).json({
        success: true,
        description: fallbackDescription,
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
    
    // Fallback in case of API error
    const { title, tags } = req.body;
    const tagNames = Array.isArray(tags) 
      ? tags.map(tag => typeof tag === 'object' ? tag.name : tag).join(', ') 
      : tags;

    const fallbackDescription = `This question is about **${title}** and relates to the following technologies: ${tagNames}.

Please provide a detailed description of your problem, including:
- What you've tried so far
- The expected behavior
- The actual behavior you're experiencing
- Any error messages you've encountered
- Relevant code snippets (if applicable)

The more details you provide, the better the community can help you solve your problem.`;

    res.status(200).json({
      success: true,
      description: fallbackDescription,
    });
  }
};
