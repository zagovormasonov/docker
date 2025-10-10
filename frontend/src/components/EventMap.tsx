import React from 'react';

interface EventMapProps {
  location: string;
  cityName: string;
  eventTitle: string;
}

const EventMap: React.FC<EventMapProps> = ({ location, cityName, eventTitle }) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        setLoading(true);
        setError(null);

        // Загружаем Yandex Maps API
        if (!window.ymaps) {
          const script = document.createElement('script');
          // Используем API ключ из переменных окружения или без ключа для демо
          const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';
          const apiKeyParam = apiKey ? `&apikey=${apiKey}` : '';
          script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apiKeyParam}`;
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Инициализируем карту
        window.ymaps.ready(() => {
          // Геокодируем адрес
          const geocoder = window.ymaps.geocode(`${location}, ${cityName}`, {
            results: 1
          });

          geocoder.then((result: any) => {
            if (result.geoObjects.getLength() > 0) {
              const firstGeoObject = result.geoObjects.get(0);
              const coordinates = firstGeoObject.geometry.getCoordinates();

              // Создаем карту
              const map = new window.ymaps.Map(mapRef.current, {
                center: coordinates,
                zoom: 15,
                controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
              });

              // Добавляем маркер
              const placemark = new window.ymaps.Placemark(coordinates, {
                balloonContent: `
                  <div style="padding: 10px;">
                    <strong>${eventTitle}</strong><br/>
                    <span style="color: #666;">${location}</span><br/>
                    <small style="color: #999;">${cityName}</small>
                  </div>
                `,
                hintContent: eventTitle
              }, {
                preset: 'islands#redDotIcon',
                iconColor: '#ff0000'
              });

              map.geoObjects.add(placemark);
              
              // Открываем балун
              placemark.balloon.open();
              
              setLoading(false);
            } else {
              // Если точный адрес не найден, ищем по городу
              const cityGeocoder = window.ymaps.geocode(cityName, {
                results: 1
              });

              cityGeocoder.then((cityResult: any) => {
                if (cityResult.geoObjects.getLength() > 0) {
                  const firstGeoObject = cityResult.geoObjects.get(0);
                  const coordinates = firstGeoObject.geometry.getCoordinates();

                  const map = new window.ymaps.Map(mapRef.current, {
                    center: coordinates,
                    zoom: 12,
                    controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
                  });

                  const placemark = new window.ymaps.Placemark(coordinates, {
                    balloonContent: `
                      <div style="padding: 10px;">
                        <strong>${eventTitle}</strong><br/>
                        <span style="color: #666;">${location}</span><br/>
                        <small style="color: #999;">${cityName}</small><br/>
                        <small style="color: #ff6b6b;">Точный адрес не найден, показан центр города</small>
                      </div>
                    `,
                    hintContent: `${eventTitle} (${cityName})`
                  }, {
                    preset: 'islands#orangeDotIcon',
                    iconColor: '#ff6b6b'
                  });

                  map.geoObjects.add(placemark);
                  placemark.balloon.open();
                  
                  setLoading(false);
                } else {
                  setError('Не удалось найти местоположение');
                  setLoading(false);
                }
              });
            }
          });
        });

      } catch (err) {
        console.error('Ошибка инициализации карты:', err);
        setError('Ошибка загрузки карты');
        setLoading(false);
      }
    };

    initMap();
  }, [location, cityName, eventTitle]);

  if (loading) {
    return (
      <div style={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5',
        borderRadius: 8
      }}>
        <div>Загрузка карты...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5',
        borderRadius: 8,
        color: '#666'
      }}>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: 300, 
        borderRadius: 8, 
        overflow: 'hidden',
        border: '1px solid #d9d9d9'
      }} 
    />
  );
};

export default EventMap;
