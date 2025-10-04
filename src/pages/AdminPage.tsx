import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

// Local types (no database)
type SpecType =
  | 'Cardiology'
  | 'Dermatology'
  | 'Neurology'
  | 'Pediatrics'
  | 'Orthopedics'
  | 'General Medicine'
  | 'Psychiatry'
  | 'Gynecology';

interface DoctorRow {
  id: string; // generated locally
  full_name: string;
  phone: string | null;
  specialization: SpecType;
  department: string;
  consultation_fee: number;
  bio?: string | null;
}

interface WithdrawalRow {
  id: string;
  doctor_id: string; // refers to DoctorRow.id
  amount: number;
  method: 'bank' | 'upi' | 'paypal';
  account_ref: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  processed_at: string | null;
}

// LocalStorage helpers
const LS_KEYS = {
  admin: 'admin_logged_in',
  doctors: 'doctors_list',
  withdrawals: 'withdrawal_requests',
} as const;

const readLS = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLS = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const AdminPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Admin auth (local)
  const [admin, setAdmin] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Doctors state (local)
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [docSearch, setDocSearch] = useState('');
  const [regOpen, setRegOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState<SpecType>('General Medicine');
  const [department, setDepartment] = useState('General');
  const [fee, setFee] = useState<string>('0');
  const [bio, setBio] = useState<string>('');

  // Withdrawals state (local)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState<boolean>(false);

  useEffect(() => {
    const logged = readLS<boolean>(LS_KEYS.admin, false);
    setAdmin(!!logged);
    const docs = readLS<DoctorRow[]>(LS_KEYS.doctors, []);
    setDoctors(docs);
    const wds = readLS<WithdrawalRow[]>(LS_KEYS.withdrawals, []);
    setWithdrawals(wds);
  }, []);

  const filteredDoctors = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(d =>
      d.full_name.toLowerCase().includes(q) ||
      (d.phone || '').toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q)
    );
  }, [doctors, docSearch]);

  const handleLogin = () => {
    if (username === 'admin@123' && password === '1011110') {
      writeLS(LS_KEYS.admin, true);
      setAdmin(true);
      toast({ title: 'Logged in', description: 'Welcome, admin' });
    } else {
      toast({ title: 'Invalid credentials', description: 'Please try again', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    writeLS(LS_KEYS.admin, false);
    setAdmin(false);
  };

  const openRegistration = () => {
    setRegOpen(true);
  };

  const submitRegistration = () => {
    const feeNum = parseFloat(fee || '0');
    if (!fullName.trim() || !specialization || !department.trim() || feeNum < 0) {
      toast({ title: 'Invalid form', description: 'Fill all fields with valid values', variant: 'destructive' });
      return;
    }
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    const newDoc: DoctorRow = {
      id,
      full_name: fullName.trim(),
      phone: phone ? phone.trim() : null,
      specialization,
      department: department.trim(),
      consultation_fee: feeNum,
      bio: bio ? bio.trim() : null,
    };
    const next = [newDoc, ...doctors];
    setDoctors(next);
    writeLS(LS_KEYS.doctors, next);
    toast({ title: 'Doctor registered' });
    setRegOpen(false);
    setFullName('');
    setPhone('');
    setBio('');
    setFee('0');
    setDepartment('General');
    setSpecialization('General Medicine');
  };

  const updateWithdrawal = (id: string, status: WithdrawalRow['status']) => {
    setLoadingWithdrawals(true);
    const next = withdrawals.map(w =>
      w.id === id
        ? {
            ...w,
            status,
            processed_at:
              status === 'approved' || status === 'rejected' || status === 'paid'
                ? new Date().toISOString()
                : w.processed_at,
          }
        : w
    );
    setWithdrawals(next);
    writeLS(LS_KEYS.withdrawals, next);
    setLoadingWithdrawals(false);
    toast({ title: 'Updated', description: `Withdrawal ${status}` });
  };

  if (!admin) {
    return (
      <div data-no-osk className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin@123" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="1011110" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleLogin}>Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-no-osk className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doctor Registration */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-end justify-between gap-4">
                  <div className="w-full">
                    <Label htmlFor="search">Search doctors (name/phone/department/specialization)</Label>
                    <Input id="search" placeholder="Type to filter" value={docSearch} onChange={(e) => setDocSearch(e.target.value)} />
                  </div>
                  <Button onClick={openRegistration}>Add Doctor</Button>
                </div>
              </div>
              <div className="border rounded-md max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.full_name}</TableCell>
                        <TableCell>{d.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge>{d.specialization}</Badge>
                        </TableCell>
                        <TableCell>{d.department}</TableCell>
                        <TableCell>₹{Number(d.consultation_fee).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingWithdrawals ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : withdrawals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No withdrawal requests.</p>
              ) : (
                <div className="border rounded-md max-h-[28rem] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Created</TableHead>
                        <TableHead>Doctor ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Account Ref</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map(w => (
                        <TableRow key={w.id}>
                          <TableCell className="text-xs">{new Date(w.created_at).toLocaleString()}</TableCell>
                          <TableCell className="text-xs break-all">{w.doctor_id}</TableCell>
                          <TableCell>₹{Number(w.amount).toFixed(2)}</TableCell>
                          <TableCell className="uppercase">{w.method}</TableCell>
                          <TableCell className="text-xs break-all">{w.account_ref}</TableCell>
                          <TableCell>
                            <Badge variant={w.status === 'pending' ? 'secondary' : w.status === 'approved' || w.status === 'paid' ? 'default' : 'destructive'}>
                              {w.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="outline" disabled={w.status !== 'pending'} onClick={() => updateWithdrawal(w.id, 'approved')}>Approve</Button>
                            <Button size="sm" variant="outline" disabled={w.status !== 'pending'} onClick={() => updateWithdrawal(w.id, 'rejected')}>Reject</Button>
                            <Button size="sm" onClick={() => updateWithdrawal(w.id, 'paid')} disabled={!(w.status === 'approved' || w.status === 'pending')}>Mark Paid</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={regOpen} onOpenChange={setRegOpen}>
        <DialogContent data-no-osk>
          <DialogHeader>
            <DialogTitle>Register Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Select value={specialization} onValueChange={(v) => setSpecialization(v as SpecType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Cardiology','Dermatology','Neurology','Pediatrics','Orthopedics','General Medicine','Psychiatry','Gynecology'].map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Consultation Fee</Label>
                <Input type="number" min={0} step={0.01} value={fee} onChange={(e) => setFee(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bio (optional)</Label>
                <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegOpen(false)}>Cancel</Button>
            <Button onClick={submitRegistration}>Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
