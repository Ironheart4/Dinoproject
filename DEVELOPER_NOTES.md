# DinoProject — Complete Developer Study Guide

> This guide explains **every part** of DinoProject so you can understand how it works.
> Author: Ayo (Iron Heart) | Last Updated: February 2026

---

## 📁 PROJECT STRUCTURE OVERVIEW

```
dinoproject-backend/          ← Root folder (also contains frontend)
├── server.ts                 ← Main backend server (Express + API routes)
├── prisma/
│   └── schema.prisma         ← Database schema (tables/models)
├── scripts/
│   ├── seed.ts               ← Populate database with initial data
│   └── create-admin.ts       ← Create admin user script
├── uploads/                  ← Uploaded files (profile pics)
├── frontend/                 ← Main user-facing React app
│   └── src/
│       ├── App.tsx           ← Routes configuration
│       ├── main.tsx          ← React entry point
│       ├── pages/            ← Each page component
│       ├── components/       ← Reusable UI components
│       └── lib/              ← Utilities (api, auth, theme)
└── admin/                    ← Optional checkout of the separate private admin repo
    └── src/
        ├── App.tsx           ← Admin routes
        └── pages/            ← Admin pages (DinosaurManager, etc.)
```

---

## 🔄 HOW THE APP WORKS (Data Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   React     │    │   Three.js  │    │   Supabase Auth     │ │
│  │   Frontend  │    │   3D Viewer │    │   (Login/Register)  │ │
│  └──────┬──────┘    └─────────────┘    └──────────┬──────────┘ │
└─────────┼────────────────────────────────────────┼─────────────┘
          │ API Requests (fetch)                    │ JWT Token
          ▼                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (Express)                     │
│  server.ts                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Middleware: CORS → Helmet → Morgan → Rate Limit → Auth │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Routes: /api/dinosaurs, /api/auth, /api/quiz, /api/forum│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL DATABASE                 │
│  Tables: users, dinosaurs, quizzes, questions, scores,          │
│          favorites, subscriptions, forum_posts, forum_replies   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗃️ DATABASE TABLES EXPLAINED (prisma/schema.prisma)

### User
```
users
├── id (UUID)         → Matches Supabase auth.users.id
├── name              → Display name
├── role              → "user" or "admin" (controls permissions)
└── createdAt         → When account was created
```
**Relationships:** Has many scores, favorites, forum posts, forum replies, one subscription

### Dinosaur
```
dinosaurs
├── id (auto)         → Primary key
├── name              → "Tyrannosaurus Rex"
├── species           → Unique scientific name
├── period            → "Cretaceous", "Jurassic", etc.
├── diet              → "Carnivorous", "Herbivorous", "Omnivorous"
├── habitat           → "land", "air", "water"
├── lengthMeters      → Body length in meters
├── weightKg          → Weight in kilograms
├── description       → Long text about the dinosaur
├── modelUrl          → URL to 3D GLB/GLTF model file
├── imageUrl          → Main image URL
├── imageUrl1-5       → Additional gallery images
├── roarSound         → URL to sound file
├── videoUrl          → YouTube or video URL
├── isPremium         → If true, only premium users see full 3D
└── taxonomy          → Scientific classification
```

### Quiz & Question
```
quizzes                       questions
├── id                        ├── id
├── title                     ├── quizId (FK to quiz)
└── questions[]               ├── questionText
                              ├── optionA, optionB, optionC, optionD
                              └── correctAnswer ("A", "B", "C", or "D")
```

### Score
```
scores
├── userId    → Who took the quiz
├── quizId    → Which quiz
├── score     → Points earned
└── completedAt
```

### Forum
```
forum_categories              forum_posts                    forum_replies
├── id                        ├── id                         ├── id
├── name                      ├── categoryId (FK)            ├── postId (FK)
├── slug                      ├── userId (FK)                ├── userId (FK)
├── description               ├── title                      ├── content
└── postCount                 ├── content                    └── createdAt
                              ├── isPinned (admin can pin)
                              ├── isLocked (admin can lock)
                              └── viewCount
```

---

## 🔐 AUTHENTICATION FLOW

### How Login Works:
1. User enters email/password on Login page
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase verifies credentials and returns JWT token
4. Frontend stores token in memory and localStorage
5. `auth.tsx` fetches user profile from `/api/auth/me`
6. User data (name, role, subscription) is stored in React context

