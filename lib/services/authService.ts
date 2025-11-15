/**
 * Authentication Service
 * 
 * This is a PORTABLE service layer - it has NO dependencies on Next.js
 * All functions accept plain arguments and return data
 * This can be easily moved to a separate Node.js/Express backend later
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface User {
  id: number;
  email: string;
  company_name: string;
  vat_id?: string;
  billing_address: any;
  created_at: Date;
  updated_at: Date;
}

export interface SignupData {
  email: string;
  password: string;
  company_name: string;
  vat_id?: string;
  billing_address?: any;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Create a new user account
 */
export async function signup(data: SignupData): Promise<AuthResult> {
  const { email, password, company_name, vat_id, billing_address } = data;

  // Validate input
  if (!email || !password || !company_name) {
    return {
      success: false,
      message: 'Email, password, and company name are required',
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      message: 'Invalid email format',
    };
  }

  // Validate password strength
  if (password.length < 8) {
    return {
      success: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return {
        success: false,
        message: 'User with this email already exists',
      };
    }

    // Hash the password
    const password_hash = await hashPassword(password);

    // Insert new user
    const result = await query(
      `INSERT INTO users (email, password_hash, company_name, vat_id, billing_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, company_name, vat_id, billing_address, created_at, updated_at`,
      [
        email.toLowerCase(),
        password_hash,
        company_name,
        vat_id || null,
        billing_address || {},
      ]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email);

    return {
      success: true,
      message: 'User created successfully',
      user,
      token,
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      message: 'An error occurred during signup',
    };
  }
}

/**
 * Authenticate a user and generate a token
 */
export async function login(data: LoginData): Promise<AuthResult> {
  const { email, password } = data;

  if (!email || !password) {
    return {
      success: false,
      message: 'Email and password are required',
    };
  }

  try {
    // Find user by email
    const result = await query(
      `SELECT id, email, password_hash, company_name, vat_id, billing_address, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Remove password_hash from user object
    const { password_hash, ...userWithoutPassword } = user;

    // Generate token
    const token = generateToken(user.id, user.email);

    return {
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An error occurred during login',
    };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number): Promise<User | null> {
  try {
    const result = await query(
      `SELECT id, email, company_name, vat_id, billing_address, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await query(
      `SELECT id, email, company_name, vat_id, billing_address, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updates: Partial<Pick<User, 'company_name' | 'vat_id' | 'billing_address'>>
): Promise<AuthResult> {
  const allowedFields = ['company_name', 'vat_id', 'billing_address'];
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  let paramCounter = 1;

  // Build dynamic update query
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateFields.push(`${key} = $${paramCounter}`);
      updateValues.push(value);
      paramCounter++;
    }
  }

  if (updateFields.length === 0) {
    return {
      success: false,
      message: 'No valid fields to update',
    };
  }

  updateValues.push(userId);

  try {
    const result = await query(
      `UPDATE users
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCounter}
       RETURNING id, email, company_name, vat_id, billing_address, created_at, updated_at`,
      updateValues
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0],
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: 'An error occurred while updating profile',
    };
  }
}

/**
 * Change user password
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<AuthResult> {
  if (!currentPassword || !newPassword) {
    return {
      success: false,
      message: 'Current password and new password are required',
    };
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      message: 'New password must be at least 8 characters long',
    };
  }

  try {
    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const { password_hash } = result.rows[0];

    // Verify current password
    const isValid = await verifyPassword(currentPassword, password_hash);

    if (!isValid) {
      return {
        success: false,
        message: 'Current password is incorrect',
      };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: 'An error occurred while changing password',
    };
  }
}

