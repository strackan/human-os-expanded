# Creativity Journal - Codebase Documentation

## Overview

The Creativity Journal is a Next.js-based web application designed as a private digital journaling platform with advanced features for mood tracking, task management, and content organization. The application provides a focused writing environment with integrated productivity tools.

## Technology Stack

### Frontend
- **Next.js 15.3.4** - React framework with App Router
- **React 19.0.0** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **TipTap 2.22.3** - Rich text editor
- **React Select 5.10.1** - Enhanced select components
- **Lucide React 0.525.0** - Icon library

### Backend & Database
- **Next.js API Routes** - Server-side API endpoints
- **Prisma 5.22.0** - Database ORM
- **SQLite** - Database (development)
- **NextAuth.js 4.24.11** - Authentication framework

### Authentication
- **Google OAuth 2.0** - Primary authentication provider
- **Custom JWT handling** - Enhanced session management
- **Database sessions** - Persistent session storage

## Project Structure

```
creativity-journal-next/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── entry/             # Journal entry pages
│   │   ├── tasks/             # Task management
│   │   ├── snippets/          # Snippet management
│   │   └── moods/             # Mood tracking
│   ├── components/            # Reusable React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── docs/                      # Documentation
```

## Core Features

### 1. Authentication System

#### Google OAuth Integration
- **File**: `src/auth.js`
- **Purpose**: Handles Google OAuth authentication with NextAuth.js
- **Features**:
  - Dynamic NEXTAUTH_URL configuration
  - Session management with database storage
  - Automatic user creation and account linking
  - Custom redirect handling to entry page

#### Custom JWT Authentication
- **File**: `src/app/api/auth/google-jwt/route.ts`
- **Purpose**: Alternative authentication endpoint for Google JWT tokens
- **Features**:
  - JWT token verification
  - User creation/lookup
  - Session token generation
  - Cookie-based session management

### 2. Journal Entry Management

#### Entry Creation & Editing
- **Files**: 
  - `src/app/entry/page.tsx` (new entries)
  - `src/app/entry/[id]/page.tsx` (existing entries)
- **Features**:
  - Rich text editing with TipTap
  - Auto-save functionality (2-second debounce)
  - Word and character counting
  - Writing mode for distraction-free composition
  - Entry metadata management (subject, moods, satisfaction)

#### Entry Panel Component
- **File**: `src/components/EntryPanel.tsx`
- **Purpose**: Sidebar for entry metadata and quick actions
- **Features**:
  - Collapsible interface
  - Inline editing for subject, moods, and context
  - Satisfaction rating slider (1-10 scale)
  - Quick actions (focus editor, clear fields)
  - Entry task display

### 3. Rich Text Editor

#### TipTap Editor Implementation
- **File**: `src/components/TiptapEditor.tsx`
- **Features**:
  - Rich text formatting (bold, italic, underline)
  - Blockquotes and code blocks
  - Image and link insertion
  - Text alignment options
  - Custom toolbar with journal-specific actions

#### Editor Extensions
- **Text Selection Hook**: `src/hooks/useTextSelection.ts`
- **Hotkeys Hook**: `src/hooks/useHotkeys.ts`
- **Custom Features**:
  - Task creation from selected text (Alt+T)
  - Snippet creation from selected text (Alt+S)
  - Snippet panel integration

### 4. Mood Tracking System

#### Database Schema
```sql
-- Core mood table
model Mood {
  id    Int @id @default(autoincrement())
  name  String @unique
  moodProps   MoodProps[]
  entryMoods  EntryMoods[]
}

-- Detailed emotion ratings (Plutchik wheel)
model MoodProps {
  id                Int @id @default(autoincrement())
  moodId            Int @map("mood_id")
  joyRating         Int?
  trustRating       Int?
  fearRating        Int?
  surpriseRating    Int?
  sadnessRating     Int?
  anticipationRating Int?
  angerRating       Int?
  disgustRating     Int?
}

-- Entry-mood relationships
model EntryMoods {
  id      Int @id @default(autoincrement())
  moodId  Int @map("mood_id")
  entryId Int @map("entry_id")
}
```

