export const API_URL = "https://inai-col1.fishrungames.com";

export function getImageUrl(imageUrl: string): string {
  return imageUrl.startsWith("http://") || imageUrl.startsWith("https://")
    ? imageUrl
    : `${API_URL}${imageUrl}`;
}

export function formatPrice(price: number | string): string {
  const numericPrice = Number(price);
  return Number.isNaN(numericPrice) ? `${price} KGS` : `${numericPrice.toLocaleString("ru-RU")} KGS`;
}
