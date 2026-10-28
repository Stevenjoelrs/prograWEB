import type { Slide } from './Slide'

/**
 * Agregado raíz de la aplicación: una presentación y todas sus diapositivas.
 *
 * El orden de `slides` es el orden de presentación. La primera diapositiva
 * debe ser de tipo `title` y las demás de tipo `content`.
 */
export interface Project {
  id: string
  name: string
  author: string
  topic: string
  /** Fecha de la presentación en formato ISO 8601 (`YYYY-MM-DD`). */
  date: string
  slides: Slide[]
  /** Fecha de creación en formato ISO 8601. */
  createdAt: string
  /** Fecha de la última modificación en formato ISO 8601. */
  updatedAt: string
}
