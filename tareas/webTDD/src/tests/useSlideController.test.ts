import { act, renderHook } from '@testing-library/react'
import { useSlideController } from '../controllers/useSlideController'
import type { Project } from '../models/Project'
import { buildContentSlide, buildProject } from './factories/projectFactory'

describe('useSlideController', () => {
  it('selecciona la portada y permite seleccionar una diapositiva existente', () => {
    const content = buildContentSlide()
    const project = buildProject()
    project.slides.push(content)
    const { result } = renderHook(() => useSlideController(project, jest.fn()))
    expect(result.current.activeSlide).toEqual(project.slides[0])
    act(() => result.current.selectSlide(content.id))
    expect(result.current.activeIndex).toBe(1)
    expect(result.current.activeSlide).toEqual(content)
  })

  it.each(['text-only', 'image-only', 'text-and-image'] as const)(
    'agrega y persiste una diapositiva de desarrollo con layout %s', async layout => {
      const project = buildProject()
      const save = jest.fn(async (updated: Project) => updated)
      const { result, rerender } = renderHook(({ project }) => useSlideController(project, save), {
        initialProps: { project },
      })
      await act(async () => { await result.current.addSlide(layout) })
      const updated = save.mock.calls[0][0]
      expect(updated.slides[0]).toEqual(project.slides[0])
      expect(updated.slides[1]).toMatchObject({ type: 'content', layout })
      expect(updated.slides[1].id).not.toBe(project.slides[0].id)
      rerender({ project: updated })
      expect(result.current.activeIndex).toBe(1)
    },
  )

  it('actualiza el contenido sin alterar el orden ni otras diapositivas', async () => {
    const project = buildProject()
    const slide = buildContentSlide()
    project.slides.push(slide)
    const save = jest.fn(async (updated: Project) => updated)
    const { result } = renderHook(() => useSlideController(project, save))
    await act(async () => {
      await result.current.updateSlide({ ...slide, body: 'Texto editado', layout: 'text-and-image', imageUrl: 'https://example.com/photo.png' })
    })
    expect(save.mock.calls[0][0].slides).toEqual([project.slides[0], {
      ...slide, body: 'Texto editado', layout: 'text-and-image', imageUrl: 'https://example.com/photo.png',
    }])
  })

  it('elimina una diapositiva de desarrollo y vuelve a la anterior', async () => {
    const project = buildProject()
    const slide = buildContentSlide()
    project.slides.push(slide)
    const save = jest.fn(async (updated: Project) => updated)
    const { result, rerender } = renderHook(({ project }) => useSlideController(project, save), { initialProps: { project } })
    act(() => result.current.selectSlide(slide.id))
    await act(async () => { await result.current.deleteSlide(slide.id) })
    const updated = save.mock.calls[0][0]
    rerender({ project: updated })
    expect(result.current.activeIndex).toBe(0)
    expect(updated.slides).toEqual([project.slides[0]])
  })

  it('protege la portada frente a eliminación y cambios de tipo', async () => {
    const project = buildProject()
    const save = jest.fn()
    const { result } = renderHook(() => useSlideController(project, save))
    await expect(result.current.deleteSlide(project.slides[0].id)).rejects.toThrow('La portada no se puede eliminar')
    await expect(result.current.updateSlide(buildContentSlide({ id: project.slides[0].id }))).rejects.toThrow('No se puede cambiar el tipo de diapositiva')
    expect(save).not.toHaveBeenCalled()
  })

  it.each(['javascript:alert(1)', 'file:///private/photo.png', 'no es una URL'])(
    'rechaza una URL de imagen no admitida: %s', async imageUrl => {
      const project = buildProject()
      const slide = buildContentSlide()
      project.slides.push(slide)
      const save = jest.fn()
      const { result } = renderHook(() => useSlideController(project, save))
      await expect(result.current.updateSlide({ ...slide, imageUrl })).rejects.toThrow('Usa una URL de imagen http o https')
      expect(save).not.toHaveBeenCalled()
    },
  )

  it('conserva la selección y los datos si falla el almacenamiento', async () => {
    const project = buildProject()
    const save = jest.fn().mockRejectedValue(new Error('Sin espacio'))
    const { result } = renderHook(() => useSlideController(project, save))
    await act(async () => {
      await expect(result.current.addSlide()).rejects.toThrow('Sin espacio')
    })
    expect(result.current.activeSlide).toEqual(project.slides[0])
    expect(project.slides).toHaveLength(1)
  })
})
