# Like2Win - Raffle Participation Tracking Platform

A comprehensive full-stack application for managing raffle participation on Farcaster with Base network integration. Built with Next.js 14, TypeScript, PostgreSQL, and OnchainKit.

## 🎯 Overview

Like2Win enables users to participate in bi-weekly raffles by engaging with Farcaster posts. The platform tracks user interactions (likes, comments, recasts) and awards raffle tickets based on engagement level. Winners are selected using weighted random selection based on ticket count.

### Key Features

- **Farcaster Integration**: Native Farcaster authentication and post tracking
- **Base Network Support**: Built on Base with OnchainKit integration
- **Flexible Engagement**: Different requirements for users with/without tip allowance
- **Real-time Tracking**: Live raffle status and leaderboard updates
- **Interactive Frames**: Farcaster frames for seamless participation
- **Comprehensive API**: Full REST API with validation and error handling

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Next.js API routes, PostgreSQL, Zod validation
- **Blockchain**: Base network, OnchainKit, Viem, Wagmi
- **Authentication**: Wallet-based + Farcaster authentication
- **Database**: PostgreSQL with comprehensive schema
- **Styling**: TailwindCSS with class-variance-authority

### Project Structure

```
my-minikit-app/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── frames/              # Farcaster frame endpoints
│   │   ├── raffle/              # Raffle management
│   │   └── users/               # User management
│   ├── components/              # React components
│   └── contexts/                # React contexts
├── components/                   # Reusable UI components
│   └── ui/                      # Base UI components
├── lib/                         # Core utilities
│   ├── database/               # Database utilities and types
│   ├── services/               # Business logic services
│   ├── validation/             # Input validation schemas
│   ├── errors/                 # Error handling system
│   ├── config/                 # Configuration management
│   └── utils/                  # Helper utilities
├── scripts/                     # Database and deployment scripts
└── docs/                       # Additional documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Farcaster Hub API access
- OnchainKit API key
- WalletConnect project ID

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-minikit-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=like2win
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your_password
   
   # App Configuration
   NEXT_PUBLIC_VERCEL_URL=your-domain.com
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_key
   NEXT_PUBLIC_CDP_PROJECT_ID=your_cdp_project_id
   NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
   
   # Farcaster
   FARCASTER_HUB_URL=https://hub-api.neynar.com
   FARCASTER_API_KEY=your_farcaster_api_key
   LIKE2WIN_FID=your_farcaster_fid
   
   # Security
   FRAME_SECRET=your_32_character_secret_here
   ```

4. **Set up the database**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Seed with initial data (optional)
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Database Schema

### Core Tables

#### Users
Stores user information from Farcaster and wallet connections.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fid BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  display_name VARCHAR(255),
  pfp_url TEXT,
  wallet_address VARCHAR(42),
  tip_allowance_enabled BOOLEAN DEFAULT false,
  is_following_like2win BOOLEAN DEFAULT false,
  total_lifetime_tickets INTEGER DEFAULT 0,
  custody_address VARCHAR(42),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Raffles
Manages raffle periods and prize information.

```sql
CREATE TABLE raffles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status raffle_status DEFAULT 'upcoming',
  prize_pool DECIMAL(18,2) DEFAULT 0,
  prize_currency VARCHAR(10) DEFAULT 'DEGEN',
  total_tickets INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  winners_selected BOOLEAN DEFAULT false,
  winner_selection_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Posts
Tracks eligible Farcaster posts for raffle participation.

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cast_hash VARCHAR(66) UNIQUE NOT NULL,
  author_fid BIGINT NOT NULL,
  content TEXT NOT NULL,
  post_url TEXT,
  required_engagement engagement_type DEFAULT 'like_comment_recast',
  tickets_per_participation INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  raffle_id UUID REFERENCES raffles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Features

- **Comprehensive indexes** for optimal query performance
- **Database functions** for complex status calculations
- **Views** for commonly accessed data combinations
- **Triggers** for automatic data updates
- **Foreign key constraints** for data integrity

## 🔧 API Reference

### Authentication

All API endpoints support both wallet-based and Farcaster-based authentication.

#### Get User by FID
```
GET /api/users/fid/[fid]
```

Response:
```json
{
  "success": true,
  "data": {
    "fid": 12345,
    "username": "johndoe",
    "display_name": "John Doe",
    "tip_allowance_enabled": false,
    "is_following_like2win": true,
    "total_lifetime_tickets": 15
  }
}
```

### Raffle Management

#### Get Current Raffle Status
```
GET /api/raffle/status?fid=12345
```

#### Participate in Raffle
```
POST /api/raffle/participate
Content-Type: application/json

