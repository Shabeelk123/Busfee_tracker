import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);
router.use(requireRole('TEACHER') as any);

// GET /api/teacher/class-info
router.get('/class-info', async (req: AuthRequest, res: Response): Promise<void> => {
  const teacherId = req.user?.id;
  const classId = req.user?.class_id;

  if (!classId) {
    res.status(404).json({ error: 'No class assigned to this teacher' });
    return;
  }

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('id, name, section')
    .eq('id', classId)
    .single();

  if (classError || !cls) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }

  // Count students
  const { count: totalStudents } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId);

  // Get current month/year fee stats
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: currentMonthFees } = await supabase
    .from('fee_records')
    .select(`
      is_paid,
      student:students!fee_records_student_id_fkey(class_id)
    `)
    .eq('month', currentMonth)
    .eq('year', currentYear);

  // Filter fees for students in this class
  const { data: classStudents } = await supabase
    .from('students')
    .select('id')
    .eq('class_id', classId);

  const classStudentIds = new Set((classStudents || []).map((s: any) => s.id));

  const { data: classFees } = await supabase
    .from('fee_records')
    .select('is_paid, student_id')
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .in('student_id', [...classStudentIds]);

  const paidThisMonth = (classFees || []).filter((f: any) => f.is_paid).length;
  const unpaidThisMonth = (classFees || []).filter((f: any) => !f.is_paid).length;
  const collectionRate = (totalStudents || 0) > 0
    ? Math.round((paidThisMonth / (totalStudents || 1)) * 100)
    : 0;

  res.json({
    class: cls,
    stats: {
      total_students: totalStudents || 0,
      paid_this_month: paidThisMonth,
      unpaid_this_month: unpaidThisMonth,
      collection_rate: collectionRate,
    },
  });
});

// GET /api/teacher/students
router.get('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  const classId = req.user?.class_id;

  if (!classId) {
    res.status(404).json({ error: 'No class assigned' });
    return;
  }

  const { data: students, error } = await supabase
    .from('students')
    .select(`
      *,
      bus:buses(id, bus_number, route, monthly_fee),
      profile:profiles!students_user_id_fkey(email)
    `)
    .eq('class_id', classId)
    .order('name');

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ students });
});

// GET /api/teacher/students/:id/fees
router.get('/students/:id/fees', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { year } = req.query;
  const classId = req.user?.class_id;

  // Verify student belongs to teacher's class
  const { data: student } = await supabase
    .from('students')
    .select('id, name, roll_no, bus:buses(bus_number, monthly_fee)')
    .eq('id', id)
    .eq('class_id', classId as string)
    .single();

  if (!student) { res.status(404).json({ error: 'Student not found in your class' }); return; }

  const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

  const { data: fees, error } = await supabase
    .from('fee_records')
    .select('*')
    .eq('student_id', id)
    .eq('year', targetYear)
    .order('month');

  if (error) { res.status(400).json({ error: error.message }); return; }

  res.json({ student, fees, year: targetYear });
});

// PATCH /api/teacher/fees/:feeId — mark paid/unpaid
router.patch('/fees/:feeId', async (req: AuthRequest, res: Response): Promise<void> => {
  const { feeId } = req.params;
  const { is_paid } = req.body;
  const classId = req.user?.class_id;

  // Verify the fee record belongs to a student in teacher's class
  const { data: feeRecord } = await supabase
    .from('fee_records')
    .select(`
      id, student_id,
      student:students!fee_records_student_id_fkey(class_id)
    `)
    .eq('id', feeId)
    .single();

  if (!feeRecord) { res.status(404).json({ error: 'Fee record not found' }); return; }

  const studentClassId = (feeRecord.student as any)?.class_id;
  if (studentClassId !== classId) {
    res.status(403).json({ error: 'This student is not in your class' });
    return;
  }

  const { data: updated, error } = await supabase
    .from('fee_records')
    .update({ is_paid, paid_at: is_paid ? new Date().toISOString() : null })
    .eq('id', feeId)
    .select()
    .single();

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ fee: updated });
});

// POST /api/teacher/students — register student
router.post('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  const classId = req.user?.class_id;
  const { name, roll_no, bus_id, email, password } = req.body;

  if (!classId) { res.status(400).json({ error: 'No class assigned to this teacher' }); return; }
  if (!name || !roll_no || !email || !password) {
    res.status(400).json({ error: 'Name, roll number, email and password are required' });
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
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: authData.user.id, name, email, role: 'STUDENT', class_id: classId });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    res.status(400).json({ error: profileError.message });
    return;
  }

  // Create student record
  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert({
      user_id: authData.user.id,
      name,
      roll_no,
      class_id: classId,
      bus_id: bus_id || null,
    })
    .select()
    .single();

  if (studentError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    res.status(400).json({ error: studentError.message });
    return;
  }

  // Generate academic fee records (June to March = 10 months)
  // Academic months: 6,7,8,9,10,11,12,1,2,3
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  // Determine academic year start
  // If current month is Jun-Dec, academic year starts this year
  // If current month is Jan-Mar, academic year started last year
  const academicStartYear = currentMonth >= 6 ? now.getFullYear() : now.getFullYear() - 1;

  const feeMonths: { month: number; year: number }[] = [];
  const academicMonths = [6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  for (const month of academicMonths) {
    const yr = month >= 6 ? academicStartYear : academicStartYear + 1;
    feeMonths.push({ month, year: yr });
  }

  if (bus_id) {
    const { data: bus } = await supabase.from('buses').select('monthly_fee').eq('id', bus_id).single();
    const amount = (bus as any)?.monthly_fee || 0;

    const feeRecords = feeMonths.map(({ month, year }) => ({
      student_id: student.id,
      month,
      year,
      amount,
      is_paid: false,
    }));

    await supabase.from('fee_records').insert(feeRecords);
  }

  res.status(201).json({ student });
});

// GET /api/teacher/buses
router.get('/buses', async (_req: AuthRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('buses')
    .select('id, bus_number, route, monthly_fee')
    .order('bus_number');

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ buses: data });
});

export default router;
