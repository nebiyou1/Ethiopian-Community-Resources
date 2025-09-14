# Database Setup Guide

This application uses PostgreSQL for data storage. During development, we use direct database connections for schema management and data operations, while the application uses API endpoints for all operations.

## Prerequisites

1. **PostgreSQL** installed and running
2. **Node.js** dependencies installed (`npm install`)

## Quick Setup

1. **Create Database**
   ```bash
   createdb ethiopian_community
   ```

2. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Initialize Database**
   ```bash
   npm run db:init
   ```

## Available Commands

- `npm run db:init` - Initialize database schema and migrate data
- `npm run db:reset` - Reset database and reinitialize
- `npm run db:migrate` - Migrate data from JSON file
- `npm run db:health` - Check database health
- `npm run db:backup` - Create backup of current data

## Database Schema

The database includes the following main tables:

- **users** - User authentication and role management
- **organizations** - Program organizations
- **programs** - Summer programs data
- **program_suggestions** - User suggestions for new programs or edits
- **suggestion_comments** - Comments on suggestions
- **user_favorites** - User favorite programs
- **program_views** - Analytics for program views
- **search_analytics** - Search analytics

## Default Users

The schema creates default admin users:

- **Admin**: `admin@ethiopiancommunity.org` / `admin123`
- **Data Admin**: `dataadmin@ethiopiancommunity.org` / `dataadmin123`

## Development Workflow

1. **Schema Changes**: Modify `database/schema.sql`
2. **Reset Database**: `npm run db:reset`
3. **Test Changes**: Use API endpoints or direct database queries
4. **Backup Data**: `npm run db:backup`

## API Endpoints

All application operations use these API endpoints:

- `GET /api/programs` - Get all programs
- `GET /api/programs/search` - Search programs with filters
- `GET /api/programs/filters` - Get available filter options
- `GET /api/programs/stats` - Get program statistics
- `GET /api/programs/:id` - Get specific program
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/suggestions/suggest-program` - Suggest new program
- `POST /api/suggestions/suggest-edit/:id` - Suggest program edit
- `GET /api/suggestions/suggestions` - Get suggestions (data admins)
- `POST /api/suggestions/suggestions/:id/review` - Review suggestion

## Troubleshooting

1. **Connection Issues**: Check PostgreSQL is running and credentials are correct
2. **Schema Errors**: Run `npm run db:reset` to recreate schema
3. **Data Issues**: Check JSON data format in `docs/inputdata.json`
4. **Permission Issues**: Ensure database user has CREATE/DROP privileges

## Production Considerations

- Use environment variables for all sensitive data
- Set up proper database backups
- Use connection pooling for better performance
- Enable SSL for database connections
- Set up proper indexes for production queries
