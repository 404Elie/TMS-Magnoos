// Helper function to format destinations for display
export function formatDestinations(request: { destination: string; destinations?: string[] | null }): string {
  // If destinations array exists and has items, use it
  if (request.destinations && Array.isArray(request.destinations) && request.destinations.length > 0) {
    return request.destinations.join(' → ');
  }
  
  // Fallback to single destination field for backward compatibility
  return request.destination;
}

// Helper function to format route with origin and destinations
export function formatRoute(request: { origin: string; destination: string; destinations?: string[] | null }): string {
  const destinations = formatDestinations(request);
  return `${request.origin} → ${destinations}`;
}
