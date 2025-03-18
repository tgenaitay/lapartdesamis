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


## Wine Selection Logic 🍇

Our selection process works in 3 clear phases:

1. **Initial filtering**  
   We first look for up to 20 wines that may match :
   - Preferred regions (e.g. Burgundy/Provence)
   - Specific appellations (e.g. Meursault)
   - Favorite domains/châteaux
   - Price range preferences

   If the initial search is not returning 20 results, e.g if user entered a specific domain but no regions, we broaden the search without filters except for price.

2. **Scoring**  
   Each wine earns points based on:
   - **Color priority**: 4x points for 1st choice color, 3x for 2nd, etc, with a factor of 10
   - **Taste match**: Matches wine characteristics to user preferences  
     *(e.g. "Fruity reds" get boosted if user prefers fruity flavors)*
   - **Quality score**: Wine is Mine internal rating (note_wim) gives bonus points, with a factor of 10

3. **Final selection**  
   - Top 20 potential matches are identified
   - These are re-ranked by total score
   - Final selection shows the 10 highest-scoring wines

This ensures recommendations balance personal preferences with best in class wines.