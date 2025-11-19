import { Link } from 'react-router-dom';
import { getLaunchSlug } from '../utils/slug';

const LaunchCard = ({ launch }) => {
  const getStatusColor = (outcome) => {
    switch (outcome?.toLowerCase()) {
      case 'success':
        return 'border-green-500';
      case 'failure':
        return 'border-red-500';
      case 'partial':
        return 'border-yellow-500';
      default:
        return 'border-gray-600';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <Link
      to={`/launches/${getLaunchSlug(launch)}`}
      className={`block border-l-4 ${getStatusColor(launch.outcome)} bg-gray-900 hover:bg-gray-800 transition-colors p-4`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-gray-400">{launch.provider || launch.provider_id || 'Unknown Provider'}</div>
        <div className="text-sm font-semibold">{launch.outcome || 'TBD'}</div>
      </div>
      <h3 className="text-xl font-bold mb-2">{launch.name}</h3>
      <div className="text-sm text-gray-400 mb-1">
        {launch.site || launch.launch_site?.name || 'Location TBD'}
      </div>
      <div className="text-sm text-gray-500">
        {formatDate(launch.launch_date)}
      </div>
    </Link>
  );
};

export default LaunchCard;
