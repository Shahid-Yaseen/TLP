-- Phase 4: User Management & Authentication
-- This migration creates tables for user authentication, RBAC, and JWT tokens

-- 6.1 Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- admin, writer, moderator, user
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.3 Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- create_article, publish_article, manage_users, etc.
    resource TEXT, -- articles, launches, users, etc.
    action TEXT, -- create, read, update, delete, publish
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.4 Role-Permission Relationship
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 6.5 User-Role Relationship
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 6.6 JWT Tokens (for refresh tokens)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to comments.user_id now that users table exists
-- This completes the comments table setup from Phase 3
ALTER TABLE comments
    ADD CONSTRAINT fk_comments_user_id 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;

