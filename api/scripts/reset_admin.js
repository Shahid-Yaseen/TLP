const bcrypt = require('bcrypt');
const { Client } = require('pg');
require('dotenv').config({ path: '/Users/muhammadshahid/Desktop/projects/TLP_P2/TLP/api/.env' });

async function resetPassword() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });

    try {
        await client.connect();
        const passwordHash = await bcrypt.hash('Password123!', 10);
        const res = await client.query(
            "UPDATE users SET password_hash = $1 WHERE email = 'admin@test.com'",
            [passwordHash]
        );
        console.log('Password reset successfully for admin@test.com');
        // Also ensure the user is verified
        await client.query("UPDATE users SET is_email_verified = true WHERE email = 'admin@test.com'");
        console.log('User set to verified.');
    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await client.end();
    }
}

resetPassword();
