import React, { useState, useEffect } from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

interface AnimatedTextProps {
  texts: string[];
  interval?: number;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  texts, 
  interval = 20000, 
  className,
  style 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // Анимация исчезновения
      setIsVisible(false);
      
      // Через 500ms меняем текст и показываем
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
        setIsVisible(true);
      }, 500);
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <Title 
      level={3} 
      className={className}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s ease-in-out',
        minHeight: '1.5em', // Предотвращает скачки высоты
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {texts[currentIndex]}
    </Title>
  );
};

export default AnimatedText;
