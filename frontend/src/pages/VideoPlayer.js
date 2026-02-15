import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, PlayCircle, FileQuestion } from 'lucide-react';

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
  return match ? match[1] : null;
}

export default function VideoPlayer() {
  const { videoId } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [progress, setProgress] = useState(null);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchProgress, setWatchProgress] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      // Find video in course modules
      const coursesRes = await api.get('/courses');
      let foundVideo = null;
      let foundProgress = null;

      for (const course of coursesRes.data) {
        const courseRes = await api.get(`/courses/${course.id}`);
        for (const module of courseRes.data.modules || []) {
          for (const v of module.videos || []) {
            if (v.id === videoId) {
              foundVideo = v;
              foundProgress = v.progress;
              break;
            }
          }
          if (foundVideo) break;
        }
        if (foundVideo) break;
      }

      if (foundVideo) {
        setVideo(foundVideo);
        setProgress(foundProgress);
        setVideoCompleted(foundProgress?.video_watched || false);

        // Check for quiz
        try {
          const quizRes = await api.get(`/videos/${videoId}/quiz`);
          setHasQuiz(true);
          setQuizId(quizRes.data.id);
        } catch {
          setHasQuiz(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api, videoId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Simulate video watching progress for YouTube
  useEffect(() => {
    if (video?.video_type === 'youtube' && !videoCompleted) {
      let elapsed = 0;
      const duration = 30; // simulate 30 seconds watch
      timerRef.current = setInterval(() => {
        elapsed += 1;
        const pct = Math.min((elapsed / duration) * 100, 100);
        setWatchProgress(pct);
        if (pct >= 100) {
          clearInterval(timerRef.current);
        }
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [video, videoCompleted]);

  const handleVideoEnd = async () => {
    setWatchProgress(100);
  };

  const markComplete = async () => {
    try {
      await api.post('/progress/video-complete', { video_id: videoId });
      setVideoCompleted(true);
      toast.success('Video tamamlandi!');
    } catch (err) {
      toast.error('Islem basarisiz');
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setWatchProgress(pct);
      if (pct >= 98) {
        setWatchProgress(100);
      }
    }
  };

  const ytId = video ? getYouTubeId(video.url) : null;
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F5F7FA]">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="video-player-page">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-[#111111] mb-6 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>

        <h1 className="text-3xl font-bold text-[#111111] uppercase tracking-tight mb-6" style={{ fontFamily: 'Barlow Condensed' }}>
          {video?.title}
        </h1>

        {/* Video Player */}
        <Card className="bg-white shadow-sm mb-6 overflow-hidden" data-testid="video-container">
          <div className="aspect-video bg-black relative">
            {ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video?.title}
                data-testid="youtube-player"
              />
            ) : video?.url ? (
              <video
                ref={videoRef}
                src={video.url.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${video.url}` : video.url}
                className="w-full h-full"
                controls
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnd}
                data-testid="html5-player"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <PlayCircle className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>
        </Card>

        {/* Progress & Actions */}
        {!isAdmin && (
          <Card className="bg-white shadow-sm" data-testid="video-actions">
            <CardContent className="p-6">
              {videoCompleted ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-[#00C853]">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-bold uppercase tracking-wider text-sm">Video Tamamlandi</span>
                  </div>
                  {hasQuiz && (
                    <div>
                      {progress?.quiz_passed ? (
                        <div className="flex items-center gap-3 text-[#00C853]">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-semibold">Quiz Gecildi (Skor: %{progress?.last_quiz_score?.toFixed(0)})</span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => navigate(`/quiz/${quizId}`)}
                          className="bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs"
                          data-testid="go-quiz-btn"
                        >
                          <FileQuestion className="w-4 h-4 mr-2" /> Quiz'e Basla
                        </Button>
                      )}
                    </div>
                  )}
                  {!hasQuiz && (
                    <p className="text-sm text-gray-500">Bu video icin quiz bulunmuyor. Sonraki videoya gecebilirsiniz.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 uppercase tracking-wider font-semibold">Ilerleme</span>
                      <span className="text-[#00C853] font-bold">%{Math.round(watchProgress)}</span>
                    </div>
                    <Progress value={watchProgress} className="h-2 bg-gray-100" data-testid="watch-progress" />
                  </div>
                  {watchProgress >= 100 ? (
                    <Button
                      onClick={markComplete}
                      className="bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs"
                      data-testid="mark-complete-btn"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Tamamla
                    </Button>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Videoyu %100 izlemeniz gerekmektedir.
                      {ytId && ' YouTube videolari icin lutfen tum videoyu izleyiniz.'}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {video?.description && (
          <Card className="bg-white shadow-sm mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-[#111111] uppercase tracking-tight mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                Aciklama
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">{video.description}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
