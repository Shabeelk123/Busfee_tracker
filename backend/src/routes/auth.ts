import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Get user profile with role info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        class_id: profile.class_id,
        name: profile.name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        class_id: profile.class_id,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register (admin-only internal use)
router.post('/register', async (req, res: Response): Promise<void> => {
  const { name, email, password, role, class_id } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'Name, email, password and role are required' });
    return;
  }

  try {
    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      res.status(400).json({ error: authError?.message || 'Failed to create user' });
      return;
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name,
        email,
        role,
        class_id: class_id || null,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      res.status(400).json({ error: profileError.message });
      return;
    }

    res.status(201).json({ user: profile });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    res.json({ user: profile });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
