import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Lock, CheckCircle, PlayCircle, Award } from 'lucide-react';

export default function DistributorDashboard() {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, progressRes] = await Promise.all([
        api.get('/courses'),
        api.get(`/progress/user/${user.id}`)
      ]);
      setCourses(coursesRes.data);
      const pMap = {};
      progressRes.data.forEach(p => { pMap[p.course?.id] = p; });
      setProgressMap(pMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const levelLabels = {
    baslangic: 'Baslangic',
    aktif_distributor: 'Aktif Distributor',
    takim_kurucu: 'Takim Kurucu',
    lider: 'Lider',
    elite_leader: 'Elite Leader'
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="distributor-dashboard">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 pt-16 lg:pt-10">
        <div className="mb-10">
          <h1
            className="text-4xl font-bold text-[#111111] uppercase tracking-tight"
            style={{ fontFamily: 'Barlow Condensed' }}
            data-testid="dashboard-welcome"
          >
            Hos geldin, {user?.full_name}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Seviye: <span className="text-[#00C853] font-semibold">{levelLabels[user?.level] || 'Baslangic'}</span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="bg-white shadow-sm" data-testid="no-courses-card">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tight mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                Henuz Egitim Atanmadi
              </h3>
              <p className="text-gray-500 text-sm">Admininizle iletisime gecin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course, i) => {
              const prog = progressMap[course.id];
              const percentage = prog?.percentage || 0;
              const isCompleted = prog?.assignment?.completed;

              return (
                <Card
                  key={course.id}
                  className="bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden animate-fadeIn"
                  style={{ animationDelay: `${i * 100}ms` }}
                  onClick={() => navigate(`/course/${course.id}`)}
                  data-testid={`course-card-${course.id}`}
                >
                  <div className="h-40 bg-gradient-to-br from-[#111111] to-[#222222] relative overflow-hidden">
                    {course.thumbnail && (
                      <img src={course.thumbnail} alt="" className="w-full h-full object-cover opacity-40" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isCompleted ? (
                        <Award className="w-12 h-12 text-[#00C853]" />
                      ) : (
                        <PlayCircle className="w-12 h-12 text-white/60 group-hover:text-[#00C853] transition-colors" />
                      )}
                    </div>
                    {isCompleted && (
                      <div className="absolute top-3 right-3 bg-[#00C853] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Tamamlandi
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-[#111111] uppercase tracking-tight mb-1" style={{ fontFamily: 'Barlow Condensed' }}>
                      {course.title}
                    </h3>
                    <p className="text-gray-500 text-xs mb-4 line-clamp-2">{course.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">{course.module_count || 0} Modul - {course.video_count || 0} Video</span>
                        <span className="text-[#00C853] font-bold">%{Math.round(percentage)}</span>
                      </div>
                      <Progress value={percentage} className="h-2 bg-gray-100" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
