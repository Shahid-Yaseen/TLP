# Admin Account Setup Guide

## Overview

This guide explains how to create a secure admin account for the TLP Platform. The admin account is required to access protected endpoints like uploading crew member images.

## Quick Start

### Option 1: Interactive Mode (Recommended)

Run the script interactively and it will prompt you for email and password:

```bash
cd api
npm run create:admin
```

Or directly:

```bash
node scripts/create_secure_admin.js
```

### Option 2: Command Line Arguments

Provide email and password via command line:

```bash
node scripts/create_secure_admin.js --email admin@yourdomain.com --password YourSecurePassword123!
```

### Option 3: Auto-Generate Secure Password

Let the script generate a secure password for you:

```bash
node scripts/create_secure_admin.js --email admin@yourdomain.com --generate-password
```

## Email Requirements

- Must be a valid email format (e.g., `admin@example.com`)
- Maximum 254 characters
- Will be automatically converted to lowercase

## Password Requirements

The password must meet the following security requirements:

- **Minimum 12 characters** (recommended: 16+)
- **At least one uppercase letter** (A-Z)
- **At least one lowercase letter** (a-z)
- **At least one number** (0-9)
- **At least one special character** (!@#$%^&*()_+-=[]{}|;:,.<>?)
- **Cannot contain common weak passwords** (password, admin, 123456, etc.)

## Examples

### Example 1: Create admin with custom credentials

```bash
node scripts/create_secure_admin.js --email admin@tlp.com --password MySecurePass123!
```

### Example 2: Generate secure password

```bash
node scripts/create_secure_admin.js --email admin@tlp.com --generate-password
```

Output:
```
✅ Generated secure password: Kx9#mP2$vL8@nQ4!
⚠️  IMPORTANT: Save this password securely! It will not be shown again.
```

### Example 3: Interactive mode

```bash
npm run create:admin
```

Then follow the prompts:
```
Enter admin email: admin@tlp.com
✅ Email validated: admin@tlp.com

Generate secure password? (y/n): y
✅ Generated secure password: ...
```

## What the Script Does

1. **Validates email format** - Ensures the email is properly formatted
2. **Validates password strength** - Checks all security requirements
3. **Creates/updates user** - Creates a new user or updates existing one
4. **Ensures admin role exists** - Creates the admin role if it doesn't exist
5. **Assigns admin role** - Grants admin privileges to the user
6. **Hashes password** - Uses bcrypt with 12 rounds for secure password storage

## Troubleshooting

### Error: "Admin role not found"

If you see this error, run the roles seed script first:

```bash
npm run seed:roles
```

Then run the admin creation script again.

### Error: "Email validation failed"

- Check that the email format is correct (e.g., `user@domain.com`)
- Ensure the email is not too long (max 254 characters)

### Error: "Password validation failed"

Review the password requirements and ensure your password meets all criteria:
- Minimum 12 characters
- Contains uppercase, lowercase, numbers, and special characters
- Not a common weak password

### Error: Database connection failed

Ensure your `.env` file has the correct database credentials:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DATABASE`

## Security Best Practices

1. **Use a strong password** - Follow all password requirements
2. **Save credentials securely** - Use a password manager
3. **Don't share credentials** - Keep admin credentials private
4. **Change password regularly** - Update admin password periodically
5. **Use environment variables** - For production, consider using environment variables instead of command line arguments

## Using the Admin Account

After creating the admin account, you can:

1. **Login to Admin Dashboard** (if available):
   ```
   http://localhost:3001/admin
   ```

2. **Use API endpoints** that require admin role:
   - Upload crew member images: `POST /api/upload/crew`
   - Manage launches, articles, users, etc.

3. **Get JWT token** via login endpoint:
   ```bash
   curl -X POST http://localhost:3007/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@tlp.com","password":"YourPassword123!"}'
   ```

## Updating Admin Password

To update an existing admin user's password, simply run the script again with the same email:

```bash
node scripts/create_secure_admin.js --email admin@tlp.com --password NewSecurePassword123!
```

The script will update the existing user's password.

## Related Scripts

- `create_admin_user.js` - Basic admin creation (uses default credentials)
- `seed_roles_permissions.js` - Creates roles and permissions
- `setup_admin.js` - Alternative admin setup script
