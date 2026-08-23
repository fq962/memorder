/**
 * Icono de iOS (el que queda en la pantalla de inicio al "Agregar a inicio").
 * 180x180 es el tamaño que pide Apple para pantallas @3x.
 */
import { renderIconImage } from "./lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return renderIconImage(180);
}
