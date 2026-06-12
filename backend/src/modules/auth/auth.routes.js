const express = require('express');
const { z } = require('zod');
const validate = require('../../middleware/validate');
const authController = require('./auth.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// Vietnam phone number regex: +84 or 0 followed by 9 digits (total 10 digits for 0x, +84 is 11 chars)
const phoneRegex = /^(?:\+84|0)[35789]\d{8}$/;

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .refine((val) => /[a-z]/.test(val), 'Password must contain at least one lowercase letter')
      .refine((val) => /[A-Z]/.test(val), 'Password must contain at least one uppercase letter')
      .refine((val) => /[0-9]/.test(val), 'Password must contain at least one number'),
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must not exceed 50 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must not exceed 50 characters'),
    phone: z.string().regex(phoneRegex, 'Invalid Vietnamese phone number (must start with +84 or 0, followed by 9 digits)'),
    dateOfBirth: z.string().optional().or(z.literal('')),
    nationality: z.string().max(100).optional().or(z.literal('')),
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

const refreshSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Refresh token is required')
  })
});

const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/admin/login', validate(loginSchema), authController.loginAdmin);
router.post('/refresh-token', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);

module.exports = router;
