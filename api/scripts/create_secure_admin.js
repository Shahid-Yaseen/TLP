#!/usr/bin/env node

/**
 * Create Secure Admin User Script
 * 
 * Creates or updates an admin user with validated email and secure password.
 * This script ensures proper email format and password strength.
 * 
 * Usage:
 *   node scripts/create_secure_admin.js
 *   node scripts/create_secure_admin.js --email admin@example.com --password MySecurePass123!
 *   node scripts/create_secure_admin.js --email admin@example.com (will generate secure password)
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const readline = require('readline');
const { getPool } = require('../config/database');

const pool = getPool();

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  return { valid: true, email: trimmedEmail };
}

/**
 * Check password strength
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
    };
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  // Check for common weak passwords
  const commonPasswords = ['password', 'admin', '123456', 'qwerty', 'letmein'];
  const lowerPassword = password.toLowerCase();
  if (commonPasswords.some(weak => lowerPassword.includes(weak))) {
    return { valid: false, error: 'Password is too common or weak' };
  }

  return { valid: true };
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(length = 16) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one of each required character type
  let password = '';
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += special[crypto.randomInt(special.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
}

/**
 * Prompt user for input
 */
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Prompt for password (hidden input) - simplified version
 * Note: For better security, use command line arguments or environment variables
 */
function promptPassword(question) {
  return prompt(question);
}

/**
 * Main function to create admin user
 */
async function createSecureAdmin() {
  try {
    console.log('🔐 Secure Admin User Creation Script\n');
    console.log('This script will create or update an admin user with validated credentials.\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    let email = null;
    let password = null;
    let generatePassword = false;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--email' && args[i + 1]) {
        email = args[i + 1];
        i++;
      } else if (args[i] === '--password' && args[i + 1]) {
        password = args[i + 1];
        i++;
      } else if (args[i] === '--generate-password') {
        generatePassword = true;
      }
    }

    // Get email
    if (!email) {
      email = await prompt('Enter admin email: ');
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      console.error(`❌ Email validation failed: ${emailValidation.error}`);
      process.exit(1);
    }
    email = emailValidation.email;
    console.log(`✅ Email validated: ${email}\n`);

    // Get or generate password
    if (generatePassword || !password) {
      if (!password) {
        const useGenerated = await prompt('Generate secure password? (y/n): ');
        if (useGenerated.toLowerCase() === 'y' || useGenerated.toLowerCase() === 'yes') {
          generatePassword = true;
        }
      }

      if (generatePassword) {
        password = generateSecurePassword(16);
        console.log(`\n✅ Generated secure password: ${password}`);
        console.log('⚠️  IMPORTANT: Save this password securely! It will not be shown again.\n');
      } else {
        password = await prompt('Enter password: ');
      }
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.error(`❌ Password validation failed: ${passwordValidation.error}`);
      console.error('\nPassword requirements:');
      console.error(`  - Minimum ${PASSWORD_REQUIREMENTS.minLength} characters`);
      console.error(`  - At least one uppercase letter`);
      console.error(`  - At least one lowercase letter`);
      console.error(`  - At least one number`);
      console.error(`  - At least one special character`);
      process.exit(1);
    }
    console.log('✅ Password validated\n');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed\n');

    // Check if admin role exists
    const { rows: roleRows } = await pool.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    if (roleRows.length === 0) {
      console.log('⚠️  Admin role not found. Creating admin role...');
      const { rows: newRoleRows } = await pool.query(
        "INSERT INTO roles (name, description) VALUES ('admin', 'Administrator with full access') RETURNING id"
      );
      roleRows.push(newRoleRows[0]);
      console.log('✅ Admin role created\n');
    }

    const roleId = roleRows[0].id;

    // Check if user exists
    const { rows: userRows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    let userId;
    if (userRows.length > 0) {
      userId = userRows[0].id;
      // Update existing user
      await pool.query(
        'UPDATE users SET password_hash = $1, is_active = true, email_verified = true, updated_at = NOW() WHERE id = $2',
        [passwordHash, userId]
      );
      console.log('✅ Updated existing user');
    } else {
      // Create new user
      const username = email.split('@')[0]; // Use email prefix as username
      const { rows } = await pool.query(
        'INSERT INTO users (username, email, password_hash, is_active, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [username, email, passwordHash, true, true]
      );
      userId = rows[0].id;
      console.log('✅ Created new user');
    }

    // Assign admin role
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, roleId]
    );
    console.log('✅ Assigned admin role\n');

    // Display credentials
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 Admin Account Created Successfully!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n⚠️  SECURITY REMINDER:');
    console.log('   - Save these credentials securely');
    console.log('   - Do not share these credentials');
    console.log('   - Change the password regularly');
    console.log('   - Use a password manager\n');

    await pool.end();
    console.log('✨ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createSecureAdmin().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { createSecureAdmin, validateEmail, validatePassword, generateSecurePassword };
