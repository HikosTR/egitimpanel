import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Star, Target, Flame } from 'lucide-react';

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
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-400">{rank}</span>;
  };

  const levelLabels = {
    baslangic: 'Baslangic',
    aktif_distributor: 'Aktif',
    takim_kurucu: 'T. Kurucu',
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
      <main className="flex-1 p-4 sm:p-6 lg:p-10 pt-16 lg:pt-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#111111] uppercase tracking-tight"
              style={{ fontFamily: 'Barlow Condensed' }}
              data-testid="leaderboard-title"
            >
              Liderlik Tablosu
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-[52px]">Puan siralamasi</p>
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
              <Card className="bg-[#111111] shadow-lg mb-6 overflow-hidden animate-fadeIn" data-testid="my-rank-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#00C853]/20 flex items-center justify-center">
                        <span className="text-xl font-black text-[#00C853]" style={{ fontFamily: 'Barlow Condensed' }}>
                          {myRank.rank}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-bold">{myRank.full_name}</p>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider">Senin Siran</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xl font-bold text-[#00C853]" style={{ fontFamily: 'Barlow Condensed' }}>{myRank.points}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Puan</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>{myRank.completed_courses}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Tamamlanan</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>%{myRank.avg_quiz_score}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Quiz Ort.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top 3 Podium - visible on sm+ */}
            {leaderboard.length >= 3 && (
              <div className="hidden sm:grid grid-cols-3 gap-3 mb-6">
                {[1, 0, 2].map((idx) => {
                  const entry = leaderboard[idx];
                  const isFirst = idx === 0;
                  const borderColor = idx === 0 ? 'border-t-yellow-400' : idx === 1 ? 'border-t-gray-400' : 'border-t-amber-600';
                  const label = idx === 0 ? 'Sampiyon' : `${idx === 1 ? '2' : '3'}. Sira`;
                  const labelColor = idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700';
                  const iconColor = idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700';
                  const bgColor = idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-100' : 'bg-orange-50';
                  return (
                    <Card key={entry.user_id} className={`bg-white shadow-sm border-t-4 ${borderColor} ${isFirst ? '-mt-2' : ''}`} data-testid={`podium-${idx}`}>
                      <CardContent className="p-4 text-center">
                        <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center mx-auto mb-2`}>
                          {idx === 0 ? <Trophy className={`w-5 h-5 ${iconColor}`} /> : <Medal className={`w-5 h-5 ${iconColor}`} />}
                        </div>
                        <p className={`text-[10px] ${labelColor} uppercase tracking-wider font-bold mb-1`}>{label}</p>
                        <p className="font-bold text-[#111111] text-sm truncate">{entry.full_name}</p>
                        <p className={`text-xl font-black mt-1 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`} style={{ fontFamily: 'Barlow Condensed' }}>
                          {entry.points} P
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Desktop Table - hidden on mobile */}
            <Card className="bg-white shadow-sm hidden lg:block" data-testid="league-table-desktop">
              <CardContent className="p-0">
                <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-3">Distributor</div>
                  <div className="col-span-1 text-center">Seviye</div>
                  <div className="col-span-1 text-center">Puan</div>
                  <div className="col-span-1 text-center">Tamamlanan</div>
                  <div className="col-span-1 text-center">Quiz</div>
                  <div className="col-span-1 text-center">Quiz Ort.</div>
                  <div className="col-span-3">Ilerleme</div>
                </div>
                {leaderboard.map((entry, i) => {
                  const isMe = entry.user_id === user?.id;
                  const rankBg = entry.rank === 1 ? 'bg-yellow-50/50 border-l-4 border-l-yellow-400'
                    : entry.rank === 2 ? 'bg-gray-50/50 border-l-4 border-l-gray-400'
                    : entry.rank === 3 ? 'bg-orange-50/50 border-l-4 border-l-amber-600'
                    : 'border-l-4 border-l-transparent hover:border-l-[#00C853]';
                  return (
                    <div
                      key={entry.user_id}
                      className={`grid grid-cols-12 gap-2 px-6 py-3 items-center transition-all hover:bg-gray-50 ${rankBg} ${isMe ? 'ring-2 ring-[#00C853]/20 ring-inset' : ''}`}
                      data-testid={`leaderboard-row-${entry.rank}`}
                    >
                      <div className="col-span-1 flex justify-center">{getRankIcon(entry.rank)}</div>
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isMe ? 'bg-[#00C853] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {entry.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isMe ? 'text-[#00C853]' : 'text-[#111111]'}`}>
                            {entry.full_name} {isMe && <span className="text-[10px]">(Sen)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ color: levelColors[entry.level], backgroundColor: `${levelColors[entry.level]}15` }}>
                          {levelLabels[entry.level]}
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-base font-black text-[#111111]" style={{ fontFamily: 'Barlow Condensed' }}>{entry.points}</span>
                      </div>
                      <div className="col-span-1 text-center text-sm">
                        <span className="font-bold text-[#00C853]">{entry.completed_courses}</span>
                        <span className="text-gray-400">/{entry.total_assigned}</span>
                      </div>
                      <div className="col-span-1 text-center text-sm font-bold text-[#111111]">{entry.total_quiz_passed}</div>
                      <div className="col-span-1 text-center">
                        <span className={`text-sm font-bold ${entry.avg_quiz_score >= 80 ? 'text-[#00C853]' : 'text-gray-400'}`}>%{entry.avg_quiz_score}</span>
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <Progress value={entry.overall_progress} className="h-2 flex-1 bg-gray-100" />
                        <span className="text-xs font-bold text-gray-500 w-10 text-right">%{entry.overall_progress}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Mobile Card List */}
            <div className="lg:hidden space-y-3" data-testid="league-table-mobile">
              {leaderboard.map((entry, i) => {
                const isMe = entry.user_id === user?.id;
                const rankBorder = entry.rank === 1 ? 'border-l-yellow-400'
                  : entry.rank === 2 ? 'border-l-gray-400'
                  : entry.rank === 3 ? 'border-l-amber-600'
                  : 'border-l-gray-200';
                return (
                  <Card
                    key={entry.user_id}
                    className={`bg-white shadow-sm border-l-4 ${rankBorder} ${isMe ? 'ring-2 ring-[#00C853]/20' : ''} animate-fadeIn`}
                    style={{ animationDelay: `${i * 40}ms` }}
                    data-testid={`leaderboard-mobile-${entry.rank}`}
                  >
                    <CardContent className="p-4">
                      {/* Top: Rank + Name + Points */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getRankIcon(entry.rank)}
                          </div>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isMe ? 'bg-[#00C853] text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {entry.full_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-bold truncate ${isMe ? 'text-[#00C853]' : 'text-[#111111]'}`}>
                              {entry.full_name} {isMe && <span className="text-[10px]">(Sen)</span>}
                            </p>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ color: levelColors[entry.level], backgroundColor: `${levelColors[entry.level]}15` }}>
                              {levelLabels[entry.level]}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-black text-[#111111]" style={{ fontFamily: 'Barlow Condensed' }}>{entry.points}</p>
                          <p className="text-[9px] text-gray-400 uppercase">Puan</p>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-4 gap-2 text-center mb-3">
                        <div className="bg-gray-50 rounded-lg py-1.5 px-1">
                          <p className="text-sm font-bold text-[#00C853]">{entry.completed_courses}<span className="text-gray-400 font-normal">/{entry.total_assigned}</span></p>
                          <p className="text-[9px] text-gray-400 uppercase">Egitim</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg py-1.5 px-1">
                          <p className="text-sm font-bold text-[#111111]">{entry.total_quiz_passed}</p>
                          <p className="text-[9px] text-gray-400 uppercase">Quiz</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg py-1.5 px-1">
                          <p className={`text-sm font-bold ${entry.avg_quiz_score >= 80 ? 'text-[#00C853]' : 'text-gray-400'}`}>%{entry.avg_quiz_score}</p>
                          <p className="text-[9px] text-gray-400 uppercase">Ortalama</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg py-1.5 px-1">
                          <p className="text-sm font-bold text-[#111111]">{entry.total_videos_watched}</p>
                          <p className="text-[9px] text-gray-400 uppercase">Video</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-2">
                        <Progress value={entry.overall_progress} className="h-1.5 flex-1 bg-gray-100" />
                        <span className="text-[10px] font-bold text-gray-500 w-8 text-right">%{entry.overall_progress}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Points Info */}
            <Card className="bg-white shadow-sm mt-6" data-testid="points-info">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-3" style={{ fontFamily: 'Barlow Condensed' }}>
                  Puan Sistemi
                </h3>
                <div className="flex flex-wrap gap-4 sm:gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#00C853]/10 flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-[#00C853]" />
                    </div>
                    <span><b className="text-[#111111]">+100</b> Egitim</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-[#3B82F6]" />
                    </div>
                    <span><b className="text-[#111111]">+20</b> Quiz</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                      <Flame className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    </div>
                    <span><b className="text-[#111111]">+5</b> Video</span>
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
