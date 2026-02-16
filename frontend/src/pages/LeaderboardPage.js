import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Star, TrendingUp, Target, Flame, ChevronUp, ChevronDown, Minus } from 'lucide-react';

export default function LeaderboardPage() {
  const { user, api } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard')
      .then(res => setLeaderboard(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-400">{rank}</span>;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-l-yellow-400';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-l-gray-400';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-l-amber-600';
    return 'bg-white border-l-4 border-l-transparent hover:border-l-[#00C853]';
  };

  const levelLabels = {
    baslangic: 'Baslangic',
    aktif_distributor: 'Aktif',
    takim_kurucu: 'Takim Kurucu',
    lider: 'Lider',
    elite_leader: 'Elite'
  };

  const levelColors = {
    baslangic: '#94A3B8',
    aktif_distributor: '#3B82F6',
    takim_kurucu: '#8B5CF6',
    lider: '#F59E0B',
    elite_leader: '#00C853'
  };

  const myRank = leaderboard.find(e => e.user_id === user?.id);

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="leaderboard-page">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <h1
              className="text-4xl font-bold text-[#111111] uppercase tracking-tight"
              style={{ fontFamily: 'Barlow Condensed' }}
              data-testid="leaderboard-title"
            >
              Liderlik Tablosu
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-[52px]">En iyi egitim alan distributor'ler - Puan siralamasi</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tight mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                Henuz Siralama Yok
              </h3>
              <p className="text-gray-500 text-sm">Distributor'ler egitimlere basladiginda siralama olusacak.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* My Position Banner */}
            {myRank && (
              <Card className="bg-[#111111] shadow-lg mb-8 overflow-hidden animate-fadeIn" data-testid="my-rank-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[#00C853]/20 flex items-center justify-center">
                        <span className="text-2xl font-black text-[#00C853]" style={{ fontFamily: 'Barlow Condensed' }}>
                          {myRank.rank}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{myRank.full_name}</p>
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Senin Siran</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#00C853]" style={{ fontFamily: 'Barlow Condensed' }}>{myRank.points}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Puan</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>{myRank.completed_courses}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Tamamlanan</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>%{myRank.avg_quiz_score}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Quiz Ort.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <Card className="bg-white shadow-sm animate-fadeIn border-t-4 border-t-gray-400" style={{ animationDelay: '100ms' }} data-testid="podium-2">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Medal className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">2. Sira</p>
                    <p className="font-bold text-[#111111] truncate">{leaderboard[1].full_name}</p>
                    <p className="text-2xl font-black text-gray-400 mt-1" style={{ fontFamily: 'Barlow Condensed' }}>{leaderboard[1].points} P</p>
                    <div className="mt-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: levelColors[leaderboard[1].level], backgroundColor: `${levelColors[leaderboard[1].level]}15` }}>
                        {levelLabels[leaderboard[1].level]}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 1st Place */}
                <Card className="bg-white shadow-md animate-fadeIn border-t-4 border-t-yellow-400 -mt-4" data-testid="podium-1">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-7 h-7 text-yellow-500" />
                    </div>
                    <p className="text-xs text-yellow-500 uppercase tracking-wider font-bold mb-1">Sampiyon</p>
                    <p className="font-bold text-[#111111] text-lg truncate">{leaderboard[0].full_name}</p>
                    <p className="text-3xl font-black text-yellow-500 mt-1" style={{ fontFamily: 'Barlow Condensed' }}>{leaderboard[0].points} P</p>
                    <div className="mt-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: levelColors[leaderboard[0].level], backgroundColor: `${levelColors[leaderboard[0].level]}15` }}>
                        {levelLabels[leaderboard[0].level]}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 3rd Place */}
                <Card className="bg-white shadow-sm animate-fadeIn border-t-4 border-t-amber-600" style={{ animationDelay: '200ms' }} data-testid="podium-3">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                      <Medal className="w-6 h-6 text-amber-700" />
                    </div>
                    <p className="text-xs text-amber-700 uppercase tracking-wider font-semibold mb-1">3. Sira</p>
                    <p className="font-bold text-[#111111] truncate">{leaderboard[2].full_name}</p>
                    <p className="text-2xl font-black text-amber-700 mt-1" style={{ fontFamily: 'Barlow Condensed' }}>{leaderboard[2].points} P</p>
                    <div className="mt-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: levelColors[leaderboard[2].level], backgroundColor: `${levelColors[leaderboard[2].level]}15` }}>
                        {levelLabels[leaderboard[2].level]}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* League Table */}
            <Card className="bg-white shadow-sm" data-testid="league-table">
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-6 py-4 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-3">Distributor</div>
                  <div className="col-span-1 text-center">Seviye</div>
                  <div className="col-span-1 text-center">Puan</div>
                  <div className="col-span-1 text-center">Tamamlanan</div>
                  <div className="col-span-1 text-center">Quiz Gecen</div>
                  <div className="col-span-1 text-center">Quiz Ort.</div>
                  <div className="col-span-3">Ilerleme</div>
                </div>

                {/* Table Body */}
                {leaderboard.map((entry, i) => {
                  const isMe = entry.user_id === user?.id;
                  return (
                    <div
                      key={entry.user_id}
                      className={`grid grid-cols-12 gap-2 px-6 py-4 items-center transition-all duration-200 hover:bg-gray-50 animate-fadeIn ${getRankBg(entry.rank)} ${isMe ? 'ring-2 ring-[#00C853]/30 ring-inset' : ''}`}
                      style={{ animationDelay: `${i * 40}ms` }}
                      data-testid={`leaderboard-row-${entry.rank}`}
                    >
                      {/* Rank */}
                      <div className="col-span-1 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Name */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isMe ? 'bg-[#00C853] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {entry.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isMe ? 'text-[#00C853]' : 'text-[#111111]'}`}>
                            {entry.full_name}
                            {isMe && <span className="ml-1 text-[10px] text-[#00C853]">(Sen)</span>}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{entry.email}</p>
                        </div>
                      </div>

                      {/* Level */}
                      <div className="col-span-1 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ color: levelColors[entry.level], backgroundColor: `${levelColors[entry.level]}15` }}>
                          {levelLabels[entry.level]}
                        </span>
                      </div>

                      {/* Points */}
                      <div className="col-span-1 text-center">
                        <span className="text-lg font-black text-[#111111]" style={{ fontFamily: 'Barlow Condensed' }}>
                          {entry.points}
                        </span>
                      </div>

                      {/* Completed Courses */}
                      <div className="col-span-1 text-center">
                        <span className="text-sm font-bold text-[#00C853]">{entry.completed_courses}</span>
                        <span className="text-xs text-gray-400">/{entry.total_assigned}</span>
                      </div>

                      {/* Quiz Passed */}
                      <div className="col-span-1 text-center">
                        <span className="text-sm font-bold text-[#111111]">{entry.total_quiz_passed}</span>
                      </div>

                      {/* Avg Quiz Score */}
                      <div className="col-span-1 text-center">
                        <span className={`text-sm font-bold ${entry.avg_quiz_score >= 80 ? 'text-[#00C853]' : entry.avg_quiz_score >= 50 ? 'text-[#F59E0B]' : 'text-gray-400'}`}>
                          %{entry.avg_quiz_score}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="col-span-3 flex items-center gap-2">
                        <Progress value={entry.overall_progress} className="h-2 flex-1 bg-gray-100" />
                        <span className="text-xs font-bold text-gray-500 w-10 text-right">%{entry.overall_progress}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Points Info */}
            <Card className="bg-white shadow-sm mt-6" data-testid="points-info">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-3" style={{ fontFamily: 'Barlow Condensed' }}>
                  Puan Sistemi
                </h3>
                <div className="flex flex-wrap gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00C853]/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-[#00C853]" />
                    </div>
                    <div>
                      <span className="font-bold text-[#111111]">+100</span> Tamamlanan Egitim
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-[#3B82F6]" />
                    </div>
                    <div>
                      <span className="font-bold text-[#111111]">+20</span> Gecilen Quiz
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-[#8B5CF6]" />
                    </div>
                    <div>
                      <span className="font-bold text-[#111111]">+5</span> Izlenen Video
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
