#  Delivery Management Platform

A comprehensive platform for managing deliveries, tracking quality, and measuring client satisfaction in the construction and building industry.

## Features

- **Delivery Management**: Multi-format file uploads with versioning and automated receipt generation
- **Project Organization**: Organize deliveries by projects and clients
- **Quality Tracking**: NCE (Non-Conformity) declaration and tracking system with severity levels
- **Client Satisfaction**: Automated NPS/CSAT surveys with analytics
- **Analytics Dashboard**: Real-time KPIs, interactive charts, and quality metrics
- **User Authentication**: Secure JWT-based authentication with role-based access

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern utility-first styling
- **Recharts** - Data visualization
- **Zustand** - State management
- **shadcn/ui** - UI component library

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **PostgreSQL** - Relational database
- **JWT** - Secure authentication
- **Pydantic** - Data validation

### Deployment
- **Docker & Docker Compose** - Containerization
- **Vercel** - Frontend deployment (optional)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker (optional)

### Installation

#### 1. Clone the repository

\`\`\`bash
git clone <repository-url>
cd buildingmap-platform
\`\`\`

#### 2. Setup Backend

\`\`\`bash
cd backend
pip install -r requirements.txt
\`\`\`

Create a `.env` file in the backend directory:

\`\`\`env
DATABASE_URL=postgresql://user:password@localhost:5432/buildingmap
SECRET_KEY=your-secret-key-change-in-production
\`\`\`

Run the backend:

\`\`\`bash
python main.py
\`\`\`

The API will be available at `http://localhost:8000`

#### 3. Setup Frontend

\`\`\`bash
npm install
\`\`\`

Create a `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

Run the frontend:

\`\`\`bash
npm run dev
\`\`\`

The app will be available at `http://localhost:3000`

### Using Docker

The easiest way to run the entire stack:

\`\`\`bash
docker-compose up
\`\`\`

This will start:
- PostgreSQL database on port 5432
- FastAPI backend on port 8000
- Next.js frontend on port 3000

## Project Structure

\`\`\`
├── app/                      # Next.js pages and routes
│   ├── page.tsx             # Dashboard
│   ├── login/               # Authentication
│   ├── projects/            # Project management
│   ├── deliveries/          # Delivery tracking
│   ├── nce/                 # Non-conformity tracking
│   ├── surveys/             # Survey management
│   └── analytics/           # Analytics dashboard
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── sidebar.tsx          # Navigation sidebar
│   ├── auth-guard.tsx       # Route protection
│   └── create-*-dialog.tsx  # Creation dialogs
├── lib/                     # Utilities and API client
│   ├── api.ts              # API client functions
│   ├── auth.ts             # Authentication logic
│   └── utils.ts            # Helper functions
├── backend/                 # FastAPI backend
│   ├── main.py             # Main API file with all endpoints
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container
└── docker-compose.yml      # Docker orchestration
\`\`\`

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

#### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details

#### Deliveries
- `GET /api/deliveries` - List all deliveries
- `POST /api/deliveries` - Create new delivery
- `GET /api/deliveries/{id}` - Get delivery details
- `PUT /api/deliveries/{id}/status` - Update delivery status

#### NCEs
- `GET /api/nces` - List all NCEs
- `POST /api/nces` - Create new NCE
- `GET /api/nces/{id}` - Get NCE details
- `PUT /api/nces/{id}/status` - Update NCE status

#### Surveys
- `GET /api/surveys` - List all surveys
- `POST /api/surveys` - Create new survey

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Environment Variables

### Frontend (.env.local)

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

### Backend (.env)

\`\`\`env
DATABASE_URL=postgresql://user:password@localhost:5432/buildingmap
SECRET_KEY=your-secret-key-change-in-production
\`\`\`

## Features in Detail

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Manager, User, Client)
- Protected routes and API endpoints
- Secure password hashing

### Project Management
- Create and organize projects by client
- Track project details and metadata
- View all deliveries per project

### Delivery Management
- Create deliveries linked to projects
- Track delivery status (Pending, In Progress, Delivered, Rejected)
- Version control for deliveries
- File upload support (planned)

### NCE Tracking
- Report non-conformities with severity levels (Low, Medium, High, Critical)
- Track NCE status (Open, In Progress, Resolved, Closed)
- Add resolution notes
- Link NCEs to specific deliveries

### Survey Management
- Create NPS (Net Promoter Score) surveys
- Create CSAT (Customer Satisfaction) surveys
- Track survey responses and scores
- Calculate average scores

### Analytics Dashboard
- Real-time KPIs and metrics
- Interactive charts (Pie, Bar, Line)
- Delivery status distribution
- NCE severity breakdown
- Survey score trends over time
- Export analytics data as JSON

## Default Credentials

After first setup, you can register a new account at `/register` or login at `/login`.

## Development

### Running Tests

\`\`\`bash
# Frontend
npm run test

# Backend
cd backend
pytest
\`\`\`

### Building for Production

\`\`\`bash
# Frontend
npm run build
npm start

# Backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
\`\`\`

## Deployment

### Vercel (Frontend)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Backend Deployment

The FastAPI backend can be deployed to:
- Railway
- Render
- AWS EC2
- Google Cloud Run
- Any platform supporting Docker

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub or contact support.

## Roadmap

- [ ] File upload and storage integration
- [ ] Email notifications for surveys and NCEs
- [ ] PDF receipt generation
- [ ] Advanced filtering and search
- [ ] Export reports to PDF/Excel
- [ ] Mobile app
- [ ] Real-time notifications
- [ ] Audit logging
- [ ] Multi-language support

---

Built with ❤️ for the construction and building industry
