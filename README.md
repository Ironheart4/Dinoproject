# 🦕 DinoProject

An interactive 3D dinosaur education platform with quizzes, a community forum, timeline explorer, and more!

![DinoProject](https://i.postimg.cc/gcMbkWV0/Dino-Project-Logo.png)

## ✨ Features

- 🦖 **3D Dinosaur Viewer** - Interactive GLTF models with rotation and zoom
- 📚 **Encyclopedia** - 100+ dinosaur species with detailed information
- 🗺️ **Timeline Explorer** - OpenLayers map showing dinosaur discovery locations
- 🎯 **Quizzes** - Test your dinosaur knowledge and track scores
- 💬 **Community Forum** - Public discussions for dinosaur enthusiasts
- 🤖 **AI Dino Assistant** - Get answers about dinosaurs
- 🔊 **Dino Sounds** - Hear dinosaur roars (headphones recommended!)
- 🌙 **Dark Theme** - Easy on the eyes

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **3D Graphics**: Three.js + React Three Fiber
- **Maps**: OpenLayers (free, no API key needed)
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/Ironheart4/dinoproject.git
cd dinoproject

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
npx prisma db push

# Seed the database (optional)
npm run seed

# Start development servers
npm run dev          # Backend on :5000
cd frontend && npm run dev   # Frontend on :5173
```

## 📁 Project Structure

```
dinoproject/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities & hooks
├── prisma/            # Database schema
├── scripts/           # Seed scripts
├── server.ts          # Express API server
└── uploads/           # User uploads
```

## 🔒 Security

- Rate limiting on all endpoints
- Stricter limits on auth endpoints
- CORS restricted to allowed origins
- Helmet.js security headers
- Supabase JWT authentication
- Input validation

## 🐳 Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source under the [MIT License](LICENSE).

## 👤 Author

**Ayo (Iron Heart)**

- Email: dinoprojectoriginal@gmail.com
- GitHub: [@Ironheart4](https://github.com/Ironheart4)

---

Made with ❤️ for dinosaur enthusiasts worldwide 🦕
