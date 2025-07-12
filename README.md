# StackIt - A Minimal Q&A Forum Platform

StackIt is a collaborative question-and-answer platform inspired by Stack Overflow but with a simplified, user-friendly design. It allows users to ask questions, provide answers, and share knowledge within a community.

## Features

### Core Features
- User authentication (JWT)
- Ask questions with rich text formatting
- Answer questions with rich text formatting
- Vote on questions and answers
- Tag questions for better categorization
- Accept answers as solutions
- Bookmark questions for later reference
- Follow tags and users
- Real-time notifications
- OpenAI integration for auto-generating question descriptions

### User Roles
- **Guest**: View all questions and answers
- **User**: Register, log in, post questions/answers, vote, comment
- **Admin**: Moderate content, manage tags, handle reports

## Tech Stack

### Frontend
- React with Vite
- React Router for navigation
- React Hook Form for form handling
- React Quill for rich text editing
- React Toastify for notifications
- Axios for API requests

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- OpenAI API for AI-assisted content generation

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/stackit.git
cd stackit
```

2. Install dependencies:

```
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Setup environment variables:

Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stackit
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
```

4. Start the servers:

```
# Start the backend server
cd backend
npm run dev

# Start the frontend development server
cd ../frontend
npm run dev
```

## Project Structure

### Backend
```
backend/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Custom middleware
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   └── server.js     # Entry point
└── package.json
```

### Frontend Pages

#### Authentication
- **LoginPage**: Allows users to log in with email and password
- **RegisterPage**: Allows new users to create an account

#### Question Management
- **HomePage**: Displays a list of questions with sorting and filtering options
- **QuestionDetailPage**: Shows a specific question with its answers and allows voting
- **AskQuestionPage**: Form for creating a new question with AI-assistance for generating content

#### Common
- **NotFoundPage**: Custom 404 page with helpful navigation options

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user profile

### Questions
- `GET /api/questions` - Get all questions
- `GET /api/questions/:id` - Get a single question
- `POST /api/questions` - Create a new question
- `PUT /api/questions/:id` - Update a question
- `DELETE /api/questions/:id` - Delete a question
- `POST /api/questions/:id/vote` - Vote on a question
- `POST /api/questions/:id/bookmark` - Bookmark a question

### Answers
- `GET /api/answers/question/:questionId` - Get all answers for a question
- `POST /api/answers/question/:questionId` - Create a new answer
- `PUT /api/answers/:id` - Update an answer
- `DELETE /api/answers/:id` - Delete an answer
- `POST /api/answers/:id/accept` - Accept an answer
- `POST /api/answers/:id/vote` - Vote on an answer
- `POST /api/answers/:id/comment` - Comment on an answer

### Tags
- `GET /api/tags` - Get all tags
- `GET /api/tags/:name` - Get a single tag
- `POST /api/tags/:id/follow` - Follow a tag

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/:id/follow` - Follow a user
- `GET /api/users/:username/questions` - Get user's questions
- `GET /api/users/:username/answers` - Get user's answers
- `GET /api/users/:username/bookmarks` - Get user's bookmarks

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

### AI
- `POST /api/ai/draft` - Generate a description with AI

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
