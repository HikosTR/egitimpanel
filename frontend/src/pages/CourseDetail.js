import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Trash2, Edit, Video, FileQuestion, Lock, Unlock,
  CheckCircle, PlayCircle, ChevronDown, ChevronUp, UserPlus, Users
} from 'lucide-react';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState(null);

  // Admin dialogs
  const [moduleDialog, setModuleDialog] = useState(false);
  const [videoDialog, setVideoDialog] = useState(false);
  const [quizDialog, setQuizDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [editModule, setEditModule] = useState(null);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [currentVideoId, setCurrentVideoId] = useState(null);

  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order: 0 });
  const [videoForm, setVideoForm] = useState({ title: '', description: '', url: '', video_type: 'youtube', order: 0 });
  const [quizForm, setQuizForm] = useState({ passing_rate: 80, questions: [] });
  const [questionForm, setQuestionForm] = useState({ question: '', options: ['', '', '', ''], correct_answer: 0 });

  // Assignment
  const [allUsers, setAllUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const loadCourse = useCallback(async () => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data);
      if (res.data.modules?.length > 0 && expandedModule === null) {
        setExpandedModule(res.data.modules[0].id);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [api, courseId]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  useEffect(() => {
    if (isAdmin) {
      api.get('/users').then(r => setAllUsers(r.data.filter(u => u.role === 'distributor'))).catch(() => {});
      api.get(`/assignments?course_id=${courseId}`).catch(() => {});
      api.get('/assignments').then(r => setAssignments(r.data.filter(a => a.course_id === courseId))).catch(() => {});
    }
  }, [isAdmin, api, courseId]);

  // Module CRUD
  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editModule) {
        await api.put(`/modules/${editModule.id}`, moduleForm);
        toast.success('Modul guncellendi');
      } else {
        await api.post(`/courses/${courseId}/modules`, moduleForm);
        toast.success('Modul eklendi');
      }
      setModuleDialog(false);
      setEditModule(null);
      setModuleForm({ title: '', description: '', order: 0 });
      loadCourse();
    } catch (err) { toast.error('Islem basarisiz'); }
  };

  const deleteModule = async (moduleId) => {
    if (!window.confirm('Bu modulu silmek istediginize emin misiniz?')) return;
    try {
      await api.delete(`/modules/${moduleId}`);
      toast.success('Modul silindi');
      loadCourse();
    } catch (err) { toast.error(err.response?.data?.detail || 'Silme basarisiz'); }
  };

  // Video CRUD
  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/modules/${currentModuleId}/videos`, videoForm);
      toast.success('Video eklendi');
      setVideoDialog(false);
      setVideoForm({ title: '', description: '', url: '', video_type: 'youtube', order: 0 });
      loadCourse();
    } catch (err) { toast.error('Islem basarisiz'); }
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm('Bu videoyu silmek istediginize emin misiniz?')) return;
    try {
      await api.delete(`/videos/${videoId}`);
      toast.success('Video silindi');
      loadCourse();
    } catch (err) { toast.error(err.response?.data?.detail || 'Silme basarisiz'); }
  };

  // Quiz CRUD
  const openQuizDialog = async (videoId) => {
    setCurrentVideoId(videoId);
    try {
      const res = await api.get(`/videos/${videoId}/quiz`);
      setQuizForm({ passing_rate: res.data.passing_rate, questions: res.data.questions });
    } catch {
      setQuizForm({ passing_rate: 80, questions: [] });
    }
    setQuizDialog(true);
  };

  const addQuestion = () => {
    if (!questionForm.question.trim()) return;
    const validOptions = questionForm.options.filter(o => o.trim());
    if (validOptions.length < 2) { toast.error('En az 2 sik gerekli'); return; }
    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, {
        question: questionForm.question,
        options: validOptions,
        correct_answer: questionForm.correct_answer
      }]
    });
    setQuestionForm({ question: '', options: ['', '', '', ''], correct_answer: 0 });
  };

  const removeQuestion = (idx) => {
    setQuizForm({ ...quizForm, questions: quizForm.questions.filter((_, i) => i !== idx) });
  };

  const saveQuiz = async () => {
    if (quizForm.questions.length === 0) { toast.error('En az 1 soru ekleyin'); return; }
    try {
      await api.post(`/videos/${currentVideoId}/quiz`, quizForm);
      toast.success('Quiz kaydedildi');
      setQuizDialog(false);
      loadCourse();
    } catch (err) { toast.error('Islem basarisiz'); }
  };

  // Assignment
  const assignUser = async () => {
    if (!selectedUserId) return;
    try {
      await api.post('/assignments', { user_id: selectedUserId, course_id: courseId });
      toast.success('Egitim atandi');
      setSelectedUserId('');
      const r = await api.get('/assignments');
      setAssignments(r.data.filter(a => a.course_id === courseId));
    } catch (err) { toast.error(err.response?.data?.detail || 'Atama basarisiz'); }
  };

  const removeAssignment = async (assignmentId) => {
    try {
      await api.delete(`/assignments/${assignmentId}`);
      toast.success('Atama kaldirildi');
      const r = await api.get('/assignments');
      setAssignments(r.data.filter(a => a.course_id === courseId));
    } catch (err) { toast.error('Islem basarisiz'); }
  };

  // Distributor: check if video/quiz is accessible
  const isVideoAccessible = (modules, moduleIdx, videoIdx) => {
    if (isAdmin) return true;
    if (moduleIdx === 0 && videoIdx === 0) return true;
    // Check previous video in same module
    if (videoIdx > 0) {
      const prevVideo = modules[moduleIdx].videos[videoIdx - 1];
      const prog = prevVideo?.progress;
      if (!prog?.video_watched || !prog?.quiz_passed) {
        const hasQuiz = prevVideo?.has_quiz;
        if (hasQuiz && !prog?.quiz_passed) return false;
        if (!prog?.video_watched) return false;
      }
      return true;
    }
    // First video of new module - check last video of previous module
    if (moduleIdx > 0) {
      const prevModule = modules[moduleIdx - 1];
      const lastVideo = prevModule.videos[prevModule.videos.length - 1];
      if (!lastVideo) return true;
      const prog = lastVideo?.progress;
      const hasQuiz = lastVideo?.has_quiz;
      if (!prog?.video_watched) return false;
      if (hasQuiz && !prog?.quiz_passed) return false;
      return true;
    }
    return true;
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
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="course-detail">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <button
          onClick={() => navigate(isAdmin ? '/admin/courses' : '/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#111111] mb-6 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#111111] uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
            {course?.title}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{course?.description}</p>
        </div>

        {isAdmin ? (
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="content" data-testid="tab-content">Icerik</TabsTrigger>
              <TabsTrigger value="assignments" data-testid="tab-assignments">Atamalar</TabsTrigger>
            </TabsList>

            <TabsContent value="content">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#111111] uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                  Moduller
                </h2>
                <Button
                  onClick={() => { setEditModule(null); setModuleForm({ title: '', description: '', order: 0 }); setModuleDialog(true); }}
                  className="bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs"
                  data-testid="add-module-btn"
                >
                  <Plus className="w-4 h-4 mr-2" /> Modul Ekle
                </Button>
              </div>

              {course?.modules?.map((module, mIdx) => (
                <Card key={module.id} className="bg-white shadow-sm mb-4 animate-fadeIn" data-testid={`module-${module.id}`}>
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[#00C853]/10 text-[#00C853] flex items-center justify-center font-bold text-sm">
                        {mIdx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-[#111111]">{module.title}</h3>
                        <p className="text-xs text-gray-500">{module.videos?.length || 0} video</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditModule(module); setModuleForm({ title: module.title, description: module.description, order: module.order }); setModuleDialog(true); }}
                        className="p-2 text-gray-400 hover:text-[#00C853] hover:bg-[#00C853]/10 rounded-lg transition-all"
                        data-testid={`edit-module-${module.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteModule(module.id); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        data-testid={`delete-module-${module.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedModule === module.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {expandedModule === module.id && (
                    <CardContent className="pt-0 pb-5 px-5 border-t border-gray-100">
                      <div className="flex justify-end mb-4">
                        <Button
                          size="sm"
                          onClick={() => { setCurrentModuleId(module.id); setVideoForm({ title: '', description: '', url: '', video_type: 'youtube', order: 0 }); setVideoDialog(true); }}
                          className="bg-[#111111] hover:bg-[#222222] text-white text-xs uppercase tracking-wider"
                          data-testid={`add-video-${module.id}`}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Video Ekle
                        </Button>
                      </div>

                      {module.videos?.map((video, vIdx) => (
                        <div key={video.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors mb-2" data-testid={`video-item-${video.id}`}>
                          <div className="flex items-center gap-3">
                            <Video className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-[#111111]">{video.title}</p>
                              <p className="text-xs text-gray-400">{video.video_type === 'youtube' ? 'YouTube' : 'Yuklenen'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openQuizDialog(video.id)}
                              className={`p-2 rounded-lg transition-all ${video.has_quiz ? 'text-[#00C853] hover:bg-[#00C853]/10' : 'text-gray-400 hover:bg-gray-100'}`}
                              title={video.has_quiz ? 'Quiz Duzenle' : 'Quiz Ekle'}
                              data-testid={`quiz-btn-${video.id}`}
                            >
                              <FileQuestion className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteVideo(video.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              data-testid={`delete-video-${video.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {(!module.videos || module.videos.length === 0) && (
                        <p className="text-center text-gray-400 text-sm py-4">Henuz video eklenmemis</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="assignments">
              <Card className="bg-white shadow-sm" data-testid="assignments-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Select value={selectedUserId || 'none'} onValueChange={v => setSelectedUserId(v === 'none' ? '' : v)}>
                      <SelectTrigger className="flex-1 h-11 bg-[#F5F7FA] border-0" data-testid="assign-user-select">
                        <SelectValue placeholder="Distributor sec..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sec...</SelectItem>
                        {allUsers.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={assignUser}
                      disabled={!selectedUserId}
                      className="bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs h-11"
                      data-testid="assign-btn"
                    >
                      <UserPlus className="w-4 h-4 mr-1" /> Ata
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {assignments.map(a => {
                      const u = allUsers.find(u => u.id === a.user_id);
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50" data-testid={`assignment-${a.id}`}>
                          <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{u?.full_name || a.user_id}</p>
                              <p className="text-xs text-gray-400">{u?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.completed && (
                              <span className="text-xs text-[#00C853] font-semibold">Tamamlandi</span>
                            )}
                            <button
                              onClick={() => removeAssignment(a.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              data-testid={`remove-assignment-${a.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          /* Distributor View */
          <div className="space-y-4">
            {course?.modules?.map((module, mIdx) => (
              <Card key={module.id} className="bg-white shadow-sm animate-fadeIn" data-testid={`module-${module.id}`}>
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#00C853]/10 text-[#00C853] flex items-center justify-center font-bold text-sm">
                      {mIdx + 1}
                    </span>
                    <h3 className="font-bold text-[#111111]">{module.title}</h3>
                  </div>
                  {expandedModule === module.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {expandedModule === module.id && (
                  <CardContent className="pt-0 pb-5 px-5 border-t border-gray-100">
                    {module.videos?.map((video, vIdx) => {
                      const accessible = isVideoAccessible(course.modules, mIdx, vIdx);
                      const prog = video.progress;
                      const watched = prog?.video_watched;
                      const quizPassed = prog?.quiz_passed;

                      return (
                        <div
                          key={video.id}
                          className={`flex items-center justify-between p-3 rounded-lg mb-2 transition-all ${
                            accessible ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-50'
                          }`}
                          onClick={() => accessible && navigate(`/video/${video.id}`)}
                          data-testid={`video-item-${video.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {!accessible ? (
                              <Lock className="w-4 h-4 text-gray-400" />
                            ) : watched && (video.has_quiz ? quizPassed : true) ? (
                              <CheckCircle className="w-4 h-4 text-[#00C853]" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-[#00C853]" />
                            )}
                            <div>
                              <p className={`text-sm font-medium ${accessible ? 'text-[#111111]' : 'text-gray-400'}`}>{video.title}</p>
                              {watched && video.has_quiz && !quizPassed && (
                                <p className="text-xs text-orange-500">Quiz gecilmedi - Tekrar izle</p>
                              )}
                            </div>
                          </div>
                          {accessible && !watched && <span className="text-xs text-[#00C853] font-semibold">Basla</span>}
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Module Dialog */}
        <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
          <DialogContent className="sm:max-w-md" data-testid="module-dialog">
            <DialogHeader>
              <DialogTitle className="text-xl uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                {editModule ? 'Modul Duzenle' : 'Yeni Modul'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {editModule ? 'Modul bilgilerini guncelleyin' : 'Yeni modul bilgilerini girin'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleModuleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Modul Adi</Label>
                <Input
                  value={moduleForm.title}
                  onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                  required
                  className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                  data-testid="module-title-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Aciklama</Label>
                <Input
                  value={moduleForm.description}
                  onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                  data-testid="module-desc-input"
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs" data-testid="module-submit-btn">
                {editModule ? 'Guncelle' : 'Ekle'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Video Dialog */}
        <Dialog open={videoDialog} onOpenChange={setVideoDialog}>
          <DialogContent className="sm:max-w-md" data-testid="video-dialog">
            <DialogHeader>
              <DialogTitle className="text-xl uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                Yeni Video
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Video bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVideoSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Video Adi</Label>
                <Input
                  value={videoForm.title}
                  onChange={e => setVideoForm({ ...videoForm, title: e.target.value })}
                  required
                  className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                  data-testid="video-title-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Video Tipi</Label>
                <Select value={videoForm.video_type} onValueChange={v => setVideoForm({ ...videoForm, video_type: v })}>
                  <SelectTrigger className="h-11 bg-[#F5F7FA] border-0" data-testid="video-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="upload">Yuklenen Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  {videoForm.video_type === 'youtube' ? 'YouTube URL' : 'Video URL'}
                </Label>
                <Input
                  value={videoForm.url}
                  onChange={e => setVideoForm({ ...videoForm, url: e.target.value })}
                  placeholder={videoForm.video_type === 'youtube' ? 'https://youtube.com/watch?v=...' : '/api/uploads/videos/...'}
                  required
                  className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                  data-testid="video-url-input"
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs" data-testid="video-submit-btn">
                Ekle
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Quiz Dialog */}
        <Dialog open={quizDialog} onOpenChange={setQuizDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="quiz-dialog">
            <DialogHeader>
              <DialogTitle className="text-xl uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                Quiz Duzenle
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Quiz sorularini ekleyin veya duzenleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Gecme Orani (%)</Label>
                <Input
                  type="number" min={0} max={100}
                  value={quizForm.passing_rate}
                  onChange={e => setQuizForm({ ...quizForm, passing_rate: parseInt(e.target.value) || 80 })}
                  className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                  data-testid="quiz-rate-input"
                />
              </div>

              {/* Existing questions */}
              {quizForm.questions.map((q, i) => (
                <div key={i} className="p-4 rounded-lg bg-gray-50 relative">
                  <button onClick={() => removeQuestion(i)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500" data-testid={`remove-question-${i}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <p className="font-medium text-sm mb-2">Soru {i + 1}: {q.question}</p>
                  {q.options.map((opt, oi) => (
                    <p key={oi} className={`text-xs ml-4 ${oi === q.correct_answer ? 'text-[#00C853] font-bold' : 'text-gray-500'}`}>
                      {String.fromCharCode(65 + oi)}) {opt} {oi === q.correct_answer && '(Dogru)'}
                    </p>
                  ))}
                </div>
              ))}

              {/* Add new question */}
              <div className="p-4 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-500">Yeni Soru Ekle</p>
                <div className="space-y-3">
                  <Input
                    value={questionForm.question}
                    onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                    placeholder="Soru..."
                    className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-[#00C853]"
                    data-testid="question-text-input"
                  />
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={questionForm.correct_answer === i}
                        onChange={() => setQuestionForm({ ...questionForm, correct_answer: i })}
                        className="accent-[#00C853]"
                        data-testid={`correct-radio-${i}`}
                      />
                      <Input
                        value={opt}
                        onChange={e => {
                          const opts = [...questionForm.options];
                          opts[i] = e.target.value;
                          setQuestionForm({ ...questionForm, options: opts });
                        }}
                        placeholder={`Sik ${String.fromCharCode(65 + i)}`}
                        className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-[#00C853]"
                        data-testid={`option-input-${i}`}
                      />
                    </div>
                  ))}
                  <Button
                    onClick={addQuestion}
                    size="sm"
                    className="bg-[#111111] hover:bg-[#222222] text-white text-xs uppercase tracking-wider"
                    data-testid="add-question-btn"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Soru Ekle
                  </Button>
                </div>
              </div>

              <Button
                onClick={saveQuiz}
                className="w-full h-11 bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs"
                data-testid="save-quiz-btn"
              >
                Quiz Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
