# REVO - Sports Facility Booking Platform

REVO is a sports facility booking platform for discovering and reserving courts in Ahmedabad and across India.

![REVO system architecture](./REVO_system_architecture.png)
## Features

### For Users

- **Facility Discovery**: Browse and search sports facilities
- **Real-time Booking**: Book facilities with instant confirmation
- **User Analytics**: Track booking history and preferences
- **Profile Management**: Comprehensive user profiles with location data

### For Facility Owners

- **Analytics Dashboard**: Comprehensive revenue, booking, and occupancy analytics
- **Facility Management**: Manage facilities, amenities, and availability
- **Revenue Tracking**: Monitor total revenue and booking growth
- **Occupancy Insights**: Track facility utilization rates

### For Administrators

- **User Management**: Complete user analytics and management system
- **Activity Logs**: Comprehensive logging and monitoring
- **Report Management**: Handle user and facility reports
- **System Analytics**: Platform-wide insights and metrics

### Security & Monitoring

- **Activity Logging**: Detailed audit trails
- **Report System**: User and facility reporting capabilities

## Technology Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI component library
- **Lucide React** - Icon library

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database toolkit and ORM
- **Authentication** - Custom auth implementation
- **OpenTelemetry** - Observability and monitoring

### Database

- **SQLite** - Temporary local database (via Prisma)

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **pnpm** - Package manager
  
## Project Structure

```
revo/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   ├── admin/                   # Admin dashboard pages
│   ├── owner/                   # Owner dashboard pages
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── admin/                   # Admin-specific components
│   ├── owner/                   # Owner-specific components
│   └── ui/                      # Shared UI components
├── hooks/                       # Custom React hooks
│   └── swr/                     # SWR data fetching hooks
├── lib/                         # Utility libraries
│   └── docs/                    # API documentation
├── prisma/                      # Database schema and local SQLite database
├── types/                       # TypeScript type definitions
├── scripts/                     # Database seeding scripts
└── public/                      # Static assets
```

## Setup & Installation

### Prerequisites

- Node.js 18+
- pnpm
- SQLite (managed automatically by Prisma)

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd revo
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Configure your environment variables in `.env`

4. **Database setup**

   ```bash
   # Create or update the temporary SQLite database
   pnpm db:setup

   # Seed the database
   pnpm tsx scripts/seed-amenities.ts
   ```

5. **Start development server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Key Features Breakdown

### Analytics System

- Revenue tracking and growth metrics
- Booking analytics with growth indicators
- Occupancy rate calculations
- User behavior analytics
- Real-time dashboard updates

### User Management

- Comprehensive user profiles
- Location-based services
- Phone and email verification
- Activity tracking and logging
- Role-based access control

### Booking System

- Real-time availability checking
- Instant booking confirmation
- Facility amenity management
- Pricing and discount systems
- Booking history tracking

### Reporting & Moderation

- User report system
- Facility quality reports
- Admin moderation tools
- Automated fraud detection
- Appeal and resolution workflows

## Security Features

- **Activity Logging**: Comprehensive audit trails
- **Authentication**: Secure user authentication system
- **Data Validation**: Input validation and sanitization
- **Rate Limiting**: API rate limiting and abuse prevention

## Monitoring & Analytics

- **OpenTelemetry**: Tracing and metrics
- **Activity Logs**: Detailed user and system activity tracking
- **Performance Monitoring**: Real-time performance insights
