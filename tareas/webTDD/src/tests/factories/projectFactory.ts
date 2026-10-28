import type { Project } from '../../models/Project'
import type { ContentSlide, TitleSlide } from '../../models/Slide'

let sequence = 0

export function buildTitleSlide(
  overrides: Partial<TitleSlide> = {},
): TitleSlide {
  sequence += 1

  return {
    id: `title-slide-${sequence}`,
    type: 'title',
    title: 'Portada de prueba',
    subtitle: 'Subtítulo de prueba',
    ...overrides,
  }
}

export function buildContentSlide(
  overrides: Partial<ContentSlide> = {},
): ContentSlide {
  sequence += 1

  return {
    id: `content-slide-${sequence}`,
    type: 'content',
    layout: 'text-only',
    title: 'Diapositiva de desarrollo',
    body: 'Contenido de prueba',
    ...overrides,
  }
}

export function buildProject(overrides: Partial<Project> = {}): Project {
  sequence += 1

  return {
    id: `project-${sequence}`,
    name: 'Proyecto de prueba',
    author: 'Ada Lovelace',
    topic: 'Computación',
    date: '2026-01-01',
    slides: [buildTitleSlide()],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}
