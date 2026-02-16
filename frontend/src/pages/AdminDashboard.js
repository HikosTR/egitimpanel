import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Award, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  const metricCards = stats ? [
    { label: 'Toplam Distributor', value: stats.total_distributors, icon: Users, color: '#00C853' },
    { label: 'Toplam Admin', value: stats.total_admins, icon: UserCheck, color: '#3B82F6' },
    { label: 'Toplam Egitim', value: stats.total_courses, icon: BookOpen, color: '#8B5CF6' },
    { label: 'Tamamlanan', value: stats.completed_assignments, icon: Award, color: '#F59E0B' },
    { label: 'Toplam Atama', value: stats.total_assignments, icon: TrendingUp, color: '#00C853' },
    { label: 'Quiz Basarisiz', value: stats.total_quiz_fails, icon: AlertTriangle, color: '#EF4444' },
  ] : [];

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="admin-dashboard">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 pt-16 lg:pt-10">
        <div className="mb-10">
          <h1
            className="text-4xl font-bold text-[#111111] uppercase tracking-tight"
            style={{ fontFamily: 'Barlow Condensed' }}
            data-testid="dashboard-title"
          >
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Platformun genel gorunumu</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {metricCards.map((card, i) => (
                <Card
                  key={i}
                  className="border-l-4 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white animate-fadeIn"
                  style={{ borderLeftColor: card.color, animationDelay: `${i * 80}ms` }}
                  data-testid={`metric-card-${i}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{card.label}</p>
                        <p className="text-3xl font-bold text-[#111111]" style={{ fontFamily: 'Barlow Condensed' }}>
                          {card.value}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
                        <card.icon className="w-6 h-6" style={{ color: card.color }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {stats?.recent_users?.length > 0 && (
              <Card className="bg-white shadow-sm" data-testid="recent-users-card">
                <CardHeader>
                  <CardTitle className="text-xl uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                    Son Distributor'ler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">Ad Soyad</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">E-Posta</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">Seviye</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">Kayit Tarihi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent_users.map((user, i) => (
                          <tr key={user.id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 font-medium text-[#111111]">{user.full_name}</td>
                            <td className="py-3 px-4 text-gray-500">{user.email}</td>
                            <td className="py-3 px-4">
                              <LevelBadge level={user.level} />
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-xs">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export const LevelBadge = ({ level }) => {
  const levels = {
    baslangic: { label: 'Baslangic', color: '#94A3B8', bg: '#F1F5F9' },
    aktif_distributor: { label: 'Aktif Distributor', color: '#3B82F6', bg: '#EFF6FF' },
    takim_kurucu: { label: 'Takim Kurucu', color: '#8B5CF6', bg: '#F5F3FF' },
    lider: { label: 'Lider', color: '#F59E0B', bg: '#FFFBEB' },
    elite_leader: { label: 'Elite Leader', color: '#00C853', bg: '#F0FDF4' },
  };
  const l = levels[level] || levels.baslangic;
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
      style={{ color: l.color, backgroundColor: l.bg }}
      data-testid={`level-badge-${level}`}
    >
      {l.label}
    </span>
  );
};
