import { Link } from 'react-router-dom';

const AstronautCard = ({ astronaut, featured = false }) => {
  return (
    <Link
      to={`/spacebase/astronauts/${astronaut.id}`}
      className={`block bg-gray-900 hover:bg-gray-800 transition-colors ${featured ? 'p-6' : 'p-4'}`}
    >
      <div className={`${featured ? 'mb-4' : 'mb-3'} relative`}>
        <img
          src={astronaut.profile_image_url || 'https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Astronaut'}
          alt={astronaut.full_name}
          className={`w-full ${featured ? 'h-64' : 'h-48'} object-cover`}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Astronaut';
          }}
        />
      </div>
      <h3 className={`${featured ? 'text-xl' : 'text-lg'} font-bold mb-2`}>
        {astronaut.full_name || `${astronaut.first_name} ${astronaut.last_name}`}
      </h3>
      {!featured && (
        <div className="space-y-1 text-sm text-gray-400">
          {astronaut.days_in_space && (
            <div>Days In Space: {astronaut.days_in_space}</div>
          )}
          {astronaut.missions_count && (
            <div>Missions: {astronaut.missions_count}</div>
          )}
          {astronaut.spacewalks_count && (
            <div>Spacewalk: {astronaut.spacewalks_count}</div>
          )}
        </div>
      )}
    </Link>
  );
};

export default AstronautCard;
