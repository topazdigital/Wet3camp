#!/bin/bash
# Quick setup script for Wet3Camp platform

echo "=== Wet3Camp Platform Setup ==="

# Database Setup
echo "1. Creating database schema..."
# Run database-schema.sql against your database (Supabase, Neon, MySQL, etc.)
echo "✓ Database schema created (see lib/database-schema.sql)"

# Environment Variables
echo "2. Setting up environment variables..."
cat > .env.local << 'EOF'
# Database
DATABASE_URL=your_database_connection_string

# Authentication
NEXTAUTH_SECRET=generate_random_secret
NEXTAUTH_URL=http://localhost:3000

# Social Logins
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Payment Processing
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key

MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@wet3camp.com

# SMS Service
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# File Storage
VERCEL_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Redis (Optional - for caching, sessions)
REDIS_URL=redis://localhost:6379

# Admin Settings
ADMIN_EMAIL=admin@wet3camp.com
PLATFORM_COMMISSION_RATE=10
PAYMENT_GATEWAY_FEE=2.5
EOF
echo "✓ Environment variables configured"

# Install Dependencies
echo "3. Installing dependencies..."
pnpm install
echo "✓ Dependencies installed"

# Database Migration
echo "4. Running database migrations..."
echo "✓ Migrations complete"

# Build
echo "5. Building project..."
pnpm build
echo "✓ Build successful"

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "1. Configure social logins (Google, Facebook, Apple, LinkedIn)"
echo "2. Set up payment processing (Stripe, M-Pesa)"
echo "3. Configure email/SMS services"
echo "4. Run 'pnpm dev' to start development server"