#### Mood API
- **File**: `src/app/api/moods/route.ts`
- **Features**:
  - CRUD operations for moods
  - User-specific mood data
  - Integration with entry creation

### 5. Task Management System

#### Task Data Model
```sql
model Task {
  id                Int       @id @default(autoincrement())
  task              String
  description       String?
  createdDate       DateTime  @default(now())
  duedate           DateTime?
  taskStatusId      Int       @default(1)
  taskPriorityId    Int?
  projectId         Int?
  entryId           Int?      # Links tasks to journal entries
  googleTaskId      String?   # Google Tasks integration
  googleTaskListId  String?
}
```

#### Task Components
- **Task Panel**: `src/components/TaskPanel.tsx`
  - Collapsible sidebar for task management
  - Quick task creation from selected text
  - Status updates and filtering

- **Task Modal**: `src/components/TaskModal.tsx`
  - Full-screen task creation/editing
  - Project and priority assignment
  - Due date management

- **Tasks Page**: `src/app/tasks/page.tsx`
  - Comprehensive task management interface
  - Project and status filtering
  - Bulk operations

#### Task API Endpoints
- **GET/POST** `/api/tasks` - List and create tasks
- **GET/PUT/DELETE** `/api/tasks/[id]` - Individual task operations
- **GET** `/api/task-statuses` - Available task statuses
- **GET** `/api/task-priorities` - Available task priorities

### 6. Snippet System

#### Snippet Data Model
```sql
model EntrySnippets {
  id              Int      @id @default(autoincrement())
  entryId         Int      @map("entry_id")
  snippet         String   @default("")
  description     String   @default("")
  createdDate     DateTime @default(now())
  labelId         Int?     @map("label_id")
  startIndex      Int      @map("start_index")
  endIndex        Int      @map("end_index")
  highlightColor  String   @default("#FFEB3B")
}
```

#### Snippet Features
- **Text Highlighting**: Select text in editor and create snippets
- **Color Coding**: Custom highlight colors for organization
- **Labeling**: Categorize snippets with labels
- **Search & Filter**: Find snippets by content, description, or label
- **Context Preservation**: Store start/end indices for text positioning

#### Snippet Components
- **Snippets Panel**: `src/components/SnippetsPanel.tsx`
  - Modal interface for snippet management
  - Edit and delete functionality
  - Color and description editing

- **Snippets Page**: `src/app/snippets/page.tsx`
  - Grid view of all user snippets
  - Search and filtering capabilities
  - Navigation to source entries

### 7. Project Management

#### Project Data Model
```sql
model Project {
  id             Int      @id @default(autoincrement())
  description    String?
  name           String
  createdDate    DateTime @default(now())
  projectStatusId Int     @default(1)
  entries        Entry[]
  tasks          Task[]
}
```

#### Project Features
- **Task Organization**: Group tasks by projects
- **Entry Association**: Link journal entries to projects
- **Status Tracking**: Monitor project progress
- **Cross-Reference**: View all content related to a project

## API Architecture

### Authentication Endpoints
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handler
- `POST /api/auth/google-jwt` - Custom Google JWT authentication
- `GET /api/auth/session` - Session validation
- `GET /api/auth/user` - User information
- `POST /api/auth/signout` - Session termination

### Entry Management
- `GET/POST /api/entries` - Entry CRUD operations
- `GET/PUT/DELETE /api/entries/[id]` - Individual entry operations
- `POST /api/entries/autosave` - Auto-save functionality
- `POST /api/entries/publish` - Publish draft entries
- `POST /api/entries/archive` - Archive entries

### Content Management
- `GET/POST /api/snippets` - Snippet operations
- `GET/PUT/DELETE /api/snippets/[id]` - Individual snippet operations
- `GET/POST /api/tasks` - Task operations
- `GET/PUT/DELETE /api/tasks/[id]` - Individual task operations
- `GET /api/projects` - Project listing
- `GET /api/moods` - Mood data
- `GET /api/labels` - Label management

## Database Schema

### Core Tables

