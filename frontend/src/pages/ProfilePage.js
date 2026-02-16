import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { LevelBadge } from '@/pages/AdminDashboard';
import { UserCircle, Award, Download, BookOpen, Trophy } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProfilePage() {
  const { user, api } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [certsRes, progRes] = await Promise.all([
        api.get(`/certificates/user/${user.id}`),
        api.get(`/progress/user/${user.id}`)
      ]);
      setCertificates(certsRes.data);
      setProgress(progRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const levelLabels = {
    baslangic: 'Baslangic',
    aktif_distributor: 'Aktif Distributor',
    takim_kurucu: 'Takim Kurucu',
    lider: 'Lider',
    elite_leader: 'Elite Leader'
  };

  const levelProgress = {
    baslangic: 0,
    aktif_distributor: 20,
    takim_kurucu: 40,
    lider: 60,
    elite_leader: 100
  };

  const badgeLabels = {
    founder: 'Kurucu',
    ilk_egitim: 'Ilk Egitim',
    uc_egitim: 'Uc Egitim',
    elite: 'Elite'
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="profile-page">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 pt-16 lg:pt-10">
        <h1 className="text-4xl font-bold text-[#111111] uppercase tracking-tight mb-10" style={{ fontFamily: 'Barlow Condensed' }}>
          Profil
        </h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <Card className="bg-white shadow-sm lg:col-span-1" data-testid="profile-info-card">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-[#00C853]/10 flex items-center justify-center mx-auto mb-4">
                  <UserCircle className="w-12 h-12 text-[#00C853]" />
                </div>
                <h2 className="text-2xl font-bold text-[#111111] uppercase tracking-tight mb-1" style={{ fontFamily: 'Barlow Condensed' }}>
                  {user?.full_name}
                </h2>
                <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
                <LevelBadge level={user?.level} />

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 uppercase tracking-wider font-semibold">Seviye Ilerlemesi</span>
                    <span className="text-[#00C853] font-bold">{levelLabels[user?.level]}</span>
                  </div>
                  <Progress value={levelProgress[user?.level] || 0} className="h-2 bg-gray-100" />
                </div>

                {user?.badges?.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Rozetler</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {user.badges.map((badge, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                          data-testid={`badge-${badge}`}
                        >
                          <Trophy className="w-3 h-3" /> {badgeLabels[badge] || badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {user?.upper_leader && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Ust Lider</p>
                    <p className="text-sm text-[#111111] mt-1">{user.upper_leader}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Courses & Certificates */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Progress */}
              <Card className="bg-white shadow-sm" data-testid="course-progress-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tight mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
                    Egitim Ilerlemesi
                  </h3>
                  {progress.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Henuz egitim atanmamis</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {progress.map((p, i) => (
                        <div key={i} className="p-4 rounded-lg bg-gray-50">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-semibold text-sm text-[#111111]">{p.course?.title}</h4>
                            <span className="text-xs text-[#00C853] font-bold">%{Math.round(p.percentage)}</span>
                          </div>
                          <Progress value={p.percentage} className="h-2 bg-gray-200" />
                          <p className="text-xs text-gray-400 mt-2">{p.completed}/{p.total_videos} video tamamlandi</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Certificates */}
              <Card className="bg-white shadow-sm" data-testid="certificates-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tight mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
                    Sertifikalar
                  </h3>
                  {certificates.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Henuz sertifika kazanilmamis</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {certificates.map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50" data-testid={`cert-${cert.id}`}>
                          <div className="flex items-center gap-3">
                            <Award className="w-6 h-6 text-[#F59E0B]" />
                            <div>
                              <p className="font-semibold text-sm text-[#111111]">{cert.course_title}</p>
                              <p className="text-xs text-gray-500">
                                {cert.completed_at ? new Date(cert.completed_at).toLocaleDateString('tr-TR') : ''}
                              </p>
                            </div>
                          </div>
                          <a
                            href={`${BACKEND_URL}/api/certificates/${cert.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#00C853] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#00B848] transition-colors"
                            data-testid={`download-cert-${cert.id}`}
                          >
                            <Download className="w-3 h-3" /> Indir
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
