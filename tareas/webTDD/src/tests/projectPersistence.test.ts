import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { IDBFactory } from 'fake-indexeddb'
import { useProjectController } from '../controllers/useProjectController'
import { IndexedDbProjectRepository } from '../infrastructure/IndexedDbProjectRepository'
import type { Project } from '../models/Project'
import { buildContentSlide } from './factories/projectFactory'

describe('persistencia del controlador con IndexedDB', () => {
  const repositories: IndexedDbProjectRepository[] = []

  afterEach(() => {
    repositories.splice(0).forEach(repository => repository.close())
  })

  it('crea, actualiza, recupera al reabrir y elimina un proyecto en StrictMode', async () => {
    const factory = new IDBFactory()
    const repository = new IndexedDbProjectRepository({ factory })
    repositories.push(repository)
    const first = renderHook(() => useProjectController(repository), { wrapper: StrictMode })
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))

    let project!: Project
    await act(async () => {
      project = await first.result.current.createProject({
        name: 'Presentación persistente',
        author: 'Ada Lovelace',
        topic: 'Computación',
      })
    })
    await act(async () => {
      await first.result.current.updateProject({
        ...project,
        name: 'Presentación editada',
        slides: [...project.slides, buildContentSlide()],
      })
    })
    const saved = first.result.current.activeProject
    expect(saved?.slides).toHaveLength(2)
    expect(first.result.current.error).toBeNull()
    first.unmount()
    repository.close()

    const reopened = new IndexedDbProjectRepository({ factory })
    repositories.push(reopened)
    const second = renderHook(() => useProjectController(reopened), { wrapper: StrictMode })
    await waitFor(() => expect(second.result.current.isLoading).toBe(false))

    expect(second.result.current.projects).toEqual([saved])
    act(() => second.result.current.selectProject(project.id))
    expect(second.result.current.activeProject).toEqual(saved)

    await act(async () => { await second.result.current.deleteProject(project.id) })

    expect(second.result.current.projects).toEqual([])
    expect(second.result.current.activeProject).toBeNull()
    await expect(reopened.getProject(project.id)).resolves.toBeNull()
  })
})
