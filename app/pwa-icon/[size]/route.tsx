/**
 * Iconos PNG del manifest, servidos en /pwa-icon/192 y /pwa-icon/512.
 *
 * Van como Route Handler y no con la convención `icon.tsx` porque el
 * manifest necesita URLs fijas, y las que genera esa convención llevan un
 * hash que cambia en cada build.
 *
 * `generateStaticParams` los deja prerenderizados: en producción son dos
 * archivos estáticos, no se dibujan en cada request.
 */
import { notFound } from "next/navigation";
import { renderIconImage } from "../../lib/og";

/** Los tamaños que pide una PWA instalable. Nada más se sirve. */
const ALLOWED_SIZES = ["192", "512"] as const;

export function generateStaticParams() {
  return ALLOWED_SIZES.map((size) => ({ size }));
}

/** Cualquier otro tamaño da 404 en vez de generar una imagen a pedido. */
export const dynamicParams = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;

  if (!ALLOWED_SIZES.includes(size as (typeof ALLOWED_SIZES)[number])) {
    notFound();
  }

  return renderIconImage(Number(size));
}
