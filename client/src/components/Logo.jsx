import { imageUrl } from '../api/client.js';
import { useClub } from '../context/ClubContext.jsx';

/** Club crest: uses uploaded logo if set, otherwise the bundled SVG. */
export default function Logo({ size = 44, className = '' }) {
  const { club } = useClub();
  const src = club?.logo ? imageUrl(club.logo) : '/logo.svg';
  return (
    <img
      src={src}
      alt={`${club?.name || 'NK Goričanka'} grb`}
      width={size}
      height={size}
      className={className}
      style={{ height: size, width: 'auto', objectFit: 'contain' }}
    />
  );
}
