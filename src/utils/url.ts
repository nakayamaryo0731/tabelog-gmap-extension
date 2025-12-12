/**
 * Google Maps検索URLを生成する
 */
export function generateGoogleMapsSearchUrl(
  name: string,
  address: string
): string {
  const query = address ? `${name} ${address}` : name;
  const encodedQuery = encodeURIComponent(query);
  return `https://www.google.com/maps/search/${encodedQuery}`;
}

/**
 * Google MapsのPlace IDを使ったURLを生成する
 */
export function generateGoogleMapsPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}
