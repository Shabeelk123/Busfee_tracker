import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require auth + ADMIN role
router.use(authenticate as any);
router.use(requireRole('ADMIN') as any);

// =============================================
// CLASSES
// =============================================

// GET /api/admin/classes
router.get('/classes', async (_req, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      teacher:profiles!classes_teacher_id_fkey(id, name, email),
      students(count)
    `)
    .order('name');

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ classes: data });
});

// POST /api/admin/classes
router.post('/classes', async (req, res: Response): Promise<void> => {
  const { name, section, teacher_id } = req.body;
  if (!name) { res.status(400).json({ error: 'Class name is required' }); return; }

  const { data, error } = await supabase
    .from('classes')
    .insert({ name, section: section || '', teacher_id: teacher_id || null })
    .select()
    .single();

  if (error) { res.status(400).json({ error: error.message }); return; }

  // Update teacher's class_id in profiles
  if (teacher_id) {
    await supabase.from('profiles').update({ class_id: data.id }).eq('id', teacher_id);
  }

  res.status(201).json({ class: data });
});

// PUT /api/admin/classes/:id
router.put('/classes/:id', async (req, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, section, teacher_id } = req.body;

  // Clear old teacher's class assignment
  await supabase.from('profiles').update({ class_id: null }).eq('class_id', id);

  const { data, error } = await supabase
    .from('classes')
    .update({ name, section, teacher_id: teacher_id || null })
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(400).json({ error: error.message }); return; }

  if (teacher_id) {
    await supabase.from('profiles').update({ class_id: id }).eq('id', teacher_id);
  }

  res.json({ class: data });
});

// DELETE /api/admin/classes/:id
router.delete('/classes/:id', async (req, res: Response): Promise<void> => {
  const { id } = req.params;
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ message: 'Class deleted successfully' });
});

// =============================================
// TEACHERS
// =============================================

// GET /api/admin/teachers
router.get('/teachers', async (_req, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`*, class:classes!profiles_class_id_fkey(id, name, section)`)
    .eq('role', 'TEACHER')
    .order('name');

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ teachers: data });
});

// POST /api/admin/teachers - create teacher account
router.post('/teachers', async (req, res: Response): Promise<void> => {
  const { name, email, password, class_id } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email and password are required' });
    return;
  }

  // Create auth user
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
    .insert({ id: authData.user.id, name, email, role: 'TEACHER', class_id: class_id || null })
    .select()
    .single();

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    res.status(400).json({ error: profileError.message });
    return;
  }

  // Assign this teacher to the class
  if (class_id) {
    await supabase.from('classes').update({ teacher_id: authData.user.id }).eq('id', class_id);
  }

  res.status(201).json({ teacher: profile });
});

// DELETE /api/admin/teachers/:id
router.delete('/teachers/:id', async (req, res: Response): Promise<void> => {
  const { id } = req.params;
  await supabase.auth.admin.deleteUser(id);
  res.json({ message: 'Teacher deleted successfully' });
});

// =============================================
// BUSES
// =============================================

// GET /api/admin/buses
router.get('/buses', async (_req, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('buses')
    .select(`*, students(count)`)
    .order('bus_number');

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ buses: data });
});

// POST /api/admin/buses
router.post('/buses', async (req, res: Response): Promise<void> => {
  const { bus_number, route, monthly_fee } = req.body;
  if (!bus_number || monthly_fee === undefined) {
    res.status(400).json({ error: 'Bus number and monthly fee are required' });
    return;
  }

  const { data, error } = await supabase
    .from('buses')
    .insert({ bus_number, route: route || '', monthly_fee })
    .select()
    .single();

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.status(201).json({ bus: data });
});

// PUT /api/admin/buses/:id
router.put('/buses/:id', async (req, res: Response): Promise<void> => {
  const { id } = req.params;
  const { bus_number, route, monthly_fee } = req.body;

  const { data, error } = await supabase
    .from('buses')
    .update({ bus_number, route, monthly_fee })
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ bus: data });
});

// DELETE /api/admin/buses/:id
router.delete('/buses/:id', async (req, res: Response): Promise<void> => {
  const { id } = req.params;
  const { error } = await supabase.from('buses').delete().eq('id', id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ message: 'Bus deleted successfully' });
});

// =============================================
// STUDENTS
// =============================================

// GET /api/admin/students
router.get('/students', async (req, res: Response): Promise<void> => {
  const { class_id, bus_id } = req.query;

  let query = supabase
    .from('students')
    .select(`
      *,
      class:classes(id, name, section),
      bus:buses(id, bus_number, route, monthly_fee),
      profile:profiles!students_user_id_fkey(email)
    `)
    .order('name');

  if (class_id) query = query.eq('class_id', class_id as string);
  if (bus_id) query = query.eq('bus_id', bus_id as string);

  const { data, error } = await query;
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ students: data });
});

// =============================================
// FEE RECORDS
// =============================================

// GET /api/admin/fees
router.get('/fees', async (req, res: Response): Promise<void> => {
  const { month, year, class_id } = req.query;

  let query = supabase
    .from('fee_records')
    .select(`
      *,
      student:students(id, name, roll_no,
        class:classes(id, name, section),
        bus:buses(id, bus_number, monthly_fee)
      )
    `)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (month) query = query.eq('month', month as string);
  if (year) query = query.eq('year', year as string);

  const { data, error } = await query;
  if (error) { res.status(400).json({ error: error.message }); return; }

  // If class_id filter, filter in memory
  let fees = data || [];
  if (class_id) {
    fees = fees.filter((f: any) => f.student?.class?.id === class_id);
  }

  res.json({ fees });
});

// PATCH /api/admin/fees/:id — mark paid/unpaid
router.patch('/fees/:id', async (req, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_paid } = req.body;

  const { data, error } = await supabase
    .from('fee_records')
    .update({ is_paid, paid_at: is_paid ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ fee: data });
});

// GET /api/admin/fees/summary
router.get('/fees/summary', async (req, res: Response): Promise<void> => {
  const { year } = req.query;
  const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

  const { data: fees, error } = await supabase
    .from('fee_records')
    .select(`
      is_paid, amount, month,
      student:students(
        class:classes(id, name, section),
        bus:buses(id, bus_number)
      )
    `)
    .eq('year', targetYear);

  if (error) { res.status(400).json({ error: error.message }); return; }

  const total = fees?.length || 0;
  const paid = fees?.filter(f => f.is_paid).length || 0;
  const totalAmount = fees?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
  const paidAmount = fees?.filter(f => f.is_paid).reduce((sum, f) => sum + (f.amount || 0), 0) || 0;

  res.json({
    summary: {
      total,
      paid,
      unpaid: total - paid,
      collection_rate: total > 0 ? Math.round((paid / total) * 100) : 0,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: totalAmount - paidAmount,
    },
    year: targetYear,
  });
});

export default router;
