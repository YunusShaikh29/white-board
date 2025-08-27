# 🎨 Excalidraw Clone - Collaborative Whiteboard

A full-stack collaborative whiteboard application built with modern technologies, featuring real-time collaboration, session management, and comprehensive drawing tools.

## ✨ Features

- **🎨 Complete Drawing Tools**: Rectangle, Circle, Line, Arrow, Pencil, Text, Eraser
- **🔄 Real-time Collaboration**: Live sessions with WebSocket communication  
- **🔐 Session Management**: Start/stop collaboration sessions with unique shareable links
- **🎯 Advanced Canvas**: Infinite canvas with zoom, pan, undo/redo
- **⌨️ Keyboard Shortcuts**: Quick tool switching and commands (R=Rectangle, C=Circle, etc.)
- **🎨 Customization**: Stroke width control, color picker, themes
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🚀 Production Ready**: Docker support, CI/CD, health checks, logging

## 🏗️ Architecture

This is a monorepo built with [Turborepo](https://turbo.build/repo) containing:

### Apps
- **`apps/whiteboard`**: Next.js frontend with React canvas implementation
- **`apps/http`**: Express.js REST API for authentication and room management  
- **`apps/websocket`**: WebSocket server for real-time collaboration

### Packages
- **`packages/db`**: Prisma ORM with PostgreSQL schema
- **`packages/common`**: Shared TypeScript types and Zod schemas
- **`packages/ui`**: Reusable React components
- **`packages/backend-common`**: Shared backend utilities

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm
- PostgreSQL database

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd excalidraw-cohort3
   pnpm install
   ```

2. **Database Setup**
   ```bash
   # Copy environment variables
   cp env.example .env
   
   # Update DATABASE_URL in .env
   # Example: postgresql://user:password@localhost:5432/excalidraw
   
   # Run migrations
   cd packages/db
   pnpm prisma migrate dev
   pnpm prisma generate
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1: Start all services
   pnpm dev
   
   # Or start individually:
   # Terminal 1: HTTP API
   cd apps/http && pnpm dev
   
   # Terminal 2: WebSocket
   cd apps/websocket && pnpm dev
   
   # Terminal 3: Frontend
   cd apps/whiteboard && pnpm dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - HTTP API: http://localhost:5050
   - WebSocket: ws://localhost:8081

### Docker Development

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🎮 Usage

### Basic Workflow
1. **Sign Up/In** at http://localhost:3000
2. **Create a Room** from the dashboard
3. **Start Drawing** with various tools
4. **Share & Collaborate**:
   - Click "Share" button
   - Click "Start Session" 
   - Copy and share the link
   - Collaborators join in real-time
5. **Stop Session** when done

### Keyboard Shortcuts
- **Drawing Tools**: `R` (Rectangle), `C` (Circle), `L` (Line), `A` (Arrow), `P` (Pencil), `T` (Text), `E` (Eraser)
- **Navigation**: `S` (Select), `H` (Hand/Pan), `1` (Pointer)
- **Actions**: `Ctrl+Z` (Undo), `Ctrl+Y` (Redo), `Ctrl+D` (Duplicate), `Delete` (Remove)
- **Canvas**: Mouse wheel (Zoom), Space+Drag (Pan)

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to Production

1. **Database**: Create PostgreSQL instance on [Neon.tech](https://neon.tech)
2. **Frontend**: Deploy to [Vercel](https://vercel.com)
3. **API**: Deploy to Vercel Serverless
4. **WebSocket**: Deploy to [Railway](https://railway.app)
5. **CI/CD**: Automatic deployment via GitHub Actions

**Estimated Cost**: $5-10/month for low traffic, scales affordably.

## 📊 Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **HTML5 Canvas**: Drawing implementation
- **Lucide React**: Icons

### Backend
- **Express.js**: HTTP API server
- **WebSocket (ws)**: Real-time communication
- **Prisma**: Database ORM
- **PostgreSQL**: Database
- **JWT**: Authentication
- **Zod**: Schema validation

### DevOps
- **Turborepo**: Monorepo management
- **Docker**: Containerization
- **GitHub Actions**: CI/CD
- **pnpm**: Package management

## 📁 Project Structure

```
excalidraw-cohort3/
├── apps/
│   ├── whiteboard/          # Next.js frontend
│   ├── http/               # Express.js API
│   └── websocket/          # WebSocket server
├── packages/
│   ├── db/                 # Prisma database
│   ├── common/             # Shared types
│   ├── ui/                 # React components
│   └── backend-common/     # Backend utilities
├── scripts/
│   └── deploy.sh          # Deployment script
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Local development
└── DEPLOYMENT.md         # Deployment guide
```

## 🧪 Development

### Available Scripts
```bash
# Development
pnpm dev              # Start all services
pnpm build            # Build all apps
pnpm test             # Run tests (when added)

# Database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:generate      # Generate Prisma client

# Individual apps
pnpm dev --filter=whiteboard   # Frontend only
pnpm dev --filter=http        # API only
pnpm dev --filter=websocket   # WebSocket only
```

### Adding New Features

1. **Database Changes**: Update `packages/db/prisma/schema.prisma`
2. **API Endpoints**: Add to `apps/http/src/index.ts`
3. **WebSocket Events**: Update `apps/websocket/src/index.ts`
4. **Frontend**: Add components in `apps/whiteboard/`
5. **Types**: Share via `packages/common/src/types.ts`

## 📈 Performance

- **Frontend**: Next.js optimizations, image optimization, code splitting
- **API**: Serverless scaling, connection pooling
- **WebSocket**: Efficient binary protocols, connection management
- **Database**: Indexes, query optimization
- **Caching**: Static assets via CDN

## 🔒 Security

- **Authentication**: JWT with secure secrets
- **Session Management**: Temporary session keys
- **CORS**: Configured for production domains
- **Input Validation**: Zod schemas
- **Rate Limiting**: Implemented for API endpoints
- **SSL/TLS**: HTTPS in production

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Excalidraw](https://excalidraw.com)
- Built with [Turborepo](https://turbo.build/repo)
- Deployed on [Vercel](https://vercel.com) and [Railway](https://railway.app)

---

**Built with ❤️ for collaborative creativity**