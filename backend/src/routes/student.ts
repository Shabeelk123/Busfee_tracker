import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);
router.use(requireRole('STUDENT') as any);

// GET /api/student/profile
router.get('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;

  const { data: student, error } = await supabase
    .from('students')
    .select(`
      *,
      class:classes(id, name, section),
      bus:buses(id, bus_number, route, monthly_fee)
    `)
    .eq('user_id', userId)
    .single();

  if (error || !student) {
    res.status(404).json({ error: 'Student profile not found' }); return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', userId)
    .single();

  res.json({ student: { ...student, email: profile?.email } });
});

// GET /api/student/fees
router.get('/fees', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { year } = req.query;

  // Get student record
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

  const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

  const { data: fees, error } = await supabase
    .from('fee_records')
    .select('*')
    .eq('student_id', student.id)
    .eq('year', targetYear)
    .order('month');

  if (error) { res.status(400).json({ error: error.message }); return; }

  const total = fees?.length || 0;
  const paid = fees?.filter(f => f.is_paid).length || 0;
  const paidAmount = fees?.filter(f => f.is_paid).reduce((sum, f) => sum + f.amount, 0) || 0;
  const pendingAmount = fees?.filter(f => !f.is_paid).reduce((sum, f) => sum + f.amount, 0) || 0;

  res.json({
    fees,
    summary: {
      total,
      paid,
      unpaid: total - paid,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
    },
    year: targetYear,
  });
});

export default router;
