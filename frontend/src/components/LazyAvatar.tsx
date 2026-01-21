import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarProps } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface LazyAvatarProps extends Omit<AvatarProps, 'src'> {
  src?: string;
  defaultSrc?: string;
}

const LazyAvatar: React.FC<LazyAvatarProps> = ({
  src,
  defaultSrc = '/emp.jpg',
  icon = <UserOutlined />,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isInView, setIsInView] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!avatarRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Загружаем за 100px до видимости
        threshold: 0.01,
      }
    );

    observer.observe(avatarRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isInView && src) {
      // Предзагрузка изображения
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
      };
      img.onerror = () => {
        setImageSrc(defaultSrc);
      };
    } else if (isInView && !src) {
      setImageSrc(defaultSrc);
    }
  }, [isInView, src, defaultSrc]);

  return (
    <div ref={avatarRef} style={{ display: 'inline-flex', flexShrink: 0 }}>
      <Avatar
        {...props}
        src={imageSrc}
        icon={!imageSrc && icon}
      />
    </div>
  );
};

export default LazyAvatar;

