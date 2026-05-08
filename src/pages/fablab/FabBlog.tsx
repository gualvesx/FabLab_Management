import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Eye, Edit3, Trash2, Bold, Italic, Heading2, Link2, Image, List, Quote, Code, Save, X, Calendar, User, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { supabase } from '@/lib/supabase';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  cover_url: string;
  tags: string[];
  author: string;
  author_role: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

// ── Markdown → HTML renderer ────────────────────────────────────────────────
function renderMarkdown(md: string): string {
  if (!md) return '';
  let html = md
    // headings
    .replace(/^#{3}\s+(.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-foreground">$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2 class="text-xl font-extrabold mt-8 mb-3 text-foreground">$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1 class="text-2xl font-black mt-8 mb-4 text-foreground">$1</h1>')
    // inline styles
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`([^`\n]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
    // blockquote
    .replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-4 py-1">$1</blockquote>')
    // horizontal rule
    .replace(/^---$/gm, '<hr class="border-border my-6" />')
    // unordered list items
    .replace(/^[-*]\s+(.+)$/gm, '<li class="ml-6 list-disc my-0.5 text-foreground">$1</li>')
    // ordered list items
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-6 list-decimal my-0.5 text-foreground">$1</li>')
    // wrap consecutive <li> in <ul>/<ol>
    .replace(/((?:<li class="ml-6 list-disc[^>]*>.*?<\/li>\n?)+)/g, '<ul class="my-4 space-y-1">$1</ul>')
    .replace(/((?:<li class="ml-6 list-decimal[^>]*>.*?<\/li>\n?)+)/g, '<ol class="my-4 space-y-1">$1</ol>')
    // images (must come before links)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<figure class="my-6"><img src="$2" alt="$1" class="w-full rounded-xl max-h-96 object-cover border border-border" /><figcaption class="text-center text-xs text-muted-foreground mt-2">$1</figcaption></figure>')
    // links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">$1</a>')
    // code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-xl p-4 overflow-x-auto my-4"><code class="text-sm font-mono text-foreground">$1</code></pre>')
    // paragraphs: lines that are not already HTML tags
    .replace(/^(?!<[houbl]|<p|<hr|<fig|<pre|<blockquote)(.+)$/gm, '<p class="my-3 text-foreground leading-relaxed">$1</p>')
    // blank lines
    .replace(/\n{3,}/g, '\n\n');
  return html;
}

// ── Toolbar button ──────────────────────────────────────────────────────────
function ToolBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
      {icon}
    </button>
  );
}

// ── Markdown Editor ─────────────────────────────────────────────────────────
function MarkdownEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = (before: string, after = '', placeholder_text = 'texto') => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = el.value.substring(start, end) || placeholder_text;
    const newVal = el.value.substring(0, start) + before + sel + after + el.value.substring(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + sel.length);
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = el.value.lastIndexOf('\n', start - 1) + 1;
    const newVal = el.value.substring(0, lineStart) + prefix + el.value.substring(lineStart);
    onChange(newVal);
    setTimeout(() => el.focus(), 0);
  };

  const insertImage = () => {
    const url = prompt('Cole a URL da imagem:');
    if (!url) return;
    const alt = prompt('Texto alternativo (opcional):') || '';
    insert(`\n![${alt}](${url})\n`, '', '');
  };

  const insertLink = () => {
    const url = prompt('Cole a URL do link:');
    if (!url) return;
    insert('[', `](${url})`, 'texto do link');
  };

  const insertCodeBlock = () => insert('\n```\n', '\n```\n', 'código aqui');

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/30 flex-wrap gap-y-1">
        <ToolBtn icon={<Bold size={14} />} title="Negrito (**texto**)" onClick={() => insert('**', '**', 'negrito')} />
        <ToolBtn icon={<Italic size={14} />} title="Itálico (*texto*)" onClick={() => insert('*', '*', 'itálico')} />
        <ToolBtn icon={<Code size={14} />} title="Código inline (`código`)" onClick={() => insert('`', '`', 'código')} />
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolBtn icon={<Heading2 size={14} />} title="Título ## " onClick={() => insertAtLineStart('## ')} />
        <ToolBtn icon={<List size={14} />} title="Lista - item" onClick={() => insertAtLineStart('- ')} />
        <ToolBtn icon={<Quote size={14} />} title="Citação > texto" onClick={() => insertAtLineStart('> ')} />
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolBtn icon={<Link2 size={14} />} title="Inserir link" onClick={insertLink} />
        <ToolBtn icon={<Image size={14} />} title="Inserir imagem via URL" onClick={insertImage} />
        <ToolBtn icon={<Code size={14} />} title="Bloco de código ```" onClick={insertCodeBlock} />
        <div className="flex-1" />
        <button type="button" onClick={() => setPreview(!preview)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            preview ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
          }`}>
          <Eye size={12} />
          {preview ? 'Editar' : 'Preview'}
        </button>
      </div>

      {/* Editor or Preview */}
      {preview ? (
        <div
          className="min-h-[320px] max-h-[500px] overflow-y-auto p-5 text-sm"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(value) || '<p class="text-muted-foreground italic text-sm">Nada escrito ainda…</p>'
          }}
        />
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '# Título do post\n\nComece a escrever seu artigo aqui...\n\nUse **negrito**, *itálico*, `código`, ![imagem](url) e mais!'}
          className="w-full min-h-[320px] p-4 bg-transparent text-sm font-mono resize-y outline-none text-foreground placeholder:text-muted-foreground/40 leading-relaxed"
          spellCheck={false}
        />
      )}

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-border bg-muted/20 text-[10px] text-muted-foreground flex gap-3 flex-wrap">
        <span><kbd className="font-mono bg-muted px-1 rounded">**texto**</kbd> negrito</span>
        <span><kbd className="font-mono bg-muted px-1 rounded">*texto*</kbd> itálico</span>
        <span><kbd className="font-mono bg-muted px-1 rounded">## Título</kbd> cabeçalho</span>
        <span><kbd className="font-mono bg-muted px-1 rounded">- item</kbd> lista</span>
        <span><kbd className="font-mono bg-muted px-1 rounded">![alt](url)</kbd> imagem</span>
        <span><kbd className="font-mono bg-muted px-1 rounded">[link](url)</kbd> link</span>
      </div>
    </div>
  );
}

// ── Post Card ───────────────────────────────────────────────────────────────
function PostCard({ post, onRead, onEdit, onDelete, isAdmin, t }: {
  post: BlogPost; onRead: () => void; onEdit: () => void; onDelete: () => void; isAdmin: boolean;
  t: (k: string) => string;
}) {
  const date = new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 group flex flex-col">
      {/* Cover */}
      <div className="h-44 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0">
        {post.cover_url ? (
          <img src={post.cover_url} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-primary/30"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>`; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Edit3 size={32} className="text-primary/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] font-medium">{tag}</Badge>
          ))}
          {!post.published && (
            <Badge variant="outline" className="text-[10px] border-yellow-400/50 text-yellow-600 dark:text-yellow-400">
              {t('app.draft')}
            </Badge>
          )}
        </div>

        <h3 className="font-extrabold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="text-muted-foreground text-xs line-clamp-2 mb-4 leading-relaxed flex-1">
          {post.content.replace(/[#*`>\[\]!()\-=_~]/g, '').replace(/\n+/g, ' ').trim().substring(0, 130)}…
        </p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <User size={11} className="flex-shrink-0" />
            <span className="truncate max-w-[80px]">{post.author}</span>
            <span className="flex-shrink-0">·</span>
            <Calendar size={11} className="flex-shrink-0" />
            <span className="flex-shrink-0">{date}</span>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={onRead}>
              <Eye size={11} className="mr-1" />{t('fablab.readMore')}
            </Button>
            {isAdmin && (
              <>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
                  <Edit3 size={11} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
                  <Trash2 size={11} />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Post Reader ─────────────────────────────────────────────────────────────
function PostReader({ post, onBack, t }: { post: BlogPost; onBack: () => void; t: (k: string) => string }) {
  return (
    <PageTransition>
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors group">
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        {t('fablab.backToBlog')}
      </button>

      {post.cover_url && (
        <div className="w-full h-52 md:h-80 rounded-2xl overflow-hidden mb-8 border border-border">
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>

        <h1 className="text-3xl font-black mb-4 leading-tight">{post.title}</h1>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-10 pb-6 border-b border-border">
          <User size={14} />
          <span className="font-medium">{post.author}</span>
          <span>·</span>
          <Calendar size={14} />
          <span>
            {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </div>
    </PageTransition>
  );
}

// ── Main FabBlog Page ───────────────────────────────────────────────────────
export function FabBlog() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'professor';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [readPost, setReadPost] = useState<BlogPost | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = (): Partial<BlogPost> => ({
    title: '',
    content: '',
    cover_url: '',
    tags: [],
    published: false,
    author: user?.name || '',
    author_role: user?.role || '',
  });
  const [form, setForm] = useState<Partial<BlogPost>>(emptyForm());
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    let q = supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (!isAdmin) q = q.eq('published', true);
    const { data } = await q;
    setPosts((data as BlogPost[]) ?? []);
    setLoading(false);
  };

  const handleSave = async (publish: boolean) => {
    if (!form.title?.trim() || !form.content?.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = {
      title: form.title,
      content: form.content,
      cover_url: form.cover_url || '',
      tags,
      author: form.author,
      author_role: form.author_role,
      published: publish,
      updated_at: now,
    };

    if (editingPost) {
      await supabase.from('blog_posts').update(payload).eq('id', editingPost.id);
    } else {
      await supabase.from('blog_posts').insert({ ...payload, created_at: now });
    }

    setSaving(false);
    closeEditor();
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('fablab.deletePost'))) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    fetchPosts();
  };

  const openEditor = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setForm({ ...post });
      setTagsInput(Array.isArray(post.tags) ? post.tags.join(', ') : '');
    } else {
      setEditingPost(null);
      setForm(emptyForm());
      setTagsInput('');
    }
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingPost(null);
    setForm(emptyForm());
    setTagsInput('');
  };

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.tags.some((tag) => tag.toLowerCase().includes(q));
  });

  // ── Post Reader view ──
  if (readPost) {
    return <PostReader post={readPost} onBack={() => setReadPost(null)} t={t} />;
  }

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-extrabold">{t('fablab.blogTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('fablab.blogSubtitle')}</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => openEditor()} style={{ background: 'var(--fab-primary)' }}>
            <Plus size={14} className="mr-1" />{t('fablab.newPost')}
          </Button>
        )}
      </div>

      {/* Search */}
      <Input
        placeholder={t('fablab.searchPosts')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10 mb-6"
      />

      {/* Posts Grid */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full spinner" />
          <span className="text-sm">{t('fablab.loadingPosts')}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Edit3 size={40} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="font-semibold text-muted-foreground">{t('fablab.noPosts')}</p>
          {isAdmin && search === '' && (
            <p className="text-sm text-muted-foreground mt-1">{t('fablab.noPostsHint')}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onRead={() => setReadPost(post)}
              onEdit={() => openEditor(post)}
              onDelete={() => handleDelete(post.id)}
              isAdmin={isAdmin}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? t('fablab.editPostTitle') : t('fablab.newPostTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-1">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('fablab.titleRequired')}
              </label>
              <Input
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título do post"
                className="h-10 font-semibold"
              />
            </div>

            {/* Cover URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Image size={11} />{t('fablab.coverImage')}
              </label>
              <Input
                value={form.cover_url || ''}
                onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
                className="h-10"
              />
              {form.cover_url && (
                <div className="h-32 rounded-xl overflow-hidden border border-border">
                  <img src={form.cover_url} alt="preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('fablab.tagsComma')}
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Impressão 3D, Tutorial, Arduino, Robótica"
                className="h-10"
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('fablab.contentMarkdown')}
              </label>
              <MarkdownEditor
                value={form.content || ''}
                onChange={(v) => setForm({ ...form, content: v })}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={closeEditor}>
                <X size={13} className="mr-1" />{t('app.cancel')}
              </Button>
              <Button variant="outline" size="sm" disabled={saving} onClick={() => handleSave(false)}>
                <Save size={13} className="mr-1" />{t('app.saveDraft')}
              </Button>
              <Button size="sm" disabled={saving} onClick={() => handleSave(true)}
                style={{ background: 'var(--fab-primary)' }}>
                {saving
                  ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full spinner" />
                  : <><Save size={13} className="mr-1" />{t('app.publish')}</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
