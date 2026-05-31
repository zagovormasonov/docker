import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { marked } from 'marked';
import api from '../api/axios';
import './CreateArticlePage.css';

marked.setOptions({ breaks: true });

const MARKDOWN_PATTERNS = [
  /\*\*(.*?)\*\*/, /__(.*?)__/, /`{1,3}[^`]+`{1,3}/,
  /^>{1,}\s/m, /^#{1,6}\s/m, /^\s*[-*+]\s+/m,
  /\[(.*?)\]\((.*?)\)/, /!\[(.*?)\]\((.*?)\)/,
];

const looksLikeMarkdown = (text: string) => MARKDOWN_PATTERNS.some((p) => p.test(text));

const stripHtml = (html: string) => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
};

const CATEGORIES = [
  { key: 'chan', label: 'Ченнелинг' },
  { key: 'psych', label: 'Психология' },
  { key: 'soul', label: 'Духовный путь' },
  { key: 'money', label: 'Деньги и рост' },
  { key: 'body', label: 'Тело и здоровье' },
  { key: 'zolk', label: 'Цолькин' },
  { key: 'story', label: 'История мастера' },
];

const CreateArticlePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quillRef = useRef<ReactQuill>(null);
  const isEdit = !!id;
  const publishNow = searchParams.get('publishNow') === '1';
  const redirectTo = searchParams.get('redirectTo') || '/my-articles';

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState('');
  const [category, setCategory] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverInput, setCoverInput] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);

  useEffect(() => {
    if (isEdit) fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    setLoadingArticle(true);
    try {
      const { data } = await api.get(`/articles/${id}`);
      setTitle(data.title || '');
      setContent(data.content || '');
      setCategory(data.category || '');
      setCoverUrl(data.cover_image || '');
      setCoverInput(data.cover_image || '');
    } catch {
      message.error('Ошибка загрузки статьи');
      navigate('/my-articles');
    } finally {
      setLoadingArticle(false);
    }
  };

  const validate = () => {
    let ok = true;

    if (!title.trim() || title.trim().length < 5) {
      setTitleError('Минимум 5 символов');
      ok = false;
    } else if (title.trim().length > 200) {
      setTitleError('Максимум 200 символов');
      ok = false;
    } else {
      setTitleError('');
    }

    const plain = stripHtml(content).trim();
    if (!content.trim() || content === '<p><br></p>' || plain.length < 50) {
      setContentError('Минимум 50 символов текста');
      ok = false;
    } else {
      setContentError('');
    }

    return ok;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const data = {
        title: stripHtml(title),
        content,
        category: category || null,
        coverImage: coverUrl || null,
        publishNow,
      };

      if (isEdit) {
        const res = await api.put(`/articles/${id}`, data);
        if (publishNow) {
          await api.post(`/articles/${id}/publish`);
        }
        message.success(publishNow ? 'Статья опубликована!' : (res.data.message || 'Статья обновлена!'));
      } else {
        const res = await api.post('/articles', data);
        if (publishNow && res.data?.id) {
          await api.post(`/articles/${res.data.id}/publish`);
        }
        message.success(publishNow ? 'Статья опубликована!' : (res.data.message || 'Статья создана!'));
      }

      navigate(redirectTo);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverFile = async (file: File) => {
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCoverUrl(data.url);
      setCoverInput(data.url);
      message.success('Обложка загружена!');
    } catch {
      message.error('Ошибка загрузки обложки');
    } finally {
      setUploadingCover(false);
    }
  };

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      const fd = new FormData();
      fd.append('image', input.files[0]);
      try {
        const hide = message.loading('Загрузка...', 0);
        const { data } = await api.post('/upload/image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        hide();
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const r = quill.getSelection(true);
          quill.insertEmbed(r.index, 'image', data.url);
          quill.setSelection(r.index + 1, 0);
        }
      } catch {
        message.error('Ошибка загрузки');
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['link', 'image'],
        [{ align: [] }],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
  }), [imageHandler]);

  const formats = useMemo(() => [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent', 'link', 'image', 'align',
  ], []);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    const root = quill?.root;
    if (!quill || !root) return;

    const handler = (e: ClipboardEvent) => {
      const plain = e.clipboardData?.getData('text/plain');
      if (!plain || !looksLikeMarkdown(plain)) return;
      const html = marked.parse(plain);
      if (typeof html !== 'string' || !html.trim()) return;

      e.preventDefault();
      const sel = quill.getSelection(true);
      const idx = sel ? sel.index : quill.getLength();
      if (sel?.length) quill.deleteText(sel.index, sel.length, 'user');
      quill.clipboard.dangerouslyPasteHTML(idx, html.trim(), 'user');
    };

    root.addEventListener('paste', handler);
    return () => root.removeEventListener('paste', handler);
  }, []);

  const charCount = title.length;
  const pageTitle = isEdit ? 'Редактировать статью' : 'Написать статью';
  const submitLabel = loading
    ? 'Сохранение...'
    : publishNow
      ? (isEdit ? 'Обновить и опубликовать' : 'Опубликовать статью')
      : (isEdit ? 'Сохранить изменения' : 'Создать статью');

  if (loadingArticle) {
    return (
      <div className="ca-loading">
        <div className="ca-spinner" />
        <span>Загрузка статьи...</span>
      </div>
    );
  }

  return (
    <div className="ca-page">
      <div className="ca-hero">
        <div className="ca-eyebrow">
          <svg width="7" height="7" viewBox="0 0 7 7" aria-hidden>
            <circle cx="3.5" cy="3.5" r="3" fill="#7B6FD4" />
          </svg>
          {isEdit ? 'Редактирование' : 'Новая публикация'}
        </div>
        <div className="ca-hero-title">{pageTitle}</div>
        <div className="ca-hero-sub">
          {publishNow
            ? 'После сохранения статья сразу появится в разделе.'
            : 'Статья сохраняется как черновик — отправить на публикацию можно из «Моих статей».'}
        </div>
      </div>

      <div className="ca-layout">
        <div className="ca-editor-col">
          <div className="ca-field">
            <div className="ca-field-header">
              <label className="ca-label" htmlFor="ca-title">Заголовок <span className="ca-req">*</span></label>
              <span className={`ca-char-count${charCount > 180 ? ' ca-char-warn' : ''}`}>{charCount}/200</span>
            </div>
            <input
              id="ca-title"
              type="text"
              className={`ca-title-inp${titleError ? ' ca-inp-err' : ''}`}
              placeholder="Введите заголовок статьи..."
              value={title}
              maxLength={200}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError('');
              }}
            />
            {titleError && <div className="ca-err-msg">{titleError}</div>}
          </div>

          <div className="ca-field">
            <label className="ca-label">Содержание <span className="ca-req">*</span></label>
            <div className={`ca-quill-wrap${contentError ? ' ca-inp-err' : ''}`}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={(v) => {
                  setContent(v);
                  if (contentError) setContentError('');
                }}
                modules={modules}
                formats={formats}
                placeholder="Напишите вашу статью здесь..."
              />
            </div>
            {contentError
              ? <div className="ca-err-msg">{contentError}</div>
              : <div className="ca-hint">Минимум 50 символов. Поддерживается вставка Markdown.</div>}
          </div>
        </div>

        <div className="ca-sidebar">
          <div className="ca-side-card">
            <div className="ca-side-h">Обложка статьи</div>

            {coverUrl ? (
              <div className="ca-cover-preview">
                <img src={coverUrl} alt="Обложка" className="ca-cover-img" />
                <button
                  type="button"
                  className="ca-cover-remove"
                  onClick={() => {
                    setCoverUrl('');
                    setCoverInput('');
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Удалить
                </button>
              </div>
            ) : (
              <div className="ca-cover-upload-zone">
                <label className={`ca-upload-btn${uploadingCover ? ' ca-uploading' : ''}`}>
                  {uploadingCover ? (
                    <><span className="ca-btn-spinner ca-btn-spinner--dark" /> Загрузка...</>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
                        <path d="M7.5 10V2M4 5l3.5-3.5L11 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 11.5V13h11v-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      Загрузить файл
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleCoverFile(e.target.files[0]);
                    }}
                    disabled={uploadingCover}
                  />
                </label>
                <div className="ca-cover-divider"><span>или</span></div>
                <input
                  type="text"
                  className="ca-url-inp"
                  placeholder="Вставьте URL изображения"
                  value={coverInput}
                  onChange={(e) => {
                    setCoverInput(e.target.value);
                    setCoverUrl(e.target.value);
                  }}
                />
              </div>
            )}
          </div>

          <div className="ca-side-card">
            <div className="ca-side-h">Категория</div>
            <div className="ca-cats">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`ca-cat-pill${category === c.key ? ' ca-cat-on' : ''}`}
                  onClick={() => setCategory(category === c.key ? '' : c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ca-side-card ca-tips-card">
            <div className="ca-side-h">Советы</div>
            <ul className="ca-tips">
              <li>Добавьте яркий заголовок — читатели выбирают по первым словам.</li>
              <li>Личный опыт и конкретные примеры делают текст живым.</li>
              <li>Обложка увеличивает кликабельность в ленте в 3 раза.</li>
              <li>Поддерживается вставка Markdown из буфера обмена.</li>
            </ul>
          </div>

          <button type="button" className="ca-submit-btn ca-submit-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="ca-btn-spinner" /> {submitLabel}</> : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateArticlePage;
