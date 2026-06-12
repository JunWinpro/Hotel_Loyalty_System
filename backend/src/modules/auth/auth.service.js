const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const redis = require('../../config/redis');
const { transporter } = require('../../config/email');
const crypto = require('crypto');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'local-jwt-access-secret-key-123456789';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'local-jwt-refresh-secret-key-123456789';

// Helper to generate access and refresh tokens
const generateTokens = async (userId, email, role) => {
  const tokenId = crypto.randomUUID();
  const accessToken = jwt.sign(
    { id: userId, email, role },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId, email, role, tokenId },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  // Store refresh token in Redis: key = refresh:{userId}:{tokenId}, value = true, EX = 30 days (2592000 seconds)
  await redis.set(`refresh:${userId}:${tokenId}`, 'true', 'EX', 30 * 24 * 60 * 60);

  return { accessToken, refreshToken, tokenId };
};

const registerGuest = async (data) => {
  const { email, password, firstName, lastName, phone, dateOfBirth, nationality } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if email exists
    const emailCheck = await client.query('SELECT id FROM guests WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      const err = new Error('Email already registered');
      err.status = 400;
      throw err;
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 3. Insert guest
    const guestInsert = await client.query(
      `INSERT INTO guests (email, password_hash, first_name, last_name, phone, date_of_birth, nationality)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name, phone, date_of_birth, nationality, created_at`,
      [email, passwordHash, firstName, lastName, phone, dateOfBirth || null, nationality || null]
    );

    const guest = guestInsert.rows[0];

    // 4. Fetch Silver tier ID
    const tierQuery = await client.query("SELECT id FROM membership_tiers WHERE name = 'Silver'");
    if (tierQuery.rows.length === 0) {
      throw new Error('Silver membership tier not found in database');
    }
    const silverTierId = tierQuery.rows[0].id;

    // 5. Insert guest membership
    await client.query(
      `INSERT INTO guest_memberships (guest_id, tier_id, total_nights, total_spend, current_points, lifetime_points)
       VALUES ($1, $2, 0, 0.00, 0, 0)`,
      [guest.id, silverTierId]
    );

    await client.query('COMMIT');

    // 6. Send welcome email (asynchronous, do not block)
    // We wrap it in a try-catch so it won't crash the request if SMTP fails
    transporter.sendMail({
      from: `"Hotel Loyalty" <${process.env.SMTP_USER || 'noreply@hotel.com'}>`,
      to: guest.email,
      subject: 'Welcome to Hotel Loyalty Program!',
      html: `<h1>Welcome ${guest.first_name} ${guest.last_name}!</h1>
             <p>Thank you for registering. You have been enrolled in our Silver tier membership.</p>`
    }).catch(err => {
      // Just log the error, don't crash
      console.error('Welcome email sending failed:', err);
    });

    return guest;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const loginGuest = async (email, password) => {
  const result = await pool.query(
    `SELECT g.*, m.name as tier_name, m.points_multiplier
     FROM guests g
     LEFT JOIN guest_memberships gm ON gm.guest_id = g.id
     LEFT JOIN membership_tiers m ON m.id = gm.tier_id
     WHERE g.email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const guest = result.rows[0];
  const isMatch = await bcrypt.compare(password, guest.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const { accessToken, refreshToken } = await generateTokens(guest.id, guest.email, 'guest');

  return {
    tokens: { accessToken, refreshToken },
    guest: {
      id: guest.id,
      email: guest.email,
      firstName: guest.first_name,
      lastName: guest.last_name,
      phone: guest.phone,
      tier: guest.tier_name,
      pointsMultiplier: guest.points_multiplier
    }
  };
};

const loginAdmin = async (email, password) => {
  const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const admin = result.rows[0];
  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const { accessToken, refreshToken } = await generateTokens(admin.id, admin.email, 'admin');

  return {
    tokens: { accessToken, refreshToken },
    admin: {
      id: admin.id,
      email: admin.email,
      firstName: admin.first_name,
      lastName: admin.last_name
    }
  };
};

const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    const { id: userId, email, role, tokenId } = decoded;

    // Check if refresh token is in Redis
    const exists = await redis.get(`refresh:${userId}:${tokenId}`);
    if (!exists) {
      const err = new Error('Refresh token revoked or expired');
      err.status = 401;
      throw err;
    }

    // Issue new access token
    const newAccessToken = jwt.sign(
      { id: userId, email, role },
      JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    return { accessToken: newAccessToken };
  } catch (err) {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }
};

const logoutGuest = async (userId, tokenId) => {
  await redis.del(`refresh:${userId}:${tokenId}`);
  return true;
};

module.exports = {
  registerGuest,
  loginGuest,
  loginAdmin,
  refreshToken,
  logoutGuest
};
