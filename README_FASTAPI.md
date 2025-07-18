# 🧾 Receipts App - FastAPI + Streamlit

A receipt management application with FastAPI backend and Streamlit frontend.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip

### Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   APP_KEY=your-secret-key-here
   JWT_KEY=your-jwt-secret-here
   DATABASE_URL=your-database-url
   OPENAI_API_KEY=your-openai-key
   ```

3. **Run the application:**
   ```bash
   # Option 1: Use the Python script (recommended)
   python run_app.py
   
   # Option 2: Use the bash script
   ./run_app.sh
   
   # Option 3: Run manually
   # Terminal 1: FastAPI server
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2: Streamlit app
   streamlit run streamlit_app.py --server.port 8501
   ```

4. **Access the applications:**
   - 📱 **Streamlit App**: http://localhost:8501
   - 📡 **FastAPI Server**: http://localhost:8000
   - 📖 **API Documentation**: http://localhost:8000/docs

## 📱 Features

### Authentication
- JWT token-based authentication
- Secure login/logout
- Session management

### In-Store Scanner
- Camera input for capturing product images
- Image processing and analysis
- Real-time feedback

### Receipt Scanner
- Receipt image capture
- OCR and data extraction
- Structured data output

### Chat Assistant
- AI-powered chat interface
- Query receipt data
- Natural language responses

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/token/refresh` - Refresh JWT token

### Receipts
- `GET /receipts/authenticated` - Check authentication
- `POST /receipts/upload_receipt` - Upload receipt image
- `POST /receipts/upload_in_store` - Upload in-store item image
- `POST /receipts/save_in_store` - Save processed item data
- `POST /receipts/chat` - Chat with AI assistant

## 🛠️ Development

### Project Structure
```
├── main.py                 # FastAPI application entry point
├── streamlit_app.py        # Streamlit frontend
├── run_app.py             # Python script to run both servers
├── run_app.sh             # Bash script to run both servers
├── requirements.txt       # Python dependencies
├── src/
│   ├── auth/
│   │   └── routes.py      # Authentication routes
│   ├── receipts/
│   │   ├── routes.py      # Receipt processing routes
│   │   ├── services/      # Business logic
│   │   └── models/        # Data models
│   ├── services/          # Shared services
│   ├── utilities/         # Utility functions
│   └── config.py          # Configuration
└── README.md
```

### Key Changes from Flask
- **Framework**: Flask → FastAPI
- **Authentication**: Cookie-based → JWT header-based
- **Validation**: Manual → Pydantic models
- **Documentation**: Manual → Auto-generated OpenAPI
- **Frontend**: HTML/CSS/JS → Streamlit

## 🔐 Security Notes

- JWT tokens are stored in Streamlit session state
- Tokens are passed in Authorization headers
- HTTPS recommended for production
- Configure CORS properly for production

## 📝 TODO

- [ ] Add proper error handling
- [ ] Implement token refresh logic
- [ ] Add database migrations
- [ ] Add tests
- [ ] Add Docker support
- [ ] Add production configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
