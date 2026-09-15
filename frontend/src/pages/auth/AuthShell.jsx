// Login/Register uchun umumiy premium qobiq: chap tomonda brend paneli, o'ngda forma
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';
import { RiHeartPulseLine, RiRobot2Line, RiHospitalLine, RiBarChartBoxLine, RiShieldCheckLine } from 'react-icons/ri';

export default function AuthShell({ heroTitle1, heroTitle2, heroDesc, features, title, subtitle, children, footer }) {
  const { t } = useLanguage();
  const FEATURES = features || [
    { icon: RiRobot2Line, label: t('login_feature_ai') },
    { icon: RiHospitalLine, label: t('login_feature_specialties') },
    { icon: RiBarChartBoxLine, label: t('login_feature_scoring') },
  ];

  return (
    <div className="min-h-[100dvh] flex bg-white">
      {/* ── Brand pane ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_-10%,rgba(16,185,129,0.22),transparent_60%),radial-gradient(700px_400px_at_-10%_100%,rgba(37,99,235,0.25),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] bg-[size:36px_36px]" />
        <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full border border-white/5" />
        <div className="absolute -bottom-40 -right-40 w-[620px] h-[620px] rounded-full border border-white/5" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/10">
            <RiHeartPulseLine size={24} />
          </div>
          <div>
            <p className="text-white text-lg font-extrabold tracking-tight leading-none">UzMedik</p>
            <p className="text-emerald-300/80 text-[10px] font-bold tracking-[0.18em] uppercase mt-1">{t('app_title')} · {t('app_subtitle')}</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-balance">
            {heroTitle1} <br /><span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{heroTitle2}</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed font-medium mt-5 max-w-md">{heroDesc}</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <span key={i} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-bold backdrop-blur">
                  <Icon className="text-emerald-400" /> {f.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-slate-500 text-xs font-medium">
          <span>© {new Date().getFullYear()} UzMedik. {t('login_footer_rights')}.</span>
          <span className="inline-flex items-center gap-1.5"><RiShieldCheckLine className="text-emerald-500" /> {t('login_secure')}</span>
        </div>
      </div>

      {/* ── Form pane ── */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(700px_300px_at_100%_0%,rgba(37,99,235,0.06),transparent_60%)]">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md"><RiHeartPulseLine size={20} /></div>
            <span className="text-slate-900 text-lg font-extrabold tracking-tight">UzMedik</span>
          </div>
          <div className="ml-auto"><LanguageSelector variant="compact" /></div>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 pb-10">
          <div className="w-full max-w-[420px] animate-fade-up">
            <div className="mb-7">
              <h2 className="text-2xl sm:text-[1.9rem] font-extrabold text-slate-900 tracking-tight">{title}</h2>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">{subtitle}</p>
            </div>
            {children}
            {footer && <div className="mt-7 text-center text-sm text-slate-500 font-medium">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
