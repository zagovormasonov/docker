import React, { useEffect, useState } from 'react';
import { Typography, Card, Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';

const LoyaltyPage: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/loyalty.md')
      .then(res => res.text())
      .then(text => {
        // Очищаем текст от служебных заголовков, если они есть
        const cleanedText = text
          .replace(/## Текст для блока в профиле \(основной\)/g, '')
          .replace(/## Текст для всплывающего окна \(по клику на «10%» или «Подробнее»\)/g, '')
          .replace(/### Заголовок окна:/g, '')
          .replace(/### Тело окна:/g, '')
          .trim();
        
        setContent(cleanedText);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 800 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        Назад
      </Button>
      <Card
        style={{
          borderRadius: 24,
          boxShadow: '0 12px 48px rgba(0,0,0,0.08)',
          border: 'none',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div className="markdown-content" style={{ padding: '0 12px' }}>
             <div dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }} />
          </div>
        )}
      </Card>
      
      <style>{`
        .markdown-content h1 { font-size: 28px; margin-bottom: 24px; text-align: center; color: #1a1a1a; font-weight: 700; }
        .markdown-content h2 { font-size: 22px; margin-top: 32px; margin-bottom: 16px; color: #333; font-weight: 600; }
        .markdown-content h3 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; color: #444; font-weight: 600; }
        .markdown-content p { margin-bottom: 16px; line-height: 1.6; color: #555; font-size: 16px; }
        .markdown-content table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; background: white; border-radius: 8px; overflow: hidden; }
        .markdown-content th, .markdown-content td { border: 1px solid #eee; padding: 12px 16px; text-align: left; }
        .markdown-content th { background-color: #f9fafb; font-weight: 600; color: #374151; }
        .markdown-content blockquote { border-left: 4px solid #6366f1; padding: 8px 16px; margin: 16px 0; color: #4b5563; font-style: italic; background: #f5f3ff; border-radius: 0 8px 8px 0; }
        .markdown-content hr { border: none; border-top: 1px solid #eee; margin: 32px 0; }
        .markdown-content strong { color: #111827; }
        .markdown-content ul, .markdown-content ol { margin-bottom: 16px; padding-left: 24px; }
        .markdown-content li { margin-bottom: 8px; color: #4b5563; }
        
        @media (max-width: 576px) {
          .markdown-content table { font-size: 12px; display: block; overflow-x: auto; }
          .markdown-content th, .markdown-content td { padding: 8px; }
        }
      `}</style>
    </div>
  );
};

export default LoyaltyPage;
