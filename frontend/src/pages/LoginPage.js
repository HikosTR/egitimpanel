import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(email, password);
      if (userData.role === 'distributor') {
        navigate('/dashboard');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Giris basarisiz. Lutfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left Panel - Dark */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-[#111111] relative overflow-hidden flex-col justify-between p-12"
        data-testid="login-left-panel"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1758518731468-98e90ffd7430?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwyfHxjb3Jwb3JhdGUlMjBsZWFkZXJzaGlwJTIwdGVhbSUyMG1lZXRpbmclMjBtb2Rlcm4lMjBvZmZpY2V8ZW58MHx8fHwxNzcxMTkzMjk1fDA&ixlib=rb-4.1.0&q=85)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div className="w-10 h-10 rounded-lg bg-[#00C853] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              PROFIT TEAM
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h1
            className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight uppercase mb-6"
            style={{ fontFamily: 'Barlow Condensed' }}
          >
            Liderler dogmaz,<br />
            <span className="text-[#00C853]">egitilir.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">
            ProFit Team'e hos geldin. Basariya giden yolda egitim en guclu silahimiz.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold text-[#00C853]" style={{ fontFamily: 'Barlow Condensed' }}>500+</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Egitim Saati</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-3xl font-bold text-[#00C853]" style={{ fontFamily: 'Barlow Condensed' }}>1000+</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Mezun</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-3xl font-bold text-[#00C853]" style={{ fontFamily: 'Barlow Condensed' }}>98%</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Memnuniyet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-lg bg-[#00C853] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#111111] tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              PROFIT TEAM
            </span>
          </div>

          <div className="mb-10">
            <h2
              className="text-3xl font-bold text-[#111111] uppercase tracking-tight mb-2"
              style={{ fontFamily: 'Barlow Condensed' }}
            >
              Giris Yap
            </h2>
            <p className="text-gray-500 text-sm">E-posta ve sifrenizle devam edin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fadeIn"
                data-testid="login-error"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                E-Posta
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@profitteam.tr"
                className="h-12 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853] text-[#111111]"
                required
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Sifre
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sifrenizi girin"
                  className="h-12 bg-[#F5F7FA] border-0 focus:ring-2 focus:ring-[#00C853] pr-12 text-[#111111]"
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-bold uppercase tracking-wider text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Giris Yap
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Bu platform sadece ProFit Team uyeleri icindir.
          </p>
        </div>
      </div>
    </div>
  );
}
