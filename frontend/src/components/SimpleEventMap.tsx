import React from 'react';

interface SimpleEventMapProps {
  location: string;
  cityName: string;
  eventTitle: string;
}

const SimpleEventMap: React.FC<SimpleEventMapProps> = ({ location, cityName, eventTitle }) => {
  // Создаем простую карту через iframe с Yandex Maps
  const mapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(`${location}, ${cityName}`)}&mode=search`;

  return (
    <div style={{ height: 300, borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        title={`Карта события: ${eventTitle}`}
        style={{ border: 'none' }}
      />
      <div style={{ 
        position: 'absolute', 
        bottom: 10, 
        right: 10, 
        background: 'rgba(255, 255, 255, 0.9)', 
        padding: '5px 10px', 
        borderRadius: 4,
        fontSize: 12,
        color: '#666'
      }}>
        <a 
          href={mapUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#1890ff', textDecoration: 'none' }}
        >
          Открыть в Яндекс.Картах
        </a>
      </div>
    </div>
  );
};

export default SimpleEventMap;
