<p align="center">
  <img src="public/logo.svg" alt="DeepFocus Logo" width="120" height="120" />
</p>

<h1 align="center">DeepFocus</h1>

<p align="center">
  <strong>🎯 A distraction-free YouTube learning platform with Google services integration</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-7.0-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/ashwin-r11/deepfocus?style=flat-square" alt="License" />
  <img src="https://img.shields.io/github/stars/ashwin-r11/deepfocus?style=flat-square" alt="Stars" />
  <img src="https://img.shields.io/github/forks/ashwin-r11/deepfocus?style=flat-square" alt="Forks" />
</p>

---

## 📸 Preview

<p align="center">
  <img src="public/screenshots/home.png" alt="Home Page" width="800" />
</p>

<details>
<summary>📱 More Screenshots</summary>
<br>

| Home Page | Video Player |
|:---------:|:------------:|
| ![Home](public/screenshots/home.png) | ![Player](public/screenshots/player.png) |

| Notepad | Playlists |
|:-------:|:---------:|
| ![Notepad](public/screenshots/notepad.png) | ![Playlists](public/screenshots/playlists.png) |

</details>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎬 Distraction-Free Video Player
- Clean, minimal interface
- Custom video controls
- Fullscreen support
- Captions/CC toggle
- Progress tracking

</td>
<td width="50%">

### 📝 Integrated Notepad
- Markdown support
- Auto-save functionality
- Timestamps linking
- Export to Google Drive
- Obsidian-compatible export

</td>
</tr>
<tr>
<td width="50%">

### 📚 Playlist Management
- Create custom playlists
- Import YouTube playlists
- Add videos to playlists
- Track watch progress

</td>
<td width="50%">

### 🔗 Google Services Integration
- **YouTube** - Search & play videos
- **Google Drive** - Sync notes
- **Google Calendar** - Schedule study sessions
- **Google Tasks** - Todo management
- **Google Classroom** - Course integration

</td>
</tr>
</table>

### 🌙 True Black Theme

Designed for OLED screens with a minimal, eye-friendly dark interface.

```
Background: oklch(0 0 0)      ████████  Pure Black
Card:       oklch(0.06 0 0)   ████████  Subtle Gray
Border:     oklch(0.15 0 0)   ████████  Soft Border
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=nextjs" width="48" height="48" alt="Next.js" />
<br>Next.js 16
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=ts" width="48" height="48" alt="TypeScript" />
<br>TypeScript
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br>Tailwind 4
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=prisma" width="48" height="48" alt="Prisma" />
<br>Prisma 7
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=postgres" width="48" height="48" alt="PostgreSQL" />
<br>PostgreSQL
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=vercel" width="48" height="48" alt="Vercel" />
<br>Vercel
</td>
</tr>
</table>

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 4.x, Radix UI, shadcn/ui |
| **Database** | PostgreSQL (Vercel Postgres) |
| **ORM** | Prisma 7 with Driver Adapters |
| **Auth** | NextAuth.js v5 (Auth.js) |
| **APIs** | Google APIs (YouTube, Drive, Calendar, Tasks, Classroom) |
| **Video** | react-youtube |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database
- Google Cloud Console project

### 1️⃣ Clone the repository

```bash
git clone https://github.com/ashwin-r11/deepfocus.git
cd deepfocus
```

### 2️⃣ Install dependencies

```bash
pnpm install
# or
npm install
```

### 3️⃣ Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/deepfocus"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"  # Generate: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 4️⃣ Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 5️⃣ Run the development server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔐 Google OAuth Setup

<details>
<summary>📋 Step-by-step guide</summary>

### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the following APIs:
   - ✅ YouTube Data API v3
   - ✅ Google Drive API
   - ✅ Google Calendar API
   - ✅ Google Tasks API
   - ✅ Google Classroom API

### Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in app information:
   - App name: `DeepFocus`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   ```
   openid
   email
   profile
   https://www.googleapis.com/auth/youtube.readonly
   https://www.googleapis.com/auth/drive.file
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/tasks
   https://www.googleapis.com/auth/classroom.courses.readonly
   ```
5. Add test users (required while in testing mode)

### Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Add authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.vercel.app/api/auth/callback/google
   ```
5. Copy **Client ID** and **Client Secret** to `.env`

</details>

---

## ☁️ Deployment

### Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ashwin-r11/deepfocus)

#### Manual Deployment Steps

1. **Import project** on [Vercel](https://vercel.com)
2. **Create Postgres database:**
   - Go to Storage → Create Database → Postgres
   - Copy the `DATABASE_URL`
3. **Set environment variables:**

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | Vercel Postgres connection string |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` |
   | `NEXTAUTH_SECRET` | Random 32-char secret |
   | `GOOGLE_CLIENT_ID` | From Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

4. **Update Google Console** with production redirect URI
5. **Deploy!** 🚀

---

## 📁 Project Structure

```
deepfocus/
├── 📂 app/                    # Next.js App Router
│   ├── 📂 api/                # API routes
│   │   ├── 📂 auth/           # NextAuth endpoints
│   │   ├── 📂 playlists/      # Playlist CRUD
│   │   ├── 📂 watch-history/  # Progress tracking
│   │   └── 📂 youtube/        # YouTube API proxy
│   ├── 📂 watch/[id]/         # Video player page
│   ├── 📄 layout.tsx          # Root layout
│   └── 📄 page.tsx            # Home page
├── 📂 components/             # React components
│   ├── 📂 ui/                 # shadcn/ui components
│   ├── 📄 video-stage.tsx     # Video player
│   ├── 📄 notepad.tsx         # Note-taking
│   ├── 📄 playlist-modal.tsx  # Playlist manager
│   └── 📄 tools-panel.tsx     # Side panel
├── 📂 lib/                    # Utilities
│   ├── 📄 auth.ts             # NextAuth config
│   ├── 📄 prisma.ts           # Database client
│   └── 📄 utils.ts            # Helper functions
├── 📂 prisma/                 # Database
│   └── 📄 schema.prisma       # Data models
├── 📂 public/                 # Static assets
└── 📄 package.json
```

---

## 📊 Database Schema

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ Playlist : creates
    User ||--o{ Note : writes
    User ||--o{ WatchHistory : tracks
    Playlist ||--o{ PlaylistVideo : contains

    User {
        string id PK
        string email
        string name
        string image
    }
    
    Playlist {
        string id PK
        string name
        string userId FK
    }
    
    WatchHistory {
        string id PK
        string videoId
        int progress
        int duration
        datetime lastWatched
    }
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [shadcn/ui](https://ui.shadcn.com/) - UI Components
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://authjs.dev/) - Authentication
- [Vercel](https://vercel.com/) - Deployment Platform

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ashwin-r11">Ashwin</a>
</p>

<p align="center">
  <a href="https://github.com/ashwin-r11/deepfocus/stargazers">⭐ Star this repo</a> •
  <a href="https://github.com/ashwin-r11/deepfocus/issues">🐛 Report Bug</a> •
  <a href="https://github.com/ashwin-r11/deepfocus/issues">✨ Request Feature</a>
</p>
