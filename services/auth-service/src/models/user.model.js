// user model - all the db stuff for users

const { query, getClient } = require('../db/connection');
const bcrypt = require('bcrypt');
const config = require('../config');
const logger = require('../utils/logger');

// find user by email
async function findByEmail(email) {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

// find by id
async function findById(id) {
  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

// create new user - hashes password automatically
async function create(userData) {
  const { email, password, firstName, lastName, role = 'user' } = userData;
  
  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
  
  const result = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, first_name, last_name, role, is_active, is_email_verified, created_at`,
    [email.toLowerCase(), passwordHash, firstName, lastName, role]
  );
  
  return result.rows[0];
}

// check password
async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// update last login time and reset failed attempts
async function updateLastLogin(userId) {
  await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP, failed_login_attempts = 0 WHERE id = $1',
    [userId]
  );
}

// track failed logins
async function incrementFailedAttempts(userId) {
  const result = await query(
    `UPDATE users 
     SET failed_login_attempts = failed_login_attempts + 1
     WHERE id = $1
     RETURNING failed_login_attempts`,
    [userId]
  );
  return result.rows[0]?.failed_login_attempts || 0;
}

// lock account after too many fails
async function lockAccount(userId, lockDurationMinutes = 30) {
  // yeah this is a bit ugly with the string interpolation but its just a number so its fine
  await query(
    `UPDATE users 
     SET locked_until = CURRENT_TIMESTAMP + INTERVAL '${lockDurationMinutes} minutes'
     WHERE id = $1`,
    [userId]
  );
  logger.warn(`Account locked for user ${userId} for ${lockDurationMinutes} minutes`);
}

// check if locked
function isAccountLocked(user) {
  if (!user.locked_until) return false;
  return new Date(user.locked_until) > new Date();
}

// unlock account
async function unlockAccount(userId) {
  await query(
    'UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = $1',
    [userId]
  );
}

// update profile - only allows certain fields
async function updateProfile(userId, updates) {
  const allowedFields = ['first_name', 'last_name'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    // convert camelCase to snake_case
    const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(dbField)) {
      setClauses.push(`${dbField} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }
  
  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  values.push(userId);
  
  const result = await query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, email, first_name, last_name, role, is_active, is_email_verified, created_at, updated_at`,
    values
  );
  
  return result.rows[0];
}

// change password
async function changePassword(userId, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
  
  await query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [passwordHash, userId]
  );
}

// soft delete basically
async function deactivate(userId) {
  await query(
    'UPDATE users SET is_active = false WHERE id = $1',
    [userId]
  );
}

// log auth events for security auditing
async function logAudit(auditData) {
  const { userId, action, ipAddress, userAgent, details } = auditData;
  
  await query(
    `INSERT INTO auth_audit_log (user_id, action, ip_address, user_agent, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, ipAddress, userAgent, JSON.stringify(details)]
  );
}

// remove sensitive stuff before sending to client
function sanitizeUser(user) {
  if (!user) return null;
  
  // destructure out the stuff we dont want to expose
  const {
    password_hash,
    email_verification_token,
    password_reset_token,
    password_reset_expires,
    failed_login_attempts,
    locked_until,
    ...safeUser
  } = user;
  
  return safeUser;
}

module.exports = {
  findByEmail,
  findById,
  create,
  verifyPassword,
  updateLastLogin,
  incrementFailedAttempts,
  lockAccount,
  isAccountLocked,
  unlockAccount,
  updateProfile,
  changePassword,
  deactivate,
  logAudit,
  sanitizeUser
};
