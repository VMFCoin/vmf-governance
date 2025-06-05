# Supabase Setup Guide for VMF Governance

## Overview

This guide will help you set up the required database tables and storage buckets for the VMF Governance application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your Supabase project URL and anon key (already configured in `.env`)

## Step 1: Database Setup

1. **Open your Supabase project dashboard**

   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project: `hpkonxigdayboocvdpnf`

2. **Run the SQL setup script**
   - Go to the **SQL Editor** in your Supabase dashboard
   - Copy the contents of `supabase-setup.sql`
   - Paste and run the script
   - This will create:
     - `user_profiles` table
     - `charities` table
     - Proper indexes and security policies
     - Sample charity data

## Step 2: Storage Buckets Setup

### Create Avatars Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Set the following:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Enabled
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`

### Create Charities Bucket

1. Click **New bucket** again
2. Set the following:
   - **Name**: `charities`
   - **Public bucket**: ✅ Enabled
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`

## Step 3: Storage Policies

The storage policies should be automatically created, but verify these exist:

### Avatars Bucket Policies

- **"Allow public read access"** - SELECT for public users
- **"Allow authenticated upload"** - INSERT for authenticated users
- **"Allow users to update their own avatars"** - UPDATE for authenticated users

### Charities Bucket Policies

- **"Allow public read access"** - SELECT for public users
- **"Allow authenticated upload"** - INSERT for authenticated users

## Step 4: Verify Setup

1. **Test the connection**

   - Start your development server: `npm run dev`
   - Navigate to `/test-supabase` in your browser
   - Run the connection and profile tests
   - All tests should pass ✅

2. **Test profile creation**
   - Connect your wallet
   - Try creating a profile through the UI
   - Upload an avatar to test storage

## Troubleshooting

### Common Issues

**"relation does not exist" errors:**

- Make sure you ran the SQL setup script completely
- Check that tables were created in the `public` schema

**Storage upload errors:**

- Verify buckets are created with public access
- Check that storage policies allow uploads
- Ensure file size is under 5MB

**Connection errors:**

- Verify your `.env.local` has the correct Supabase URL and anon key
- Make sure your Supabase project is not paused

### Environment Variables

Your `.env.local` should have:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hpkonxigdayboocvdpnf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwa29ueGlnZGF5Ym9vY3ZkcG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMjY2OTUsImV4cCI6MjA2NDYwMjY5NX0.fHOc4wUWboTAqChkF15486fIG1dLUiLm_hd3luP34S0
```

## Database Schema

### user_profiles table

```sql
- id: UUID (Primary Key)
- wallet_address: TEXT (Unique)
- name: TEXT (Optional)
- avatar_url: TEXT (Optional)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### charities table

```sql
- id: UUID (Primary Key)
- name: TEXT
- website: TEXT
- logo_url: TEXT
- mission: TEXT
- description: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Next Steps

Once setup is complete:

1. Test profile creation and avatar upload
2. Verify charity data is populated
3. Test the ProfileButton dropdown functionality
4. All profile-related features should now work correctly

## Support

If you encounter issues:

1. Check the browser console for specific error messages
2. Verify all setup steps were completed
3. Test the connection using `/test-supabase` page
4. Check Supabase dashboard logs for server-side errors
