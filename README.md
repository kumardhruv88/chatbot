# AI Chatbot with RAG & Web Search 🤖

A production-ready conversational AI application built with FastAPI, React, LangChain, and Groq. Features include document upload with RAG (Retrieval Augmented Generation), real-time web search, streaming responses, and conversation thread management.

## ✨ Features

### Core Functionality
- **💬 Real-time Chat Interface** - Clean, intuitive UI with streaming token-by-token responses
- **📚 RAG System** - Upload and chat with your documents (PDF, TXT, DOCX, MD)
- **🔍 Web Search Integration** - Get real-time information from the web via Tavily API
- **🧵 Thread Management** - Create, manage, and switch between multiple conversations
- **📝 Source Citations** - Clear display of documents and web sources used in responses
- **⚡ Streaming Responses** - See AI responses appear in real-time
- **💾 Persistent Storage** - All conversations and documents saved in SQLite database

### Technical Highlights
- **Modern Tech Stack** - FastAPI + React + Vite + Tailwind CSS
- **LLM Integration** - Groq API with LangChain for fast, efficient responses
- **Vector Database** - Chroma DB for semantic document search
- **Document Processing** - Automated text extraction and chunking
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Error Handling** - Graceful fallbacks and user-friendly error messages

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework
- **LangChain** - LLM orchestration and RAG
- **Groq API** - Ultra-fast LLM inference (llama-3.1-70b)
- **Chroma DB** - Vector database for embeddings
- **SQLAlchemy** - Database ORM
- **SQLite** - Lightweight, file-based database
- **Tavily API** - AI-optimized web search
- **Sentence Transformers** - Text embeddings

