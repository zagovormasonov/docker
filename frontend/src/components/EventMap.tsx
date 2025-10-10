import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Исправляем иконки для Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface EventMapProps {
  location: string;
  cityName: string;
  eventTitle: string;
}

const EventMap: React.FC<EventMapProps> = ({ location, cityName, eventTitle }) => {
  // Функция для геокодирования адреса (упрощенная версия)
  const geocodeAddress = async (address: string, city: string): Promise<[number, number] | null> => {
    try {
      // Используем Nominatim API (бесплатный сервис OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${address}, ${city}`)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      
      // Если точный адрес не найден, ищем по городу
      const cityResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
      );
      const cityData = await cityResponse.json();
      
      if (cityData && cityData.length > 0) {
        return [parseFloat(cityData[0].lat), parseFloat(cityData[0].lon)];
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка геокодирования:', error);
      return null;
    }
  };

  const [coordinates, setCoordinates] = React.useState<[number, number] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true);
      const coords = await geocodeAddress(location, cityName);
      setCoordinates(coords);
      setLoading(false);
    };

    fetchCoordinates();
  }, [location, cityName]);

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

  if (!coordinates) {
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
        <div>Не удалось найти местоположение на карте</div>
      </div>
    );
  }

  return (
    <div style={{ height: 300, borderRadius: 8, overflow: 'hidden' }}>
      <MapContainer
        center={coordinates}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coordinates}>
          <Popup>
            <div>
              <strong>{eventTitle}</strong>
              <br />
              {location}
              <br />
              <small>{cityName}</small>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default EventMap;
