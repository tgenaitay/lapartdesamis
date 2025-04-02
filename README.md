# La Part des Amis 🇫🇷🍷

A web application to query tastes from wine enthusiasts, and fetch a selection of great wines from our catalog.
Currently using Together AI's free endpoint for consuming Llama 3.3.

## Features

- Server-side processing with Node.js
- Static file serving for frontend assets
- LLM integration for intelligent transformation of user input into filters
- Function call to Supabase for querying best wines
- Scoring based on user's preferences and WIM notes
- Data storage all in Supabase

## Prerequisites

- Node.js
- npm
- Supabase
- Wine data :) 

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
RESEND_API_KEY=
NOTIFICATION_EMAIL=
SENDER_EMAIL=
```

## Development

To run the development server (nodemon used for hot reload):

```bash
cd server
npm run dev
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

## Database

```sql
create table public.wines (
  id serial not null,
  region text not null,
  appellation text not null,
  domaine_chateau text not null,
  couleur text not null,
  cepage_dominant text not null,
  conduite text not null,
  rouge_fruite integer null,
  rouge_epice integer null,
  rouge_boise integer null,
  rouge_tannique integer null,
  blanc_fruite integer null,
  blanc_mineral integer null,
  blanc_beurre integer null,
  blanc_boise integer null,
  blanc_sucrosite integer null,
  debut_apogee integer not null,
  fin_apogee integer not null,
  note_wim integer not null,
  prix double precision not null,
  gamme_prix text not null,
  constraint wines_pkey primary key (id)
) TABLESPACE pg_default;

create table public.forms (
  id uuid not null default extensions.uuid_generate_v4 (),
  form_data jsonb not null,
  llm_selection jsonb not null,
  submitted_at timestamp with time zone not null default now(),
  constraint forms_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists forms_submitted_at_idx on public.forms using btree (submitted_at desc) TABLESPACE pg_default;

```


## Demo

https://wine-is-mine.vercel.app/

All feedback welcome.

## Known issues

- Llama 3.3 randomly outputs a malformed native function call in its content instead of a regular tool call. Happens 1 out of 5 times.

## Wine Selection Logic 🍇

Our selection process works in 3 clear phases:

1. **Initial filtering**  
   
   We first look for up to 20 wines that may match filters:
   - Preferred regions (e.g. Burgundy/Provence)
   - Specific appellations (e.g. Meursault)
   - Favorite domains/châteaux
   - Budget range

   If the initial search resulted to less than 10 wines, or if the connoisseurs let us broaden their regional horizons, we run a second query without any filters (except for price min and max).

   NB to avoid missing great opportunities, we lower the minimum wine price by 10EUR compared to the budget given by user.

2. **Scoring**  
   Each wine found in our initial search is earning points based on:
   - **1. Color priority**: 4x points for 1st choice color, 3x for 2nd, etc, multiple by a factor of 10. This is the basis of the score.
      *(e.g. 40 points for red, 30 points for white...)*
   - **2. Taste match**: Multiplying user's choice with wine data.  
     *(e.g. "Red fruity wines at 5" get boosted +25 points if user responded liking fruity flavors 5/5)*
   - **3. Quality score**: Internal rating (note_wim) multipled by a factor of 5.
      *(e.g. A wine with a WIM note of 10 will get +50 points)*
   - **4. Methodology match**: Matches wine production method to user preferences
     *(e.g. "Biodynamic" wines get additional +20 points for high preference 4/5)*,

3. **Final selection**  
   - A shortlist of up to 20 potential wines are identified by search
   - The list gets scored and re-ranked accordingly
   - Final selection cuts to only the 10 highest-scoring wines from our short list

This ensures recommendations balance personal preferences with best in class wines.
