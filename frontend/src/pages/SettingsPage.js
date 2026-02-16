import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Upload, Image, Type, BarChart3, Trash2, Plus, Save, Eye } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SettingsPage() {
  const { api } = useAuth();
  const logoInputRef = useRef(null);
  const bgInputRef = useRef(null);

  const [settings, setSettings] = useState({
    logo_url: '',
    login_bg_url: '',
    login_title_line1: 'Lider Yetistirme Platformu',
    login_title_line2: '',
    login_subtitle: "ProFit Team'e Hos Geldin! Lider olma yolunda hizlica ivmelenin!",
    stats: [
      { label: 'Egitim Saati', value: '500+' },
      { label: 'Mezun', value: '1000+' },
      { label: 'Memnuniyet', value: '98%' }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(res => setSettings(prev => ({ ...prev, ...res.data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Ayarlar kaydedildi');
    } catch (err) {
      toast.error('Kaydetme basarisiz');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/settings/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSettings(prev => ({ ...prev, logo_url: res.data.url }));
      toast.success('Logo yuklendi');
    } catch (err) {
      toast.error('Logo yukleme basarisiz');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/settings/upload-bg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSettings(prev => ({ ...prev, login_bg_url: res.data.url }));
      toast.success('Arka plan resmi yuklendi');
    } catch (err) {
      toast.error('Resim yukleme basarisiz');
    } finally {
      setUploadingBg(false);
    }
  };

  const updateStat = (index, field, value) => {
    const newStats = [...settings.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setSettings(prev => ({ ...prev, stats: newStats }));
  };

  const addStat = () => {
    setSettings(prev => ({
      ...prev,
      stats: [...prev.stats, { label: '', value: '' }]
    }));
  };

  const removeStat = (index) => {
    setSettings(prev => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index)
    }));
  };

  const resolveUrl = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? `${BACKEND_URL}${url}` : url;
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
    <div className="flex min-h-screen bg-[#F5F7FA]" data-testid="settings-page">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 pt-16 lg:pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-[#111111] uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Site Ayarlari
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Login sayfasi ve platform gorunumunu yonetin</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
              data-testid="preview-login-btn"
            >
              <Eye className="w-4 h-4" /> Onizle
            </a>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-xs shadow-md"
              data-testid="save-settings-btn"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo */}
          <Card className="bg-white shadow-sm" data-testid="logo-card">
            <CardHeader>
              <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
                <Image className="w-5 h-5 text-[#00C853]" /> Logo
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Platform logosu - login sayfasi ve sidebar'da gorunur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {settings.logo_url ? (
                  <div className="w-20 h-20 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                    <img src={resolveUrl(settings.logo_url)} alt="Logo" className="max-w-full max-h-full object-contain" data-testid="current-logo" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                    <Image className="w-8 h-8" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input type="file" ref={logoInputRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    size="sm"
                    className="bg-[#111111] hover:bg-[#222222] text-white text-xs uppercase tracking-wider"
                    data-testid="upload-logo-btn"
                  >
                    {uploadingLogo ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <Upload className="w-3 h-3 mr-1" />
                    )}
                    Logo Yukle
                  </Button>
                  {settings.logo_url && (
                    <Button
                      onClick={() => setSettings(prev => ({ ...prev, logo_url: '' }))}
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50 text-xs"
                      data-testid="remove-logo-btn"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Kaldir
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Background Image */}
          <Card className="bg-white shadow-sm" data-testid="bg-card">
            <CardHeader>
              <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
                <Image className="w-5 h-5 text-[#00C853]" /> Arka Plan Resmi
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Login sayfasi sol panel arka plan resmi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-900 relative">
                  {settings.login_bg_url && (
                    <img src={resolveUrl(settings.login_bg_url)} alt="BG" className="w-full h-full object-cover opacity-30" />
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input type="file" ref={bgInputRef} accept="image/*" onChange={handleBgUpload} className="hidden" />
                  <Button
                    onClick={() => bgInputRef.current?.click()}
                    disabled={uploadingBg}
                    size="sm"
                    className="bg-[#111111] hover:bg-[#222222] text-white text-xs uppercase tracking-wider"
                    data-testid="upload-bg-btn"
                  >
                    {uploadingBg ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <Upload className="w-3 h-3 mr-1" />
                    )}
                    Resim Yukle
                  </Button>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">veya URL girin</Label>
                    <Input
                      value={settings.login_bg_url || ''}
                      onChange={e => setSettings(prev => ({ ...prev, login_bg_url: e.target.value }))}
                      placeholder="https://..."
                      className="h-9 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853] text-xs"
                      data-testid="bg-url-input"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Settings */}
          <Card className="bg-white shadow-sm lg:col-span-2" data-testid="text-card">
            <CardHeader>
              <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
                <Type className="w-5 h-5 text-[#00C853]" /> Login Metinleri
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Login sayfasi sol paneldeki baslik ve alt yazi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Baslik Satir 1</Label>
                  <Input
                    value={settings.login_title_line1 || ''}
                    onChange={e => setSettings(prev => ({ ...prev, login_title_line1: e.target.value }))}
                    placeholder="Lider Yetistirme Platformu"
                    className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                    data-testid="title-line1-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Baslik Satir 2 (Yesil - Opsiyonel)</Label>
                  <Input
                    value={settings.login_title_line2 || ''}
                    onChange={e => setSettings(prev => ({ ...prev, login_title_line2: e.target.value }))}
                    placeholder="Opsiyonel ikinci satir..."
                    className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                    data-testid="title-line2-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Alt Yazi</Label>
                <Input
                  value={settings.login_subtitle || ''}
                  onChange={e => setSettings(prev => ({ ...prev, login_subtitle: e.target.value }))}
                  placeholder="ProFit Team'e Hos Geldin!"
                  className="h-11 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853]"
                  data-testid="subtitle-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-white shadow-sm lg:col-span-2" data-testid="stats-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
                    <BarChart3 className="w-5 h-5 text-[#00C853]" /> Istatistikler
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Login sayfasi alt kisimda gorunen istatistik kutulari
                  </CardDescription>
                </div>
                <Button
                  onClick={addStat}
                  size="sm"
                  className="bg-[#111111] hover:bg-[#222222] text-white text-xs uppercase tracking-wider"
                  data-testid="add-stat-btn"
                >
                  <Plus className="w-3 h-3 mr-1" /> Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {settings.stats?.map((stat, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50" data-testid={`stat-row-${i}`}>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={stat.value}
                        onChange={e => updateStat(i, 'value', e.target.value)}
                        placeholder="500+"
                        className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-[#00C853] text-sm font-bold"
                        data-testid={`stat-value-${i}`}
                      />
                      <Input
                        value={stat.label}
                        onChange={e => updateStat(i, 'label', e.target.value)}
                        placeholder="Egitim Saati"
                        className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-[#00C853] text-sm"
                        data-testid={`stat-label-${i}`}
                      />
                    </div>
                    <button
                      onClick={() => removeStat(i)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      data-testid={`remove-stat-${i}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {settings.stats?.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">Henuz istatistik eklenmemis</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
