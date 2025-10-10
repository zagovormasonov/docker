import React from 'react';

interface ReliableEventMapProps {
  location: string;
  cityName: string;
  eventTitle: string;
}

const ReliableEventMap: React.FC<ReliableEventMapProps> = ({ location, cityName, eventTitle }) => {
  const [mapReady, setMapReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  console.log('🔧 ReliableEventMap рендерится с пропсами:', { location, cityName, eventTitle });

  React.useEffect(() => {
    console.log('🚀 ReliableEventMap useEffect запущен');
    
    // Проверяем, что контейнер готов
    const checkContainer = () => {
      if (mapContainerRef.current) {
        console.log('✅ Контейнер карты готов');
        setMapReady(true);
        initializeMap();
      } else {
        console.log('⏳ Контейнер карты еще не готов, ждем...');
        setTimeout(checkContainer, 100);
      }
    };

    const initializeMap = () => {
      console.log('🗺️ Инициализация карты...');
      
      try {
        // Проверяем, есть ли уже Yandex Maps
        if (window.ymaps) {
          console.log('✅ Yandex Maps уже загружен');
          createMap();
        } else {
          console.log('📡 Загружаем Yandex Maps API...');
          loadYandexMaps();
        }
      } catch (err) {
        console.error('❌ Ошибка инициализации:', err);
        setError('Ошибка инициализации карты');
      }
    };

    const loadYandexMaps = () => {
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';
      const apiKeyParam = apiKey ? `&apikey=${apiKey}` : '';
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apiKeyParam}`;
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Yandex Maps API загружен');
        createMap();
      };
      
      script.onerror = (err) => {
        console.error('❌ Ошибка загрузки Yandex Maps API:', err);
        setError('Ошибка загрузки карты');
      };
      
      document.head.appendChild(script);
    };

    const createMap = () => {
      if (!mapContainerRef.current) {
        console.log('❌ Контейнер карты отсутствует');
        setError('Контейнер карты не найден');
        return;
      }

      window.ymaps.ready(() => {
        console.log('🎯 Yandex Maps готов, создаем карту...');
        
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
            const map = new window.ymaps.Map(mapContainerRef.current, {
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
            placemark.balloon.open();
            
            console.log('✅ Карта создана успешно');
          } else {
            console.log('⚠️ Точный адрес не найден, ищем по городу...');
            // Fallback на город
            const cityGeocoder = window.ymaps.geocode(cityName, {
              results: 1
            });

            cityGeocoder.then((cityResult: any) => {
              if (cityResult.geoObjects.getLength() > 0) {
                const firstGeoObject = cityResult.geoObjects.get(0);
                const coordinates = firstGeoObject.geometry.getCoordinates();

                const map = new window.ymaps.Map(mapContainerRef.current, {
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
              } else {
                console.log('❌ Не удалось найти город');
                setError('Не удалось найти местоположение');
              }
            }).catch((err: any) => {
              console.error('❌ Ошибка геокодирования города:', err);
              setError('Ошибка поиска местоположения');
            });
          }
        }).catch((err: any) => {
          console.error('❌ Ошибка геокодирования:', err);
          setError('Ошибка поиска адреса');
        });
      });
    };

    // Запускаем проверку контейнера
    checkContainer();
  }, [location, cityName, eventTitle]);

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

  if (!mapReady) {
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

  console.log('🗺️ Показываем карту');
  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        height: 300, 
        borderRadius: 8, 
        overflow: 'hidden',
        border: '1px solid #d9d9d9'
      }} 
    />
  );
};

export default ReliableEventMap;
