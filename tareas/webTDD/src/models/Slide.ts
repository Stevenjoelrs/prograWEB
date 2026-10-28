/**
 * Tipos de diapositiva contemplados por la aplicación.
 *
 * - `title`: portada de la presentación (siempre la primera).
 * - `content`: diapositiva de desarrollo.
 */
export type SlideType = 'title' | 'content'

/**
 * Formatos disponibles para las diapositivas de desarrollo.
 */
export type SlideLayout = 'text-only' | 'image-only' | 'text-and-image'

interface BaseSlide {
  id: string
  title: string
}

/**
 * Portada de la presentación.
 */
export interface TitleSlide extends BaseSlide {
  type: 'title'
  subtitle?: string
}

/**
 * Diapositiva de desarrollo. El layout determina qué campos usa la vista.
 */
export interface ContentSlide extends BaseSlide {
  type: 'content'
  layout: SlideLayout
  body?: string
  imageUrl?: string
  imageAlt?: string
}

/**
 * Unión discriminada por `type`: permite que el renderizador y los
 * controladores trabajen con el contrato correcto sin campos opcionales
 * ambiguos.
 */
export type Slide = TitleSlide | ContentSlide
