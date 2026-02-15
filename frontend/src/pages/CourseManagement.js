import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, BookOpen, Layers, Video } from 'lucide-react';

export default function CourseManagement() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', thumbnail: '', passing_rate: 80 });

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCourse) {
        await api.put(`/courses/${editCourse.id}`, form);
        toast.success('Egitim guncellendi');
      } else {
        await api.post('/courses', form);
        toast.success('Egitim olusturuldu');
      }
      setDialogOpen(false);
      setEditCourse(null);
      setForm({ title: '', description: '', thumbnail: '', passing_rate: 80 });
      loadCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Islem basarisiz');
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Bu egitimi ve tum icerigini silmek istediginize emin misiniz?')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      toast.success('Egitim silindi');
      loadCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Silme basarisiz');
    }
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setForm({ title: c.title, description: c.description, thumbnail: c.thumbnail || '', passing_rate: c.passing_rate });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditCourse(null);
    setForm({ title: '', description: '', thumbnail: '', passing_rate: 80 });
    setDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="course-management">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-[#111111] uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Egitim Yonetimi
            </h1>
            <p className="text-gray-500 mt-1 text-sm">{courses.length} egitim</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openCreate}
                className="bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs shadow-md"
                data-testid="add-course-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> Egitim Olustur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" data-testid="course-dialog">
              <DialogHeader>
                <DialogTitle className="text-xl uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                  {editCourse ? 'Egitim Duzenle' : 'Yeni Egitim'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Egitim Adi</Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                    className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                    data-testid="course-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Aciklama</Label>
                  <Input
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                    data-testid="course-desc-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Thumbnail URL</Label>
                  <Input
                    value={form.thumbnail}
                    onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                    placeholder="https://..."
                    className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                    data-testid="course-thumb-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Quiz Gecme Orani (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.passing_rate}
                    onChange={e => setForm({ ...form, passing_rate: parseInt(e.target.value) || 80 })}
                    className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                    data-testid="course-rate-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs"
                  data-testid="course-submit-btn"
                >
                  {editCourse ? 'Guncelle' : 'Olustur'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tight mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                Henuz Egitim Yok
              </h3>
              <p className="text-gray-500 text-sm">Ilk egitimi olusturmak icin yukardaki butonu kullanin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <Card
                key={course.id}
                className="bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden animate-fadeIn group"
                style={{ animationDelay: `${i * 80}ms` }}
                data-testid={`course-item-${course.id}`}
              >
                <div
                  className="h-36 bg-gradient-to-br from-[#111111] to-[#1a1a1a] relative overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/admin/courses/${course.id}`)}
                >
                  {course.thumbnail && (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover opacity-30" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-white/40 group-hover:text-[#00C853] transition-colors" />
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3
                    className="text-lg font-bold text-[#111111] uppercase tracking-tight mb-1 cursor-pointer hover:text-[#00C853] transition-colors"
                    style={{ fontFamily: 'Barlow Condensed' }}
                    onClick={() => navigate(`/admin/courses/${course.id}`)}
                  >
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-xs mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {course.module_count || 0} Modul</span>
                      <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {course.video_count || 0} Video</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(course)}
                        className="p-2 text-gray-400 hover:text-[#00C853] hover:bg-[#00C853]/10 rounded-lg transition-all"
                        data-testid={`edit-course-${course.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        data-testid={`delete-course-${course.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
