#!/bin/bash

# Update Supabase Authentication Configuration
# This script updates the Site URL and Redirect URLs for your production environment

echo "Updating Supabase Authentication Configuration..."

# You'll need to install Supabase CLI first if you haven't:
# npm install -g supabase

# Login to Supabase (you'll be prompted for credentials)
supabase login

# Link to your production project (replace with your actual project reference)
# You can find your project reference in your Supabase dashboard URL
# supabase link --project-ref YOUR_PROJECT_REF

# Update the authentication configuration
supabase auth update \
  --site-url "https://waffle.cryptosi.org" \
  --redirect-urls "https://waffle.cryptosi.org/auth/confirm"

echo "Authentication configuration updated!"
echo ""
echo "Site URL: https://waffle.cryptosi.org"
echo "Redirect URLs: https://waffle.cryptosi.org/auth/confirm"
echo ""
echo "Note: Changes may take a few minutes to propagate." 