const CrewCard = ({ crewMember }) => {
  return (
    <div className="bg-gray-900 hover:bg-gray-800 transition-colors p-4">
      <div className="mb-3 relative">
        <img
          src={crewMember.profile_image_url || 'https://via.placeholder.com/200x200/1a1a1a/ffffff?text=Crew'}
          alt={crewMember.full_name}
          className="w-full h-48 object-cover"
          style={{ imageRendering: 'pixelated' }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/200x200/1a1a1a/ffffff?text=Crew';
          }}
        />
      </div>
      <h3 className="text-lg font-bold mb-1">{crewMember.full_name}</h3>
      <div className="text-sm text-gray-400">{crewMember.location || 'Location TBD'}</div>
      {crewMember.category && (
        <div className="text-xs text-gray-500 mt-1">{crewMember.category}</div>
      )}
    </div>
  );
};

export default CrewCard;
