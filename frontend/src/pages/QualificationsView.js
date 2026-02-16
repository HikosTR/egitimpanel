import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, User, Tag, Newspaper, ArrowLeft, ChevronRight } from 'lucide-react';

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

export default function QualificationsView() {
  const { api } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/qualifications')
      .then(res => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  const resolveUrl = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? `${BACKEND_URL}${url}` : url;
  };

  const getCatLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val;

  const filtered = filter === 'all' ? posts : posts.filter(p => p.category === filter);

  // Get unique categories from posts
  const usedCategories = [...new Set(posts.map(p => p.category))];

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="qualifications-view">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 pt-16 lg:pt-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#00C853]/10 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-[#00C853]" />
            </div>
            <h1
              className="text-4xl font-bold text-[#111111] uppercase tracking-tight"
              style={{ fontFamily: 'Barlow Condensed' }}
              data-testid="qualifications-title"
            >
              Kalifikasyon
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-[52px]">Oduller, duyurular ve basari hikayeleri</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8" data-testid="category-filters">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              filter === 'all'
                ? 'bg-[#111111] text-white'
                : 'bg-white text-gray-500 hover:bg-gray-100 shadow-sm'
            }`}
            data-testid="filter-all"
          >
            Tumu ({posts.length})
          </button>
          {CATEGORIES.filter(c => usedCategories.includes(c.value)).map(cat => {
            const count = posts.filter(p => p.category === cat.value).length;
            const catStyle = categoryColors[cat.value];
            return (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === cat.value
                    ? 'shadow-md'
                    : 'bg-white text-gray-500 hover:bg-gray-100 shadow-sm'
                }`}
                style={filter === cat.value ? { backgroundColor: catStyle.bg, color: catStyle.text } : {}}
                data-testid={`filter-${cat.value}`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tight mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                Henuz Icerik Yok
              </h3>
              <p className="text-gray-500 text-sm">Bu kategoride henuz yazi paylasilmamis.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Featured - First Post */}
            {filtered.length > 0 && (
              <Card
                className="bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden mb-8 cursor-pointer group animate-fadeIn"
                onClick={() => setSelectedPost(filtered[0])}
                data-testid={`featured-post-${filtered[0].id}`}
              >
                <div className="flex flex-col md:flex-row">
                  {filtered[0].cover_image ? (
                    <div className="md:w-1/2 h-56 md:h-auto bg-gray-100 overflow-hidden">
                      <img
                        src={resolveUrl(filtered[0].cover_image)}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="md:w-1/2 h-56 md:h-auto bg-gradient-to-br from-[#111111] to-[#222222] flex items-center justify-center">
                      <Newspaper className="w-16 h-16 text-white/20" />
                    </div>
                  )}
                  <CardContent className="flex-1 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: (categoryColors[filtered[0].category] || categoryColors.genel).text, backgroundColor: (categoryColors[filtered[0].category] || categoryColors.genel).bg }}
                      >
                        {getCatLabel(filtered[0].category)}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {filtered[0].created_at ? new Date(filtered[0].created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <h2
                      className="text-3xl font-bold text-[#111111] uppercase tracking-tight mb-3 group-hover:text-[#00C853] transition-colors"
                      style={{ fontFamily: 'Barlow Condensed' }}
                    >
                      {filtered[0].title}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">{filtered[0].content}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <User className="w-3 h-3" /> {filtered[0].author_name}
                      </p>
                      <span className="text-xs text-[#00C853] font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                        Devamini Oku <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )}

            {/* Rest of posts - Grid */}
            {filtered.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.slice(1).map((post, i) => {
                  const catStyle = categoryColors[post.category] || categoryColors.genel;
                  return (
                    <Card
                      key={post.id}
                      className="bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer group animate-fadeIn"
                      style={{ animationDelay: `${i * 80}ms` }}
                      onClick={() => setSelectedPost(post)}
                      data-testid={`post-card-${post.id}`}
                    >
                      {post.cover_image ? (
                        <div className="h-44 bg-gray-100 overflow-hidden">
                          <img
                            src={resolveUrl(post.cover_image)}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="h-44 bg-gradient-to-br from-[#111111] to-[#1a1a1a] flex items-center justify-center">
                          <Newspaper className="w-10 h-10 text-white/15" />
                        </div>
                      )}
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: catStyle.text, backgroundColor: catStyle.bg }}
                          >
                            {getCatLabel(post.category)}
                          </span>
                        </div>
                        <h3
                          className="text-lg font-bold text-[#111111] uppercase tracking-tight mb-2 group-hover:text-[#00C853] transition-colors line-clamp-2"
                          style={{ fontFamily: 'Barlow Condensed' }}
                        >
                          {post.title}
                        </h3>
                        <p className="text-gray-500 text-xs line-clamp-3 mb-3">{post.content}</p>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author_name}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.created_at ? new Date(post.created_at).toLocaleDateString('tr-TR') : ''}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Post Detail Dialog */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0" data-testid="post-detail-dialog">
            {selectedPost && (
              <>
                {selectedPost.cover_image && (
                  <div className="w-full h-64 bg-gray-100 overflow-hidden">
                    <img src={resolveUrl(selectedPost.cover_image)} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: (categoryColors[selectedPost.category] || categoryColors.genel).text,
                        backgroundColor: (categoryColors[selectedPost.category] || categoryColors.genel).bg
                      }}
                    >
                      {getCatLabel(selectedPost.category)}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> {selectedPost.author_name}
                    </span>
                  </div>
                  <h1
                    className="text-3xl sm:text-4xl font-bold text-[#111111] uppercase tracking-tight mb-6"
                    style={{ fontFamily: 'Barlow Condensed' }}
                    data-testid="post-detail-title"
                  >
                    {selectedPost.title}
                  </h1>
                  <div className="prose max-w-none">
                    {selectedPost.content?.split('\n').map((paragraph, i) => (
                      <p key={i} className="text-gray-600 text-sm leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