#### User Management
- `user` - User accounts and profiles
- `account` - OAuth provider accounts
- `session` - User sessions
- `verificationToken` - Email verification

#### Content Management
- `entry` - Journal entries
- `entry_props` - Entry metadata (content, title, stats)
- `entry_labels` - Entry categorization
- `entry_moods` - Mood associations
- `entry_snippets` - Highlighted text snippets

#### Organization
- `project` - Project definitions
- `project_status` - Project status options
- `task` - Task items
- `task_status` - Task status options
- `task_priority` - Task priority levels
- `label` - Content labeling system

#### Mood System
- `mood` - Basic mood definitions
- `mood_props` - Detailed emotion ratings
- `entry_moods` - Entry-mood relationships

## Key Components

### Layout & Navigation
- **ClientLayout**: `src/components/ClientLayout.tsx`
  - Main application layout
  - Sidebar navigation
  - Header with user controls

- **Sidebar**: `src/components/Sidebar.tsx`
  - Navigation menu
  - Quick access to features
  - User profile information

### Context Management
- **EntryContext**: `src/components/EntryContext.tsx`
  - Writing mode state management
  - Global entry state

- **SidebarContext**: `src/components/SidebarContext.tsx`
  - Sidebar collapse state
  - Navigation state

### Modal Components
- **Modal**: `src/components/Modal.tsx`
  - Reusable modal wrapper
  - Backdrop and animation handling

- **SaveConfirmationModal**: `src/components/SaveConfirmationModal.tsx`
  - Entry publishing confirmation
  - Preview and confirmation flow

## Development Workflow

### Environment Setup
1. **Database**: SQLite with Prisma ORM
2. **Authentication**: Google OAuth credentials required
3. **Environment Variables**: See `env.example`

### Available Scripts
- `npm run dev` - Development server with Turbopack
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

### Database Management
- **Migrations**: Prisma migrations for schema changes
- **Seeding**: Initial data population
- **Studio**: Visual database management tool

## Security Features

### Authentication Security
- **OAuth 2.0**: Secure Google authentication
- **Session Management**: Database-stored sessions
- **CSRF Protection**: Built-in NextAuth.js protection
- **Secure Cookies**: HttpOnly, secure, sameSite attributes

### Data Protection
- **User Isolation**: All data scoped to authenticated users
- **Input Validation**: Server-side validation on all endpoints
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Prevention**: React and Next.js built-in protection

## Performance Optimizations

### Frontend
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **Bundle Optimization**: Turbopack for faster builds
- **Lazy Loading**: Component-level lazy loading

### Backend
- **Database Indexing**: Optimized queries with Prisma
- **Caching**: Session and data caching
- **Connection Pooling**: Prisma connection management
- **API Optimization**: Efficient data fetching patterns

## Deployment Considerations

### Environment Variables
```env
# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_deployment_url

# Database
DATABASE_URL=your_database_url

# Optional
NEXTAUTH_DEBUG=true
```

### Production Database
- **Recommendation**: PostgreSQL for production
- **Migration**: Update `DATABASE_URL` in production environment
- **Backup**: Regular database backups recommended

### Deployment Platforms
- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative deployment option
- **Self-hosted**: Docker containerization supported

## Future Enhancements

### Planned Features
1. **Google Tasks Integration**: Sync tasks with Google Tasks
2. **Export Functionality**: PDF/Word document export
3. **Advanced Analytics**: Writing patterns and mood trends
4. **Collaboration**: Shared entries and projects
5. **Mobile App**: React Native companion app

### Technical Improvements
1. **Real-time Collaboration**: WebSocket integration
2. **Offline Support**: Service worker implementation
3. **Advanced Search**: Full-text search capabilities
4. **Data Visualization**: Charts and analytics dashboard
5. **API Rate Limiting**: Enhanced security measures

## Contributing

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Conventional Commits**: Git commit message format

### Testing Strategy
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: User workflow testing
- **Performance Tests**: Load and stress testing

This documentation provides a comprehensive overview of the Creativity Journal codebase, its architecture, and key functionality. For specific implementation details, refer to the individual source files and their inline documentation. 