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

  console.log('🔧 EventMap рендерится с пропсами:', { location, cityName, eventTitle });

  React.useEffect(() => {
    console.log('🚀 useEffect запущен для EventMap');
    
    // Небольшая задержка для гарантии, что DOM готов
    const timeoutId = setTimeout(() => {
      console.log('⏰ Таймаут для инициализации карты');
    }, 50);
    
    const initMap = async () => {
      console.log('🎯 initMap вызван, mapRef.current:', mapRef.current);
      
      // Ждем, пока ref будет готов
      if (!mapRef.current) {
        console.log('⏳ mapRef.current еще не готов, ждем...');
        // Даем время для рендеринга
        setTimeout(() => {
          console.log('🔄 Повторная попытка, mapRef.current:', mapRef.current);
          if (mapRef.current) {
            initMap();
          } else {
            console.log('❌ mapRef.current все еще отсутствует после ожидания');
            setError('Ошибка инициализации карты');
            setLoading(false);
          }
        }, 100);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🗺️ Инициализация карты для:', { location, cityName, eventTitle });

        // Таймаут для загрузки (30 секунд)
        const timeout = setTimeout(() => {
          console.error('⏰ Таймаут загрузки карты');
          setError('Таймаут загрузки карты');
          setLoading(false);
        }, 30000);

        // Загружаем Yandex Maps API
        if (!window.ymaps) {
          console.log('📡 Загружаем Yandex Maps API...');
          const script = document.createElement('script');
          // Используем API ключ из переменных окружения или без ключа для демо
          const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';
          const apiKeyParam = apiKey ? `&apikey=${apiKey}` : '';
          script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apiKeyParam}`;
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = () => {
              console.log('✅ Yandex Maps API загружен');
              resolve(true);
            };
            script.onerror = (err) => {
              console.error('❌ Ошибка загрузки Yandex Maps API:', err);
              reject(err);
            };
            document.head.appendChild(script);
          });
        } else {
          console.log('✅ Yandex Maps API уже загружен');
        }

        // Инициализируем карту
        window.ymaps.ready(() => {
          console.log('🎯 Yandex Maps готов, начинаем геокодирование...');
          
          // Геокодируем адрес
          const geocoder = window.ymaps.geocode(`${location}, ${cityName}`, {
            results: 1
          });

          geocoder.then((result: any) => {
            console.log('🔍 Результат геокодирования:', result);
            
            if (result.geoObjects.getLength() > 0) {
              const firstGeoObject = result.geoObjects.get(0);
              const coordinates = firstGeoObject.geometry.getCoordinates();
              console.log('📍 Найдены координаты:', coordinates);

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
              
              console.log('✅ Карта создана успешно');
              clearTimeout(timeout);
              setLoading(false);
            } else {
              console.log('⚠️ Точный адрес не найден, ищем по городу...');
              // Если точный адрес не найден, ищем по городу
              const cityGeocoder = window.ymaps.geocode(cityName, {
                results: 1
              });

              cityGeocoder.then((cityResult: any) => {
                console.log('🏙️ Результат геокодирования города:', cityResult);
                
                if (cityResult.geoObjects.getLength() > 0) {
                  const firstGeoObject = cityResult.geoObjects.get(0);
                  const coordinates = firstGeoObject.geometry.getCoordinates();
                  console.log('📍 Найдены координаты города:', coordinates);

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
                  
                  console.log('✅ Карта города создана успешно');
                  clearTimeout(timeout);
                  setLoading(false);
                } else {
                  console.error('❌ Не удалось найти город');
                  clearTimeout(timeout);
                  setError('Не удалось найти местоположение');
                  setLoading(false);
                }
              }).catch((err: any) => {
                console.error('❌ Ошибка геокодирования города:', err);
                clearTimeout(timeout);
                setError('Ошибка поиска местоположения');
                setLoading(false);
              });
            }
          }).catch((err: any) => {
            console.error('❌ Ошибка геокодирования:', err);
            clearTimeout(timeout);
            setError('Ошибка поиска адреса');
            setLoading(false);
          });
        });

      } catch (err) {
        console.error('❌ Ошибка инициализации карты:', err);
        setError('Ошибка загрузки карты');
        setLoading(false);
      }
    };

    initMap();

    // Cleanup функция
    return () => {
      clearTimeout(timeoutId);
      // Очищаем таймауты при размонтировании
    };
  }, [location, cityName, eventTitle]);

  console.log('🎨 EventMap рендерится, состояние:', { loading, error });

  if (loading) {
    console.log('⏳ Показываем загрузку');
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
    console.log('❌ Показываем ошибку:', error);
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

  console.log('🗺️ Показываем карту');
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
