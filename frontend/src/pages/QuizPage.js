import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export default function QuizPage() {
  const { quizId } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  const loadQuiz = useCallback(async () => {
    try {
      // Find quiz by ID - search through courses
      const coursesRes = await api.get('/courses');
      for (const course of coursesRes.data) {
        const courseRes = await api.get(`/courses/${course.id}`);
        for (const module of courseRes.data.modules || []) {
          for (const video of module.videos || []) {
            try {
              const quizRes = await api.get(`/videos/${video.id}/quiz`);
              if (quizRes.data.id === quizId) {
                setQuiz(quizRes.data);
                // Shuffle questions and options
                const shuffled = shuffleArray(quizRes.data.questions.map((q, origIdx) => {
                  const shuffledOpts = q.options.map((opt, optIdx) => ({ text: opt, origIdx: optIdx }));
                  shuffleArrayInPlace(shuffledOpts);
                  return { ...q, shuffledOptions: shuffledOpts, origIdx };
                }));
                setShuffledQuestions(shuffled);
                setLoading(false);
                return;
              }
            } catch {}
          }
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [api, quizId]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const shuffleArrayInPlace = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < shuffledQuestions.length) {
      toast.error('Lutfen tum sorulari cevaplayin');
      return;
    }
    try {
      // Map shuffled answers back to original indices
      const mappedAnswers = {};
      shuffledQuestions.forEach((q, sIdx) => {
        const selectedShuffledIdx = answers[sIdx];
        if (selectedShuffledIdx !== undefined) {
          const origOptIdx = q.shuffledOptions[selectedShuffledIdx].origIdx;
          mappedAnswers[String(q.origIdx)] = origOptIdx;
        }
      });

      const res = await api.post(`/quizzes/${quizId}/submit`, { answers: mappedAnswers });
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      toast.error('Gonderme basarisiz');
    }
  };

  const handleRetry = () => {
    // Reset video progress so user must rewatch
    if (quiz?.video_id) {
      api.post('/progress/reset-video', { video_id: quiz.video_id })
        .then(() => navigate(`/video/${quiz.video_id}`))
        .catch(() => navigate(-1));
    } else {
      navigate(-1);
    }
  };

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
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="quiz-page">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-[#111111] mb-6 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>

        <h1 className="text-3xl font-bold text-[#111111] uppercase tracking-tight mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
          Quiz
        </h1>
        <p className="text-gray-500 text-sm mb-8">Gecme orani: %{quiz?.passing_rate || 80}</p>

        {submitted && result ? (
          <Card className="bg-white shadow-sm animate-fadeIn" data-testid="quiz-result">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                {result.passed ? (
                  <div className="space-y-3">
                    <CheckCircle className="w-16 h-16 text-[#00C853] mx-auto" />
                    <h2 className="text-3xl font-bold text-[#00C853] uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                      Basarili!
                    </h2>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="text-3xl font-bold text-red-500 uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                      Basarisiz
                    </h2>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-[#00C853]" style={{ fontFamily: 'Barlow Condensed' }}>{result.correct}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Dogru</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-red-500" style={{ fontFamily: 'Barlow Condensed' }}>{result.total - result.correct}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Yanlis</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-[#111111]" style={{ fontFamily: 'Barlow Condensed' }}>%{result.score.toFixed(0)}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Basari</p>
                </div>
              </div>

              <Progress value={result.score} className="h-3 bg-gray-100 mb-8" />

              {result.passed ? (
                <Button
                  onClick={() => navigate(-1)}
                  className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-sm"
                  data-testid="continue-btn"
                >
                  Devam Et
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-sm text-gray-500">
                    Quiz'i gecemediginiz icin videoyu tekrar izlemeniz gerekmektedir.
                  </p>
                  <Button
                    onClick={handleRetry}
                    className="w-full h-12 bg-[#111111] hover:bg-[#222222] text-white font-bold uppercase tracking-wider text-sm"
                    data-testid="retry-btn"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Videoyu Tekrar Izle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {shuffledQuestions.map((q, qIdx) => (
              <Card key={qIdx} className="bg-white shadow-sm animate-fadeIn" style={{ animationDelay: `${qIdx * 100}ms` }} data-testid={`question-${qIdx}`}>
                <CardContent className="p-6">
                  <p className="font-bold text-[#111111] mb-4">
                    <span className="text-[#00C853] mr-2">Soru {qIdx + 1}.</span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.shuffledOptions.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => setAnswers({ ...answers, [qIdx]: oIdx })}
                        className={`w-full text-left p-4 rounded-lg transition-all duration-200 border-2 ${
                          answers[qIdx] === oIdx
                            ? 'border-[#00C853] bg-[#00C853]/5 text-[#111111] font-medium'
                            : 'border-gray-100 hover:border-gray-200 text-gray-600'
                        }`}
                        data-testid={`answer-${qIdx}-${oIdx}`}
                      >
                        <span className="font-bold mr-3 text-sm">{String.fromCharCode(65 + oIdx)}</span>
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              onClick={handleSubmit}
              className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-sm"
              data-testid="submit-quiz-btn"
            >
              Cevaplari Gonder ({Object.keys(answers).length}/{shuffledQuestions.length})
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
