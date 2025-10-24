# SpeechFlow - Voice to Text & Text to Voice

A minimal one-page website inspired by Airbnb design that provides seamless speech-to-text and text-to-speech conversion. No login required to use the core features.

## Features

- 🎤 **Speech to Text**: Real-time speech recognition using Deepgram API
- 🔊 **Text to Speech**: Natural voice synthesis using Web Speech API
- 🌙 **Dark/Light Mode**: Toggle between themes with smooth transitions
- 📱 **Responsive Design**: Airbnb-inspired UI that works on all devices
- ⚡ **No Login Required**: Start using immediately without authentication
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Speech Services**: Deepgram SDK + Web Speech API
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: Supabase (optional)
- **Caching**: Upstash Redis
- **Package Manager**: Bun

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd speech-app
bun install
```

### 2. Environment Variables

Copy `.env.local` and fill in your API keys:

```bash
# Deepgram API Key (Required for speech-to-text)
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Supabase Configuration (Optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Upstash Redis Configuration (Optional)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here

# Database URL for Prisma (Optional)
DATABASE_URL=your_database_url_here
```

### 3. Get API Keys

#### Deepgram (Required)

1. Sign up at [Deepgram](https://deepgram.com/)
2. Create a new project
3. Generate an API key
4. Add it to your `.env.local`

#### Supabase (Optional)

1. Create a project at [Supabase](https://supabase.com/)
2. Get your project URL and anon key from Settings > API
3. Add them to your `.env.local`

#### Upstash Redis (Optional)

1. Create a database at [Upstash](https://upstash.com/)
2. Get your REST URL and token
3. Add them to your `.env.local`

### 4. Database Setup (Optional)

If you want to use the database features:

```bash
# Generate Prisma client
bunx prisma generate

# Run migrations (after setting up your database)
bunx prisma db push
```

### 5. Run the Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### Speech to Text

1. Click the "Start Recording" button
2. Allow microphone access when prompted
3. Speak clearly into your microphone
4. Click "Stop Recording" when finished
5. Your transcript will appear in the text area

### Text to Speech

1. Type or paste text into the text area
2. Click the "Speak" button
3. Listen to the synthesized speech
4. Click "Stop" to interrupt playback

### Quick Actions

- Use "Use Transcript as Text Input" to convert speech to text and then to speech
- Use "Clear All" to reset both text areas

## Browser Compatibility

- **Speech Recognition**: Requires a modern browser with Web Speech API support
- **Text to Speech**: Works in all modern browsers
- **Microphone Access**: Requires HTTPS in production

## Deployment

The app can be deployed to any platform that supports Next.js:

- Vercel (recommended)
- Netlify
- Railway
- Docker

Make sure to set your environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.
# freetoolforall
