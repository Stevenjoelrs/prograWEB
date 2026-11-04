import { useState } from 'react'
import type { Project } from '../models/Project'
import type { ContentSlide, Slide, SlideLayout } from '../models/Slide'

export function useSlideController(
  project: Project,
  saveProject: (project: Project) => Promise<Project>,
) {
  const [selectedId, selectSlide] = useState<string | null>(null)
  const activeIndex = Math.max(0, project.slides.findIndex(slide => slide.id === selectedId))
  const activeSlide = project.slides[activeIndex]

  async function addSlide(layout: SlideLayout = 'text-only'): Promise<void> {
    const slide: ContentSlide = {
      id: crypto.randomUUID(), type: 'content', layout,
      title: 'Nueva diapositiva', body: '',
    }
    await saveProject({ ...project, slides: [...project.slides, slide] })
    selectSlide(slide.id)
  }

  async function updateSlide(slide: Slide): Promise<void> {
    const existing = project.slides.find(item => item.id === slide.id)
    if (!existing) throw new Error('La diapositiva no existe')
    if (existing.type !== slide.type) throw new Error('No se puede cambiar el tipo de diapositiva')
    if (slide.type === 'content') {
      if (!['text-only', 'image-only', 'text-and-image'].includes(slide.layout)) {
        throw new Error('El formato de diapositiva no es válido')
      }
      if (slide.imageUrl?.trim()) {
        let protocol: string
        try { protocol = new URL(slide.imageUrl).protocol } catch {
          throw new Error('Usa una URL de imagen http o https')
        }
        if (protocol !== 'http:' && protocol !== 'https:') {
          throw new Error('Usa una URL de imagen http o https')
        }
      }
    }
    await saveProject({
      ...project,
      slides: project.slides.map(item => item.id === slide.id ? slide : item),
    })
  }

  async function deleteSlide(id: string): Promise<void> {
    const index = project.slides.findIndex(slide => slide.id === id)
    if (index < 0) throw new Error('La diapositiva no existe')
    if (project.slides[index].type === 'title') throw new Error('La portada no se puede eliminar')
    await saveProject({ ...project, slides: project.slides.filter(slide => slide.id !== id) })
    if (activeSlide.id === id) selectSlide(project.slides[index - 1].id)
  }

  return { activeSlide, activeIndex, selectSlide, addSlide, updateSlide, deleteSlide }
}