### Frontend
- **React 18** - UI library
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client
- **React Markdown** - Markdown rendering
- **Lucide React** - Beautiful icons
- **date-fns** - Date formatting

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **npm or yarn**
- **Groq API Key** (free at [console.groq.com](https://console.groq.com))
- **Tavily API Key** (free at [tavily.com](https://tavily.com))

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd chatbot
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
DATABASE_URL=sqlite:///./chatbot.db
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CHROMA_PERSIST_DIR=./chroma_db
```

#### Get API Keys

**Groq API Key:**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys
4. Create a new API key
5. Copy and paste into `.env`

**Tavily API Key:**
1. Visit [tavily.com](https://tavily.com)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Copy and paste into `.env`

### 3. Frontend Setup

```bash
cd frontend
npm install
cd ..
```

### 4. Run the Application

#### Start Backend (Terminal 1)

```bash
python -m uvicorn backend.main:app --reload
```

The backend will start at `http://localhost:8000`

#### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

The frontend will start at `http://localhost:5173`

### 5. Access the Application

Open your browser and navigate to `http://localhost:5173`

## 📁 Project Structure

```
chatbot/
│
├── backend/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Configuration management
│   ├── database.py              # Database setup
│   ├── models/
│   │   ├── __init__.py
│   │   └── thread.py           # SQLAlchemy models
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── thread.py           # Pydantic schemas
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── threads.py          # Thread management endpoints
│   │   ├── chat.py             # Chat streaming endpoint
│   │   └── documents.py        # Document upload endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── document_processor.py  # Document extraction & chunking
│   │   ├── rag_service.py         # Vector search & retrieval
│   │   ├── search_service.py      # Web search integration
│   │   └── llm_service.py         # LLM chat completions
│   └── utils/
│       └── __init__.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         # Thread list sidebar
│   │   │   ├── ChatInterface.jsx   # Main chat container
│   │   │   ├── MessageList.jsx     # Message display
│   │   │   └── MessageInput.jsx    # Message input with streaming
│   │   ├── services/
│   │   │   └── api.js             # API client
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── .env                         # Environment variables (create from .env.example)
├── .env.example                 # Environment template
├── .gitignore
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

## 💾 Database Schema

### Threads Table
Stores conversation threads with metadata
- `id` - Primary key
- `title` - Thread name
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `metadata` - JSON metadata

### Messages Table
Stores chat messages with source citations
- `id` - Primary key
- `thread_id` - Foreign key to threads
- `role` - 'user' or 'assistant'
- `content` - Message text
- `sources` - JSON array of source citations
- `timestamp` - Message timestamp

### Documents Table
Tracks uploaded documents
- `id` - Primary key
- `thread_id` - Foreign key to threads
- `filename` - Original filename
- `file_path` - Stored file path
- `file_type` - File extension
- `upload_date` - Upload timestamp

**Schema Design Rationale:**
- SQLite chosen for simplicity and portability
- Thread-centric design for conversation isolation
- CASCADE DELETE ensures clean data removal
- JSON fields for flexible metadata storage

## 🎯 Usage Guide

### Creating a New Conversation
1. Click "New Chat" in the sidebar
2. Enter a conversation title
3. Start chatting!

### Uploading Documents
1. Select a thread
2. Click "Upload Document"
3. Choose a file (PDF, TXT, DOCX, or MD)
4. Wait for processing
5. Ask questions about the document

### Enabling Web Search
1. Toggle "Enable web search" before sending a message
2. The AI will search the web for current information
3. Sources will be displayed below the response

### Managing Threads
- Click a thread to switch to it
- Hover over a thread and click the trash icon to delete
- Thread title can be updated via the API

## 🧪 Testing

### API Endpoints

Test backend endpoints using curl:

```bash
# Health check
curl http://localhost:8000/health

# Create thread
curl -X POST http://localhost:8000/api/threads \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Thread"}'

# List threads
curl http://localhost:8000/api/threads

#Upload document
curl -X POST http://localhost:8000/api/documents/upload \
  -F "file=@test.pdf" \
  -F "thread_id=1"

# Send chat message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","thread_id":1,"enable_search":false}'
```

### RAG System Test
1. Upload a PDF document
2. Ask specific questions about its content
3. Verify correct chunks are retrieved
4. Check source citations appear

### Web Search Test
1. Enable web search toggle
2. Ask about current events
3. Verify Tavily sources appear

## 🚀 Deployment (Optional)

### Backend Deployment (Render, Railway, or Fly.io)
1. Create account on your chosen platform
2. Connect GitHub repository
3. Add environment variables
4. Deploy from `backend/` directory
5. Set start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment (Vercel or Netlify)
1. Build frontend: `cd frontend && npm run build`
2. Deploy `frontend/dist` directory
3. Update API base URL in `frontend/src/services/api.js`

## 🎨 Design Decisions

### Why FastAPI?
- Excellent async support for streaming
- Automatic OpenAPI documentation at `/docs`
- Type hints and validation
- Fast performance

### Why Groq?
- Extremely fast inference (important for streaming)
- Free tier available
- Uses open-source models like LLama 3.1

### Why Chroma DB?
- Easy to set up (embedded mode)
- No separate server needed
- Good performance for moderate document volumes
- Persistent storage

### Why SQLite?
- Simple deployment (single file)
- No database server needed
- Sufficient for small-to-medium scale
- Easy to backup and migrate

## 🐛 Troubleshooting

### Backend won't start
- Check `.env` file exists and has valid API keys
- Ensure Python 3.8+ is installed
- Run `pip install -r requirements.txt` again

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check CORS settings in `backend/main.py`
- Ensure API_BASE_URL in `frontend/src/services/api.js` is correct

### Document upload fails
- Check file size < 10MB
- Verify file type is supported
- Ensure `uploads/` directory exists

### Streaming doesn't work
- Check browser console for errors
- Verify fetch API is supported
- Test backend endpoint directly with curl

## 📝 Future Enhancements

- [ ] User authentication and multi-user support
- [ ] Custom LLM model selection
- [ ] Image and video upload support
- [ ] Export conversation history
- [ ] Advanced search and filtering
- [ ] Deployment guides for major platforms
- [ ] Docker containerization
- [ ] Integration tests and CI/CD

## 📄 License

MIT License - feel free to use this project for your internship assignment and beyond!

## 👨‍💻 Author

Built as part of the Fyora.ai Internship Assignment

---

**Note:** This is a demonstration project showcasing modern AI application development practices. API keys should never be committed to version control. Always use environment variables in production.