{
  "user_fid": 12345,
  "post_cast_hash": "0xabcd...",
  "engagement_type": "like_comment_recast",
  "engagement_data": {
    "has_liked": true,
    "has_commented": true,
    "has_recasted": true
  }
}
```

#### Get Leaderboard
```
GET /api/raffle/leaderboard?limit=10
```

### Farcaster Frames

#### Raffle Status Frame
```
GET /api/frames/raffle-status
POST /api/frames/raffle-status
```

#### Participation Frame
```
GET /api/frames/participate?hash=0xabcd...
POST /api/frames/participate?hash=0xabcd...
```

## 🎮 Usage Guide

### For Users

1. **Connect Your Account**
   - Connect via wallet or Farcaster authentication
   - Follow @Like2Win on Farcaster to become eligible

2. **Participate in Raffles**
   - Engage with official Like2Win posts
   - Requirements depend on your tip allowance status:
     - **Tip allowance enabled**: Like only
     - **Standard users**: Like + Comment + Recast

3. **Track Your Progress**
   - View your current tickets and ranking
   - Check raffle end time and prize pool
   - Monitor your participation history

### For Developers

#### Adding New API Endpoints

1. Create the endpoint in `app/api/`
2. Use validation schemas from `lib/validation/schemas.ts`
3. Implement business logic in `lib/services/`
4. Handle errors using `lib/errors/`

Example:
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/errors';
import { validateAndParse, ExampleSchema } from '@/lib/validation/schemas';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const data = await request.json();
  const validatedData = validateAndParse(ExampleSchema, data);
  
  // Business logic here
  
  return NextResponse.json({ success: true, data: result });
});
```

#### Creating New UI Components

1. Use the base components in `components/ui/`
2. Follow the established patterns with TypeScript and JSDoc
3. Use class-variance-authority for variant management

Example:
```typescript
// components/MyComponent.tsx
/**
 * My Component
 * 
 * Description of what this component does.
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const MyComponent: React.FC<MyComponentProps> = ({ ...props }) => {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>My Component</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
};
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Database Testing

```bash
# Reset test database
npm run db:reset

# Run database migrations for testing
npm run db:migrate -- --env test
```

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@host:port/db
   NEXT_PUBLIC_VERCEL_URL=your-production-domain.com
   # ... other production variables
   ```

2. **Build and Deploy**
   ```bash
   # Build the application
   npm run build
   
   # Start production server
   npm run start
   ```

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database Migration

```bash
# Run migrations in production
npm run db:migrate -- --env production
```

## 📝 Configuration

### Feature Flags

Enable/disable features using configuration:

```typescript
// lib/config/index.ts
export const featureFlags = {
  enableFrames: true,
  enableWalletAuth: true,
  enableFarcasterAuth: true,
  enableCaching: true,
  // ... other flags
};
```

### Raffle Configuration

```typescript
export const raffleConfig = {
  defaults: {
    ticketsPerParticipation: 1,
    prizeCurrency: 'DEGEN',
    defaultPrizePool: 1000,
  },
  schedule: {
    days: [0, 3], // Sunday and Wednesday
    hour: 20, // 8PM UTC
    duration: 72, // 72 hours
  },
};
```

## 🔍 Monitoring and Debugging

### Logging

The application includes comprehensive logging:

```typescript
import { ErrorLogger } from '@/lib/errors';

// Log errors with context
ErrorLogger.logAPIError(error, req, userId);
```

### Database Monitoring

Monitor slow queries and connection health:

```typescript
import { getPoolStats, healthCheck } from '@/lib/database/connection';

// Get pool statistics
const stats = getPoolStats();

// Perform health check
const health = await healthCheck();
```

### Error Handling

All errors are centrally handled with appropriate logging and user-friendly messages:

```typescript
import { AppError, ValidationError } from '@/lib/errors';

// Throw custom errors
throw new ValidationError('Invalid input', validationErrors);
```

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow the established patterns
- Add JSDoc documentation for all functions
- Use the existing error handling patterns
- Follow the component structure guidelines

### Commit Messages

Use conventional commit format:
```
feat: add new raffle participation endpoint
fix: resolve database connection timeout
docs: update API documentation
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database configuration
   npm run db:health-check
   ```

2. **Environment Variables**
   ```bash
   # Validate environment setup
   npm run validate-env
   ```

3. **Frame Validation Errors**
   - Ensure FRAME_SECRET is at least 32 characters
   - Verify Farcaster Hub URL is accessible

### Getting Help

- Check the [Issues](../../issues) for common problems
- Review the [API Documentation](#api-reference)
- Examine the [Database Schema](#database-schema)

## 🙏 Acknowledgments

- Built with [OnchainKit](https://onchainkit.xyz/)
- Powered by [Base](https://base.org/)
- Integrated with [Farcaster](https://farcaster.xyz/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)

---

**Like2Win** - Bringing fair and transparent raffles to the Farcaster ecosystem! 🎫✨
