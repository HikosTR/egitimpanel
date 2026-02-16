import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Upload, Image, Calendar, User, Tag, Newspaper } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { value: 'genel', label: 'Genel' },
  { value: 'odul', label: 'Odul' },
  { value: 'kalifikasyon', label: 'Kalifikasyon' },
  { value: 'duyuru', label: 'Duyuru' },
  { value: 'motivasyon', label: 'Motivasyon' },
  { value: 'basari', label: 'Basari Hikayesi' },
];

const categoryColors = {
  genel: { bg: '#F1F5F9', text: '#64748B' },
  odul: { bg: '#FEF3C7', text: '#D97706' },
  kalifikasyon: { bg: '#DCFCE7', text: '#16A34A' },
  duyuru: { bg: '#DBEAFE', text: '#2563EB' },
  motivasyon: { bg: '#F3E8FF', text: '#7C3AED' },
  basari: { bg: '#FEE2E2', text: '#DC2626' },
};

export default function QualificationsManage() {
  const { api } = useAuth();
  const imageInputRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    cover_image: '',
    content: '',
    category: 'genel'
  });

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    try {
      const res = await api.get('/qualifications');
      setPosts(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editPost) {
        await api.put(`/qualifications/${editPost.id}`, form);
        toast.success('Yazi guncellendi');
      } else {
        await api.post('/qualifications', form);
        toast.success('Yazi olusturuldu');
      }
      setDialogOpen(false);
      setEditPost(null);
      setForm({ title: '', cover_image: '', content: '', category: 'genel' });
      loadPosts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Islem basarisiz');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu yaziyi silmek istediginize emin misiniz?')) return;
    try {
      await api.delete(`/qualifications/${id}`);
      toast.success('Yazi silindi');
      loadPosts();
    } catch (err) { toast.error('Silme basarisiz'); }
  };

  const openEdit = (post) => {
    setEditPost(post);
    setForm({ title: post.title, cover_image: post.cover_image || '', content: post.content || '', category: post.category || 'genel' });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditPost(null);
    setForm({ title: '', cover_image: '', content: '', category: 'genel' });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/qualifications/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(prev => ({ ...prev, cover_image: res.data.url }));
      toast.success('Resim yuklendi');
    } catch (err) { toast.error('Resim yukleme basarisiz'); }
    finally { setUploading(false); }
  };

  const resolveUrl = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? `${BACKEND_URL}${url}` : url;
  };

  const getCatLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val;

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="qualifications-manage">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 pt-16 lg:pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-[#111111] uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Kalifikasyon
            </h1>
            <p className="text-gray-500 mt-1 text-sm">{posts.length} yazi</p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs shadow-md"
            data-testid="add-post-btn"
          >
            <Plus className="w-4 h-4 mr-2" /> Yeni Yazi
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tight mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                Henuz Yazi Yok
              </h3>
              <p className="text-gray-500 text-sm">Ilk kalifikasyon yazisini olusturmak icin yukardaki butonu kullanin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => {
              const catStyle = categoryColors[post.category] || categoryColors.genel;
              return (
                <Card
                  key={post.id}
                  className="bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden animate-fadeIn"
                  style={{ animationDelay: `${i * 60}ms` }}
                  data-testid={`post-manage-${post.id}`}
                >
                  <div className="flex">
                    {post.cover_image && (
                      <div className="w-48 h-36 flex-shrink-0 bg-gray-100">
                        <img src={resolveUrl(post.cover_image)} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="flex-1 p-5 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: catStyle.text, backgroundColor: catStyle.bg }}
                          >
                            {getCatLabel(post.category)}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.created_at ? new Date(post.created_at).toLocaleDateString('tr-TR') : ''}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#111111] uppercase tracking-tight mb-1 truncate" style={{ fontFamily: 'Barlow Condensed' }}>
                          {post.title}
                        </h3>
                        <p className="text-gray-500 text-xs line-clamp-2">{post.content}</p>
                        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                          <User className="w-3 h-3" /> {post.author_name}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEdit(post)}
                          className="p-2 text-gray-400 hover:text-[#00C853] hover:bg-[#00C853]/10 rounded-lg transition-all"
                          data-testid={`edit-post-${post.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          data-testid={`delete-post-${post.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="post-dialog">
            <DialogHeader>
              <DialogTitle className="text-xl uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                {editPost ? 'Yazi Duzenle' : 'Yeni Yazi'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {editPost ? 'Yazi bilgilerini guncelleyin' : 'Kalifikasyon yazisi olusturun'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              {/* Cover Image */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Kapak Resmi</Label>
                <div className="flex items-start gap-4">
                  <div className="w-40 h-24 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {form.cover_image ? (
                      <img src={resolveUrl(form.cover_image)} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <Button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploading}
                      size="sm"
                      className="bg-[#111111] hover:bg-[#222222] text-white text-xs uppercase tracking-wider w-fit"
                      data-testid="upload-cover-btn"
                    >
                      {uploading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      ) : (
                        <Upload className="w-3 h-3 mr-1" />
                      )}
                      Resim Yukle
                    </Button>
                    <Input
                      value={form.cover_image}
                      onChange={e => setForm({ ...form, cover_image: e.target.value })}
                      placeholder="veya resim URL'si girin..."
                      className="h-9 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853] text-xs"
                      data-testid="cover-url-input"
                    />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Baslik</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Yazinin basligi..."
                  className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                  data-testid="post-title-input"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Kategori</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-11 bg-[#F5F7FA] border-0" data-testid="post-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Icerik</Label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={8}
                  placeholder="Yazinin icerigi..."
                  className="w-full px-4 py-3 rounded-lg bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853] focus:outline-none text-sm resize-y min-h-[120px]"
                  data-testid="post-content-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs"
                data-testid="post-submit-btn"
              >
                {editPost ? 'Guncelle' : 'Yayinla'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
