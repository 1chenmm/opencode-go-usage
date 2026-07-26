import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

function openLink(url: string) {
  window.open(url, '_blank', 'noopener');
}

function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

export function About() {
  const { t } = useTranslation();
  const [version] = useState('1.1.1');
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [checkStatus, setCheckStatus] = useState<'checking' | 'latest' | 'outdated' | 'dev' | 'error'>('checking');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://api.github.com/repos/1chenmm/opencode-go-usage/tags');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const tag = data[0].name.replace(/^v/, '');
          setLatestVersion(tag);
          const cur = version.replace(/^v/, '');
          const cmp = cmpVersion(cur, tag);
          setCheckStatus(cmp === 0 ? 'latest' : cmp > 0 ? 'dev' : 'outdated');
        } else {
          setCheckStatus('error');
        }
      } catch {
        setCheckStatus('error');
      }
    })();
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-bold">{t('about.title')}</h1>
        <p className="text-xs text-base-content/40 mt-1">{t('about.version', { version })}</p>
        <p className="text-xs mt-1">
          {checkStatus === 'checking' && <span className="text-base-content/30">{t('about.checking')}</span>}
          {checkStatus === 'latest' && <span className="text-success">{t('about.latest')}</span>}
          {checkStatus === 'outdated' && <span className="text-warning">{t('about.newVersion', { version: latestVersion })}</span>}
          {checkStatus === 'dev' && <span className="text-accent">{t('about.devBuild')}</span>}
          {checkStatus === 'error' && <span className="text-error/60">{t('about.checkFailed')}</span>}
        </p>
      </div>

      <div className="border border-base-200 rounded-xl p-4 space-y-3">
        <p className="text-sm text-base-content/70 leading-relaxed">
          {t('about.desc1')}
        </p>
        <p className="text-sm text-base-content/70 leading-relaxed">
          {t('about.desc2')}
        </p>
      </div>

      <button className="btn btn-primary w-full" onClick={() => openLink('https://github.com/1chenmm/opencode-go-usage')}>
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {t('about.viewOnGitHub')}
      </button>

      <div className="border border-base-200 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-base-content/70">{t('about.features')}</h2>
        <ul className="text-sm text-base-content/60 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">-</span>
            <span>{t('about.feature1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">-</span>
            <span>{t('about.feature2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">-</span>
            <span>{t('about.feature3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">-</span>
            <span>{t('about.feature4')}</span>
          </li>
        </ul>
      </div>

      <div className="border border-base-200 rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-base-content/70">{t('about.techStack')}</h2>
        <div className="flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'daisyUI', 'Recharts', 'Hono', 'SQLite'].map((t) => (
            <span key={t} className="text-xs px-2 py-1 rounded-md bg-base-200 text-base-content/60 font-medium">{t}</span>
          ))}
        </div>
      </div>

      <div className="border border-base-200 rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-base-content/70">{t('about.thanks')}</h2>
        <p className="text-sm text-base-content/60 leading-relaxed">
          {t('about.thanksText')}
        </p>
      </div>
    </div>
  );
}
