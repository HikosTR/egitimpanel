import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { LevelBadge } from '@/pages/AdminDashboard';
import { Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';

export default function ReportsPage() {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    api.get('/users')
      .then(res => setUsers(res.data.filter(u => u.role === 'distributor')))
      .catch(console.error)
      .finally(() => setUsersLoading(false));
  }, [api]);

  const loadReport = async (userId) => {
    setSelectedUser(userId);
    if (!userId || userId === 'none') { setReport(null); return; }
    setLoading(true);
    try {
      const res = await api.get(`/reports/user/${userId}`);
      setReport(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="reports-page">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 pt-16 lg:pt-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#111111] uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
            Raporlar
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Kullanici bazli detayli raporlar</p>
        </div>

        <Card className="bg-white shadow-sm mb-6" data-testid="user-select-card">
          <CardContent className="p-6">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-2">Distributor Sec</label>
            <Select value={selectedUser || 'none'} onValueChange={v => loadReport(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full max-w-md h-11 bg-[#F5F7FA] border-0" data-testid="report-user-select">
                <SelectValue placeholder="Kullanici secin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sec...</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* User Info */}
            <Card className="bg-white shadow-sm" data-testid="report-user-info">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#00C853]/10 flex items-center justify-center text-[#00C853] font-bold text-lg">
                    {report.user?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#111111]">{report.user?.full_name}</h2>
                    <p className="text-sm text-gray-500">{report.user?.email}</p>
                  </div>
                  <div className="ml-auto">
                    <LevelBadge level={report.user?.level} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Reports */}
            {report.courses?.map((courseData, ci) => (
              <Card key={ci} className="bg-white shadow-sm animate-fadeIn" data-testid={`report-course-${ci}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                      {courseData.course?.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#00C853] font-bold">%{Math.round(courseData.percentage)}</span>
                      {courseData.assignment?.completed && (
                        <span className="px-2 py-1 bg-[#00C853]/10 text-[#00C853] text-xs font-bold rounded-full">Tamamlandi</span>
                      )}
                    </div>
                  </div>
                  <Progress value={courseData.percentage} className="h-2 bg-gray-100 mt-2" />
                </CardHeader>
                <CardContent>
                  {courseData.modules?.map((moduleData, mi) => (
                    <div key={mi} className="mb-4">
                      <h4 className="font-semibold text-sm text-[#111111] mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[#00C853]/10 text-[#00C853] flex items-center justify-center text-xs font-bold">
                          {mi + 1}
                        </span>
                        {moduleData.module?.title}
                      </h4>
                      <div className="ml-8 space-y-1">
                        {moduleData.videos?.map((vData, vi) => (
                          <div key={vi} className="flex items-center justify-between py-2 text-sm border-b border-gray-50">
                            <div className="flex items-center gap-2">
                              {vData.progress?.video_watched ? (
                                <CheckCircle className="w-4 h-4 text-[#00C853]" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-300" />
                              )}
                              <span className="text-gray-600">{vData.video?.title}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              {vData.progress?.quiz_attempts > 0 && (
                                <span className="text-gray-400">
                                  {vData.progress.quiz_attempts} deneme
                                </span>
                              )}
                              {vData.progress?.quiz_passed ? (
                                <span className="text-[#00C853] font-semibold">Quiz: %{vData.progress.last_quiz_score?.toFixed(0)}</span>
                              ) : vData.progress?.quiz_attempts > 0 ? (
                                <span className="text-red-500 font-semibold">Quiz: Basarisiz</span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {report.courses?.length === 0 && (
              <Card className="bg-white shadow-sm">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Bu kullaniciya henuz egitim atanmamis</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Rapor goruntlemek icin bir distributor secin</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
