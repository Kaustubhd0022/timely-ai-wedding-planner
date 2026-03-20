# Timely AI Wedding Planner

A smart planning assistant that helps engaged couples in India manage every step of their wedding — from engagement to the wedding day.

## Features
- **AI-Generated Timeline**: Week-by-week task plan based on your wedding details.
- **Dependency Tracking**: Never miss a step; know exactly what's blocking you.
- **Multi-Event Support**: Handle Mehendi, Sangeet, Haldi, and more.
- **Budget Intelligence**: (Phase 2) Real-time tracking of spend vs budget.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion.
- **Backend**: Supabase (Database, Auth, Edge Functions).
- **AI Engine**: Anthropic Claude API (Sonnet).

## Getting Started

1.  **Clone the repo**:
    ```bash
    git clone ...
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment Variables**:
    Create a `.env.local` file with:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ANTHROPIC_API_KEY=your_anthropic_api_key
    ```
4.  **Run the development server**:
    ```bash
    npm run dev
    ```

## Database Schema
The database schema is defined in `supabase/schema.sql`. Apply it to your Supabase project via the SQL Editor.