### How Protected Routes Work:
```tsx
// frontend/src/components/PrivateRoute.tsx
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" />  // Redirect if not logged in
  
  return children  // Show the page if logged in
}
```

### How Backend Verifies Tokens:
```typescript
// server.ts - authMiddleware function
async function authMiddleware(req, res, next) {
  // 1. Extract token from "Authorization: Bearer <token>"
  const token = req.headers.authorization?.split(" ")[1]
  
  // 2. Verify token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  // 3. Get/create user in our database
  let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  
  // 4. Attach user to request for route handlers
  req.user = { id: dbUser.id, name: dbUser.name, role: dbUser.role }
  
  next()  // Continue to route handler
}
```

### Admin vs Regular User:
- **Regular users:** Can view, take quizzes, post in forum
- **Admins:** Can also pin/lock forum posts, access admin dashboard  
- Admin login works on BOTH frontend and admin panel
- Role is stored in `users.role` column ("admin" or "user")

---

## 🦖 3D VIEWER EXPLAINED (DinoViewer.tsx)

### How 3D Models Load:
```tsx
// Simplified flow
1. Component receives modelUrl prop (e.g., "https://example.com/trex.glb")

2. Create Three.js scene, camera, renderer
   const scene = new THREE.Scene()
   const camera = new THREE.PerspectiveCamera(...)
   const renderer = new THREE.WebGLRenderer({ canvas })

3. Load model using GLTFLoader + DRACOLoader (for compression)
   const loader = new GLTFLoader()
   loader.setDRACOLoader(dracoLoader)  // Handles compressed models
   
   loader.load(modelUrl, (gltf) => {
     // Model loaded! Add to scene
     scene.add(gltf.scene)
     
     // Center the model
     const box = new THREE.Box3().setFromObject(gltf.scene)
     const center = box.getCenter(new THREE.Vector3())
     gltf.scene.position.sub(center)
     
     // Play animations if any
     if (gltf.animations.length) {
       mixer = new THREE.AnimationMixer(gltf.scene)
       gltf.animations.forEach(clip => mixer.clipAction(clip).play())
     }
   })

4. Add controls so user can rotate/zoom
   const controls = new OrbitControls(camera, canvas)
   controls.enableDamping = true  // Smooth rotation

5. Animation loop
   function animate() {
     requestAnimationFrame(animate)
     controls.update()
     if (mixer) mixer.update(delta)  // Update animations
     renderer.render(scene, camera)
   }
```

### Model Requirements:
- Format: GLB or GLTF (3D model format)
- Host: Must have CORS headers (use raw.githubusercontent.com for GitHub)
- Size: Keep under 10MB for fast loading
- Compression: Use Draco compression for smaller files

---

## 🎯 KEY FRONTEND PAGES

### Home.tsx
- Hero section with 3D dinosaur viewer
- Particle background animation
- Stats bar showing counts
- Feature cards with links

### Encyclopedia.tsx
- Grid of all dinosaurs
- Search and filter by era/diet
- Clickable cards → DinoDetail page

### DinoDetail.tsx
- Full 3D model viewer
- Dinosaur information (size, diet, era)
- Image gallery
- Sound player

### Quiz.tsx
- Fetches quiz questions from `/api/quizzes/:id/questions`
- Tracks score as user answers
- Submits score to `/api/quizzes/:id/submit`

### Forum.tsx / ForumPost.tsx
- Lists categories and recent posts
- Users can create posts and replies
- Admins can pin/lock threads

### DinoBattle.tsx
- Select two dinosaurs
- Stats calculated from actual DB values:
  - **Attack:** diet + length + weight
  - **Defense:** diet + weight
  - **Speed:** 100 - weight + carnivore bonus
  - **Intelligence:** diet + size inverse + ID variance
  - **Ferocity:** diet + carnivore length bonus
- Battle simulation with round-by-round log

### Splash.tsx
- Intro landing page
- 3D dino emerges from ground
- Mobile: Skip 3D for fast load (optimized!)
- Desktop: 4-second fallback timeout

---

## 🛠️ KEY COMPONENTS

### MasterLayout.tsx
- Wraps all pages (except Splash)
- Contains: Header navigation, Footer
- Handles dark/light theme

### DinoAssistant.tsx
- Floating AI chat button (bottom-right)
- Calls `/api/ai/chat` endpoint
- Uses Hugging Face API for responses

### ParticleBackground.tsx
- Canvas-based floating particles
- Earthy color palette
- Used in hero sections

