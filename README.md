# WhatsApp Automation UI

A React + TypeScript application for WhatsApp automation with Supabase authentication.

## Features

- 🔐 Supabase authentication (username/password)
- 🎨 Modern, responsive login UI
- ⚡ Built with Vite for fast development
- 📱 Mobile-friendly design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_EMAIL_DOMAIN=example.com
VITE_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
  ├── lib/
  │   └── supabase.ts       # Supabase client configuration
  ├── pages/
  │   ├── Login.tsx         # Login page component
  │   ├── Login.css         # Login page styles
  │   ├── Dashboard.tsx     # Dashboard component
  │   └── Dashboard.css     # Dashboard styles
  ├── App.tsx               # Main app component with routing
  ├── App.css               # Global styles
  └── main.tsx              # Entry point
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Authentication > Settings
3. Enable Email/Password authentication
4. Copy your project URL and anon key to the `.env` file
5. Make sure your database has the `contacts` and `messages` tables as per the schema provided

## N8N Webhook Setup

1. Create your n8n workflow that handles sending WhatsApp messages
2. Add a Webhook node to receive the message data
3. The webhook will receive a POST request with this payload:
   ```json
   {
     "to": "phone_number",
     "message": "message_text",
     "contactId": "contact_uuid"
   }
   ```
4. Your n8n workflow should:
   - Create the message record in Supabase `messages` table
   - Send the message via WhatsApp
   - Update the message record with `wamid`, `status`, etc. after sending
5. Copy your webhook URL to the `.env` file as `VITE_N8N_WEBHOOK_URL`

## Features

- 📱 WhatsApp-like UI with contact list and chat view
- 💬 Real-time message display from Supabase
- 📤 Send messages via n8n webhook integration
- 🔍 Search contacts
- 📊 Contact information with message previews
- 🎨 Modern, responsive design matching WhatsApp theme

## Adding Logo and Favicon

Replace the placeholder logo in `src/pages/Login.tsx` and add your favicon to the `public` folder.
