# How to Find Authentication Settings in Supabase Dashboard

## Step-by-Step Guide

### 1. Access Your Production Supabase Project
- Go to [supabase.com](https://supabase.com)
- Click "Sign in" 
- Navigate to your **production** project (not local/dev)

### 2. Look for Authentication Settings

#### Option A: Standard Layout
1. **Left sidebar** → Click "Authentication"
2. **Sub-menu appears** → Click "Settings"
3. **Look for these fields:**
   - Site URL
   - Redirect URLs

#### Option B: Alternative Layout
1. **Left sidebar** → Click "Authentication" 
2. **Sub-menu** → Click "Configuration"
3. **Look for URL settings**

#### Option C: Newer Dashboard Layout
1. **Left sidebar** → Click "Auth"
2. **Top tabs** → Click "Settings" or "Configuration"
3. **Scroll down** to find URL settings

#### Option D: Settings Icon
1. **Left sidebar** → Click "Authentication"
2. **Look for gear icon** ⚙️ near the top
3. **Click the gear icon**

### 3. What You're Looking For

You should see fields like:
- **Site URL** (currently might be empty or wrong)
- **Redirect URLs** (list of allowed URLs)
- **Additional Redirect URLs** (some versions)

### 4. If You Still Can't Find It

#### Check Your Permissions
- Make sure you're the **owner** or **admin** of the project
- Some settings are only visible to project owners

#### Try Different Browsers
- Sometimes browser extensions block certain UI elements
- Try incognito/private mode

#### Check Supabase Version
- Older Supabase projects might have different UI layouts
- The settings are always there, just might be named differently

### 5. Common Alternative Names

These settings might be called:
- **Authentication Settings**
- **Auth Configuration** 
- **URL Configuration**
- **Redirect Settings**
- **Authentication URLs**

### 6. Screenshots Location

The settings are typically in a section that looks like:

```
Authentication
├── Users
├── Policies  
├── Settings ← HERE
├── Providers
└── Logs
```

Or:

```
Auth
├── Users
├── Configuration ← HERE
├── Providers
└── Logs
```

### 7. If All Else Fails

**Contact Supabase Support:**
- Go to your dashboard
- Look for "Support" or "Help" 
- Ask them to help you locate authentication URL settings

**Or use the CLI method** (see `update-auth-config.sh` script)

## Quick Visual Check

When you find the right page, you should see:
- **Site URL**: A text input field
- **Redirect URLs**: A text area or list where you can add URLs
- **Save** or **Update** button

## Success Indicators

You've found the right place if:
- ✅ You can see a field labeled "Site URL"
- ✅ You can see a field for "Redirect URLs" 
- ✅ There's a save/update button
- ✅ You might see your current URLs (possibly wrong ones)

## What to Enter

Once you find it:
- **Site URL**: `https://waffle.cryptosi.org`
- **Redirect URLs**: `https://waffle.cryptosi.org/auth/confirm`

Click **Save** or **Update** when done! 