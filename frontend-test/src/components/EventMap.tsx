import React from 'react';

interface EventMapProps {
  location: string;
  cityName: string;
  eventTitle: string;
}

const EventMap: React.FC<EventMapProps> = ({ location, cityName, eventTitle }) => {
  // Функция для геокодирования адреса
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

  // Создаем URL для OpenStreetMap с маркером
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates[1]-0.01},${coordinates[0]-0.01},${coordinates[1]+0.01},${coordinates[0]+0.01}&layer=mapnik&marker=${coordinates[0]},${coordinates[1]}`;

  return (
    <div style={{ height: 300, borderRadius: 8, overflow: 'hidden' }}>
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
    </div>
  );
};

export default EventMap;
