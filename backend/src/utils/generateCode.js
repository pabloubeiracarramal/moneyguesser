/**
 * Generates a random 6-character alphanumeric room code
 * @returns {string} 6-character room code
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates a unique token for authentication
 * @returns {string} Random token
 */
export function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Generates a random hex color for player avatars
 * @returns {string} Hex color code
 */
export function generateAvatarColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#FF8FA3', '#74C0FC', '#FFD93D', '#A8DADC', '#F1C40F'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
