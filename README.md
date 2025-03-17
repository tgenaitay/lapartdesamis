# Wine is Mine 🇫🇷🍷

A web application to query tastes from wine enthusiasts, and fetch a selection of great wines from our catalog. Featuring server-side data transformation through Llama 3.3, and a function call to Supabase.

## Project Structure

```
├── public/           # Static frontend assets
│   ├── index.html    # Main entry page
│   └── results.html  # Results display page
├── server/           # Backend server
│   ├── services/     # Server services
│   │   ├── llm.js    # LLM service implementation
│   │   └── storage.js # Storage service implementation
│   └── server.js     # Main server implementation
└── vercel.json       # Vercel deployment configuration
```

## Features

- Server-side processing with Node.js
- Static file serving for frontend assets
- LLM integration for intelligent processing
- Data storage functionality

## Prerequisites

- Node.js
- npm

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd server
   npm install
   ```
3. Create a `.env` file in the root directory with required environment variables

```
TOGETHER_API_KEY=xx
SUPABASE_URL=xx
SUPABASE_KEY=xx
```

## Development

To run the development server:

```bash
cd server
npm start
```

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` configuration handles:
- Node.js server deployment
- Static file serving
- Route configurations

To deploy:
1. Install Vercel CLI
2. Install environment variables in Vercel settings
3. Run `vercel --prod` in the project root

https://wine-is-mine.vercel.app/

All feedback welcome.