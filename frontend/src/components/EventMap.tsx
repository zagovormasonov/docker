import React from 'react';

interface EventMapProps {
  location: string;
  cityName: string;
  eventTitle: string;
}

type YMapPoint = [number, number];

type YMapsApi = {
  ready: (callback: () => void) => void;
  Map: new (element: HTMLElement, options: { center: YMapPoint; zoom: number; controls?: string[] }) => {
    geoObjects: { add: (placemark: unknown) => void; removeAll: () => void };
    setCenter: (center: YMapPoint, zoom?: number) => void;
    destroy: () => void;
  };
  Placemark: new (
    coordinates: YMapPoint,
    properties?: { hintContent?: string; balloonContent?: string },
    options?: Record<string, unknown>
  ) => unknown;
  suggest: (request: string, options?: { results?: number; provider?: string }) => Promise<Array<{
    displayName: string;
    value: string;
  }>>;
  geocode: (query: string, options?: { results?: number }) => Promise<{
    geoObjects: {
      get: (index: number) => {
        geometry: { getCoordinates: () => YMapPoint };
      } | null;
    };
  }>;
};

declare global {
  interface Window {
    ymaps?: YMapsApi;
    __yandexMapsPromise?: Promise<YMapsApi>;
  }
}

const yandexMapsApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
const yandexMapsSuggestApiKey = import.meta.env.VITE_YANDEX_SUGGEST_API_KEY as string | undefined;
const yandexGeocoderApiKey = import.meta.env.VITE_YANDEX_GEOCODER_API_KEY as string | undefined;
const DEFAULT_CENTER: YMapPoint = [55.751574, 37.573856];

export const loadYandexMaps = () => {
  if (window.ymaps) {
    return Promise.resolve(window.ymaps);
  }

  if (window.__yandexMapsPromise) {
    return window.__yandexMapsPromise;
  }

  if (!yandexMapsApiKey) {
    return Promise.reject(new Error('VITE_YANDEX_MAPS_API_KEY is not set'));
  }

  window.__yandexMapsPromise = new Promise<YMapsApi>((resolve, reject) => {
    const script = document.createElement('script');
    const params = new URLSearchParams({
      apikey: yandexMapsApiKey,
      lang: 'ru_RU',
    });
    const suggestApiKey = yandexMapsSuggestApiKey || yandexMapsApiKey;

    if (suggestApiKey) {
      params.set('suggest_apikey', suggestApiKey);
    }

    script.src = `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
    script.async = true;
    script.onload = () => {
      if (!window.ymaps) {
        reject(new Error('Yandex Maps API did not initialize'));
        return;
      }

      window.ymaps.ready(() => resolve(window.ymaps!));
    };
    script.onerror = () => {
      window.__yandexMapsPromise = undefined;
      reject(new Error('Failed to load Yandex Maps API'));
    };
    document.head.appendChild(script);
  });

  return window.__yandexMapsPromise;
};

export const getYandexAddressSuggestions = async (query: string) => {
  const ymaps = await loadYandexMaps();
  return ymaps.suggest(query, { results: 5, provider: 'yandex#map' });
};

const geocodeByHttpApi = async (query: string): Promise<YMapPoint | null> => {
  const apiKey = yandexGeocoderApiKey || yandexMapsApiKey;
  if (!apiKey) {
    return null;
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    geocode: query,
    format: 'json',
    results: '1',
    lang: 'ru_RU',
  });
  const response = await fetch(`https://geocode-maps.yandex.ru/v1/?${params.toString()}`);

  if (!response.ok) {
    console.warn(`Yandex geocoder HTTP error: ${response.status}`);
    return null;
  }

  const data = await response.json();
  const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;

  if (typeof pos !== 'string') {
    return null;
  }

  const [longitude, latitude] = pos.split(' ').map(Number);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return [latitude, longitude];
};

const buildAddressQueries = (location: string, cityName: string) => {
  const normalizedLocation = location.trim();
  const normalizedCity = cityName.trim();
  const locationIncludesCity = Boolean(normalizedCity)
    && normalizedLocation.toLowerCase().includes(normalizedCity.toLowerCase());

  return [
    normalizedLocation,
    locationIncludesCity ? '' : [normalizedCity, normalizedLocation].filter(Boolean).join(', '),
    normalizedCity,
  ].filter((query, index, queries) => query && queries.indexOf(query) === index);
};

const EventMap: React.FC<EventMapProps> = ({ location, cityName, eventTitle }) => {
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<InstanceType<YMapsApi['Map']> | null>(null);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error' | 'missing-key'>('loading');

  React.useEffect(() => {
    let cancelled = false;
    const queries = buildAddressQueries(location, cityName);

    if (!queries.length) {
      setStatus('error');
      return;
    }

    const initMap = async () => {
      try {
        setStatus('loading');
        const ymaps = await loadYandexMaps();
        if (cancelled || !mapRef.current) return;

        let coordinates: YMapPoint | null = null;
        let foundQuery = queries[0];

        for (const query of queries) {
          coordinates = await geocodeByHttpApi(query);
          if (cancelled || !mapRef.current) return;

          if (coordinates) {
            foundQuery = query;
            break;
          }

          const geocodeResult = await ymaps.geocode(query, { results: 1 });
          if (cancelled || !mapRef.current) return;

          const firstResult = geocodeResult.geoObjects.get(0);
          if (!firstResult) continue;

          coordinates = firstResult.geometry.getCoordinates();
          foundQuery = query;
          break;
        }

        if (!coordinates) {
          setStatus('error');
          return;
        }

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new ymaps.Map(mapRef.current, {
            center: coordinates || DEFAULT_CENTER,
            zoom: 15,
            controls: ['zoomControl', 'fullscreenControl'],
          });
        } else {
          mapInstanceRef.current.setCenter(coordinates, 15);
          mapInstanceRef.current.geoObjects.removeAll();
        }

        const placemark = new ymaps.Placemark(
          coordinates,
          {
            hintContent: eventTitle,
            balloonContent: `${eventTitle}<br/>${foundQuery}`,
          },
          {
            preset: 'islands#violetDotIcon',
          }
        );

        mapInstanceRef.current.geoObjects.add(placemark);
        setStatus('ready');
      } catch (error) {
        console.error('Yandex map error:', error);
        setStatus(yandexMapsApiKey ? 'error' : 'missing-key');
      }
    };

    initMap();

    return () => {
      cancelled = true;
    };
  }, [location, cityName, eventTitle]);

  React.useEffect(() => {
    return () => {
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, []);

  const message = status === 'missing-key'
    ? 'Добавьте VITE_YANDEX_MAPS_API_KEY, чтобы показать Яндекс.Карту'
    : status === 'error'
      ? 'Не удалось найти адрес на карте'
      : 'Загрузка Яндекс.Карты...';

  return (
    <div style={{ position: 'relative', height: 300, borderRadius: 8, overflow: 'hidden', background: '#f5f5f5' }}>
      {status !== 'ready' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            color: '#666',
            textAlign: 'center',
            background: '#f5f5f5',
          }}
        >
          {message}
        </div>
      )}
      <div
        ref={mapRef}
        title={`Карта события: ${eventTitle}`}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default EventMap;
