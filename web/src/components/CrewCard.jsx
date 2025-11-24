const CrewCard = ({ crewMember }) => {
  // Generate gradient colors based on member index or use a default
  const gradients = [
    'linear-gradient(to top, #dc2626, #000000)', // Red to black
    'linear-gradient(to top, #ea580c, #000000)', // Orange to black
    'linear-gradient(to top, #2563eb, #000000)', // Blue to black
    'linear-gradient(to top, #d1d5db, #000000)', // Light gray to black
    'linear-gradient(to top, #92400e, #000000)', // Brown to black
    'linear-gradient(to top, #dc2626, #000000)', // Red to black (repeat)
    'linear-gradient(to top, #f472b6, #000000)', // Pink to black
    'linear-gradient(to top, #d1d5db, #000000)', // Light gray to black
    'linear-gradient(to top, #d1d5db, #000000)', // Light gray to black
    'linear-gradient(to top, #d1d5db, #000000)', // Light gray to black
    'linear-gradient(to top, #d1d5db, #000000)', // Light gray to black
    'linear-gradient(to top, #d1d5db, #000000)', // Light gray to black
  ];
  
  const gradientIndex = (crewMember.id || 0) % gradients.length;
  const gradientStyle = gradients[gradientIndex];

  return (
    <div className="flex flex-col">
      {/* Text section - light gray/white background */}
      <div className="bg-gray-200 p-2 md:p-3 flex flex-col">
        <h3 className="text-black uppercase font-sans font-bold text-xs md:text-sm mb-1 leading-tight">
          {crewMember.full_name || 'CREW MEMBER'}
        </h3>
        <div className="text-black text-[10px] md:text-xs font-sans uppercase">
          {crewMember.location || 'LOCATION TBD'}
        </div>
      </div>
      
      {/* Image section - square with gradient background */}
      <div 
        className="w-full aspect-square relative overflow-hidden"
        style={{ background: gradientStyle }}
      >
        {crewMember.profile_image_url ? (
          <img
            src={crewMember.profile_image_url}
            alt={crewMember.full_name}
            className="w-full h-full object-cover"
            style={{ 
              imageRendering: 'pixelated',
              filter: 'grayscale(100%)',
              opacity: 0.9
            }}
            onError={(e) => {
              // Hide image if it fails to load, show gradient instead
              e.target.style.display = 'none';
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

export default CrewCard;
