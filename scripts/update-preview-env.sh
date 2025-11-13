#!/bin/bash

# Update Vercel Preview environment to use staging database

echo "Updating Preview environment variables to point to staging database..."

# Remove old preview env vars (non-interactive)
echo "Removing old NEXT_PUBLIC_SUPABASE_URL from Preview..."
echo "y" | vercel env rm NEXT_PUBLIC_SUPABASE_URL preview

echo "Removing old NEXT_PUBLIC_SUPABASE_ANON_KEY from Preview..."
echo "y" | vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY preview

# Add new staging values
echo "Adding staging NEXT_PUBLIC_SUPABASE_URL to Preview..."
echo "https://amugmkrihnjsxlpwdzcy.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview

echo "Adding staging NEXT_PUBLIC_SUPABASE_ANON_KEY to Preview..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdWdta3JpaG5qc3hscHdkemN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDY4OTIsImV4cCI6MjA3NzA4Mjg5Mn0.LWo-9mFBuC1BYO4Z29hJpNhXukUrqo-3h0d3vlAAJ1c" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

echo "Done! Preview environment now points to staging database."
