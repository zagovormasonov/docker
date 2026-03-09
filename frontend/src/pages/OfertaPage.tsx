import React, { useEffect, useState } from 'react';
import { Typography, Card, Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const OfertaPage: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/oferta.md')
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const renderMarkdown = (md: string) => {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${i}`} style={{ paddingLeft: 24, marginBottom: 16 }}>
            {listItems.map((item, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>
                <span dangerouslySetInnerHTML={{ __html: applyInline(item) }} />
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const applyInline = (text: string): string => {
      return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    };

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('# ')) {
        flushList();
        elements.push(<Title key={i} level={1} style={{ textAlign: 'center', marginBottom: 24, marginTop: 8 }}>{line.slice(2)}</Title>);
      } else if (line.startsWith('## ')) {
        flushList();
        elements.push(<Title key={i} level={2} style={{ marginTop: 24, marginBottom: 12 }}>{line.slice(3)}</Title>);
      } else if (line.startsWith('### ')) {
        flushList();
        elements.push(<Title key={i} level={3} style={{ marginTop: 16, marginBottom: 8 }}>{line.slice(4)}</Title>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        listItems.push(line.slice(2));
      } else if (line.startsWith('---')) {
        flushList();
        elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '16px 0' }} />);
      } else if (line.trim() === '') {
        flushList();
      } else if (line.trim()) {
        flushList();
        elements.push(
          <Paragraph key={i}>
            <span dangerouslySetInnerHTML={{ __html: applyInline(line) }} />
          </Paragraph>
        );
      }
      i++;
    }
    flushList();
    return elements;
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        Назад
      </Button>
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Typography>{renderMarkdown(content)}</Typography>
        )}
      </Card>
    </div>
  );
};

export default OfertaPage;