### ErrorBoundary.tsx
- Catches JavaScript errors
- Shows friendly error page
- Prevents white screen of death

---

## 🔌 API ENDPOINTS REFERENCE

### Dinosaurs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/dinosaurs | No | List all dinosaurs |
| GET | /api/dinosaurs/:id | No | Get single dinosaur |
| POST | /api/dinosaurs | Admin | Create dinosaur |
| PUT | /api/dinosaurs/:id | Admin | Update dinosaur |
| DELETE | /api/dinosaurs/:id | Admin | Delete dinosaur |

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Create account |
| GET | /api/auth/me | Yes | Get current user profile |
| PUT | /api/profile | Yes | Update profile |

### Quizzes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/quizzes | No | List quizzes |
| GET | /api/quizzes/:id/questions | No | Get quiz questions |
| POST | /api/quizzes/:id/submit | Yes | Submit quiz score |
| GET | /api/scores/history | Yes | Get user's quiz history |

### Forum
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/forum/categories | No | List categories |
| GET | /api/forum/posts/recent | No | Recent posts |
| GET | /api/forum/post/:id | No | Single post + replies |
| POST | /api/forum/posts | Yes | Create post |
| POST | /api/forum/posts/:id/replies | Yes | Add reply |
| PATCH | /api/forum/posts/:id/pin | Admin | Pin/unpin post |
| PATCH | /api/forum/posts/:id/lock | Admin | Lock/unlock post |

### AI
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/ai/chat | Yes* | Chat with DinoBot |

*Premium users only (or admin)

---

## 🌐 ENVIRONMENT VARIABLES CHEATSHEET

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/database

# Supabase (get from Supabase dashboard)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsI...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsI...  # SECRET! Never expose

# Server
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# AI (optional)
HUGGINGFACE_API_KEY=hf_xxxx

# PayPal (optional)
PAYPAL_CLIENT_ID=xxxx
PAYPAL_SECRET=xxxx
PAYPAL_MODE=sandbox
```

### Frontend (Vercel / .env.local)
```bash
VITE_API_URL=https://dinoproject-api.onrender.com
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsI...
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend (Render)
1. Connect GitHub repo
2. Set build command: `npm install --include=dev && npx prisma generate && npm run build`
3. Set start command: `npm start`
4. Add all environment variables
5. Deploy!

### Frontend (Vercel)
1. Connect GitHub repo
2. Set root directory: `frontend`
3. Add environment variables (VITE_*)
4. Deploy!

### Admin (Vercel - separate project)
1. Same steps as frontend
2. Root directory: `admin`

---

## 🐛 COMMON ISSUES & FIXES

### "CORS error" on 3D models
→ Model host doesn't allow cross-origin requests
→ Fix: Use raw.githubusercontent.com URLs or self-host

### "Invalid token" errors
→ Token expired or user not in database
→ Fix: Log out and log back in

### Slow splash page on mobile
→ 3D model loading is heavy
→ Fix: Already optimized - skips 3D on mobile!

### "Unknown column" database errors
→ Schema changed but not migrated
→ Fix: Run `npx prisma db push` or `npx prisma migrate dev`

### Build fails on Render
→ Missing dev dependencies
→ Fix: Use `npm install --include=dev`

---

## 📚 STUDYING THIS PROJECT

### Start Here:
1. **Database:** Read `prisma/schema.prisma` to understand data structure
2. **Backend:** Read `server.ts` focusing on one route group at a time
3. **Frontend:** Start with `App.tsx` to see all routes, then explore pages

### Key Patterns to Learn:
- **React Context:** See `auth.tsx` for global state management
- **Three.js:** See `DinoViewer.tsx` for 3D graphics
- **REST API:** See `api.ts` for fetch patterns
- **Prisma ORM:** See server.ts for database queries

### Test Locally:
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Open http://localhost:5173
```

---

## Quick start (local)
- Backend:
  - Install: `npm install`
  - Generate Prisma client: `npx prisma generate`
  - Build: `npm run build` (or `npm run dev` for development)
  - Start: `npm start` (or `npm run dev` for tsc watch + nodemon)

- Frontend (monorepo `frontend/`):
  - `cd frontend && npm install && npm run dev`

- Seed DB (optional):
  - `npx ts-node scripts/seed.ts` (requires `DATABASE_URL` env var)

---

**Happy coding, Iron Heart! 🦖**