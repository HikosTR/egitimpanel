import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { LevelBadge } from '@/pages/AdminDashboard';
import { toast } from 'sonner';
import { UserPlus, Trash2, Edit, Search } from 'lucide-react';

export default function UserManagement() {
  const { user: currentUser, api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'distributor', upper_leader: '' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const update = { ...form };
        if (!update.password) delete update.password;
        await api.put(`/users/${editUser.id}`, update);
        toast.success('Kullanici guncellendi');
      } else {
        await api.post('/users', form);
        toast.success('Kullanici olusturuldu');
      }
      setDialogOpen(false);
      setEditUser(null);
      setForm({ email: '', password: '', full_name: '', role: 'distributor', upper_leader: '' });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Islem basarisiz');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Bu kullaniciyi silmek istediginize emin misiniz?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('Kullanici silindi');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Silme basarisiz');
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ email: u.email, password: '', full_name: u.full_name, role: u.role, upper_leader: u.upper_leader || '' });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ email: '', password: '', full_name: '', role: 'distributor', upper_leader: '' });
    setDialogOpen(true);
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleLabels = { super_admin: 'Super Admin', admin: 'Admin', distributor: 'Distributor' };

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="user-management">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-[#111111] uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Kullanici Yonetimi
            </h1>
            <p className="text-gray-500 mt-1 text-sm">{users.length} kullanici</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openCreate}
                className="bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs shadow-md"
                data-testid="add-user-btn"
              >
                <UserPlus className="w-4 h-4 mr-2" /> Kullanici Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" data-testid="user-dialog">
              <DialogHeader>
                <DialogTitle className="text-xl uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                  {editUser ? 'Kullanici Duzenle' : 'Yeni Kullanici'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Ad Soyad</Label>
                  <Input
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    required
                    className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                    data-testid="user-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">E-Posta</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                    data-testid="user-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    {editUser ? 'Yeni Sifre (bos birakilabilir)' : 'Sifre'}
                  </Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required={!editUser}
                    className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                    data-testid="user-password-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Rol</Label>
                  <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                    <SelectTrigger className="h-11 bg-[#F5F7FA] border-0" data-testid="user-role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      {currentUser.role === 'super_admin' && <SelectItem value="admin">Admin</SelectItem>}
                      {currentUser.role === 'super_admin' && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Ust Lider (Opsiyonel)</Label>
                  <Select value={form.upper_leader || 'none'} onValueChange={v => setForm({ ...form, upper_leader: v === 'none' ? '' : v })}>
                    <SelectTrigger className="h-11 bg-[#F5F7FA] border-0" data-testid="user-leader-select">
                      <SelectValue placeholder="Sec..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Yok</SelectItem>
                      {users.filter(u => u.role !== 'distributor').map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs"
                  data-testid="user-submit-btn"
                >
                  {editUser ? 'Guncelle' : 'Olustur'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white shadow-sm" data-testid="users-table-card">
          <CardContent className="p-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Kullanici ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                data-testid="user-search-input"
              />
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="users-table">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">Ad Soyad</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">E-Posta</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">Rol</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">Seviye</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">Islemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-[#111111]">{u.full_name}</td>
                        <td className="py-3 px-4 text-gray-500">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            {roleLabels[u.role]}
                          </span>
                        </td>
                        <td className="py-3 px-4"><LevelBadge level={u.level} /></td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-2 text-gray-400 hover:text-[#00C853] hover:bg-[#00C853]/10 rounded-lg transition-all"
                              data-testid={`edit-user-${u.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {u.id !== currentUser.id && (
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                data-testid={`delete-user-${u.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
