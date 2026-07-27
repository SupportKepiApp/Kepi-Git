import { useEffect, useState } from 'react';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

const TITLES: Record<LegalModalProps['type'], string> = {
  privacy: 'Gizlilik Politikası',
  terms: 'Kullanım Şartları',
};

const FILES: Record<LegalModalProps['type'], () => Promise<{ default: string }>> = {
  privacy: () => import('./content/privacy-policy.md?raw'),
  terms: () => import('./content/terms-of-service.md?raw'),
};

function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inList = false;

  const inline = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-brand underline">$1</a>');

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#{1,3}\s/.test(line)) {
      if (inList) { html += '</ul>'; inList = false; }
      const level = line.match(/^(#{1,3})/)?.[0].length ?? 1;
      const text = inline(line.replace(/^#{1,3}\s/, ''));
      const size = level === 1 ? 'text-lg' : level === 2 ? 'text-base' : 'text-sm';
      html += `<h${level} class="${size} font-bold text-content mt-4 mb-2">${text}</h${level}>`;
    } else if (/^\d+\.\s/.test(line)) {
      if (!inList) { html += '<ul class="list-decimal pl-5 space-y-1">'; inList = true; }
      html += `<li class="text-sm text-content">${inline(line.replace(/^\d+\.\s/, ''))}</li>`;
    } else if (/^-\s/.test(line)) {
      if (!inList) { html += '<ul class="list-disc pl-5 space-y-1">'; inList = true; }
      html += `<li class="text-sm text-content">${inline(line.replace(/^-\s/, ''))}</li>`;
    } else if (line === '') {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<div class="h-2"></div>';
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p class="text-sm leading-relaxed text-content-dim">${inline(line)}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return html;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-up" />
      <div
        className="relative z-10 w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl bg-surface-1 ring-1 ring-border shadow-card-lg animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-content">{TITLES[type]}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-content-dim ring-1 ring-border transition-all hover:text-content hover:ring-brand/40 active:scale-90"
            aria-label="Kapat"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
          <MarkdownLoader type={type} />
        </div>
        <div className="border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-dark active:scale-[0.98]"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

function MarkdownLoader({ type }: { type: LegalModalProps['type'] }) {
  const [content, setContent] = useState<string | null>(null);
  useEffect(() => {
    FILES[type]().then((m) => setContent(m.default)).catch(() => setContent('İçerik yüklenemedi.'));
  }, [type]);
  if (content === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }
  return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />;
}
