import { act, renderHook, waitFor } from '@testing-library/react'
import { useProjectController } from '../controllers/useProjectController'
import type { Project } from '../models/Project'
import { buildProject } from './factories/projectFactory'
import { InMemoryProjectRepository } from './fakes/InMemoryProjectRepository'

describe('useProjectController', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('carga los proyectos al iniciar', async () => {
    const repository = new InMemoryProjectRepository()
    const project = buildProject()
    repository.seed(project)

    const { result } = renderHook(() => useProjectController(repository))

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.projects).toEqual([project])
    expect(result.current.error).toBeNull()
    expect(repository.initCalls).toBe(1)
  })

  it('ordena los proyectos por fecha de actualización descendente', async () => {
    const repository = new InMemoryProjectRepository()
    const older = buildProject({
      id: 'older',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    const newer = buildProject({
      id: 'newer',
      updatedAt: '2026-02-01T00:00:00.000Z',
    })
    repository.seed(older, newer)

    const { result } = renderHook(() => useProjectController(repository))
    await waitFor(() => expect(result.current.projects).toHaveLength(2))

    expect(result.current.projects.map((project) => project.id)).toEqual([
      'newer',
      'older',
    ])
  })

  it('crea un proyecto con portada, timestamps y lo persiste', async () => {
    const repository = new InMemoryProjectRepository()
    const { result } = renderHook(() => useProjectController(repository))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-01T10:00:00.000Z'))

    let created!: Project
    await act(async () => {
      created = await result.current.createProject({
        name: '  Nueva presentación  ',
        author: '  Grace Hopper  ',
        topic: '  Compiladores  ',
      })
    })

    expect(created).toMatchObject({
      name: 'Nueva presentación',
      author: 'Grace Hopper',
      topic: 'Compiladores',
      date: '2026-03-01',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    })
    expect(created.id).toEqual(expect.any(String))
    expect(created.slides).toHaveLength(1)
    expect(created.slides[0]).toMatchObject({
      type: 'title',
      title: 'Nueva presentación',
      subtitle: 'Compiladores',
    })
    expect(created.slides[0].id).toEqual(expect.any(String))
    expect(repository.savedProjects).toEqual([created])
    expect(result.current.projects[0]).toEqual(created)
    expect(result.current.activeProject).toEqual(created)
  })

  it('rechaza la creación de un proyecto sin nombre', async () => {
    const repository = new InMemoryProjectRepository()
    const { result } = renderHook(() => useProjectController(repository))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await expect(
        result.current.createProject({ name: '   ', author: '', topic: '' }),
      ).rejects.toThrow('El nombre del proyecto es obligatorio')
    })

    expect(result.current.error).toBe('El nombre del proyecto es obligatorio')
    expect(repository.savedProjects).toHaveLength(0)
  })

  it('actualiza un proyecto y lo mueve al inicio del listado', async () => {
    const repository = new InMemoryProjectRepository()
    const older = buildProject({
      id: 'older',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    const newer = buildProject({
      id: 'newer',
      updatedAt: '2026-02-01T00:00:00.000Z',
    })
    repository.seed(older, newer)

    const { result } = renderHook(() => useProjectController(repository))
    await waitFor(() => expect(result.current.projects).toHaveLength(2))
    act(() => result.current.selectProject('older'))

    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-04-01T09:30:00.000Z'))

    await act(async () => {
      await result.current.updateProject({
        ...older,
        name: 'Proyecto renombrado',
      })
    })

    const saved = repository.savedProjects.at(-1)
    expect(saved).toMatchObject({
      id: 'older',
      name: 'Proyecto renombrado',
      updatedAt: '2026-04-01T09:30:00.000Z',
    })
    expect(result.current.projects.map((project) => project.id)).toEqual([
      'older',
      'newer',
    ])
    expect(result.current.activeProject?.name).toBe('Proyecto renombrado')
  })

  it('elimina un proyecto y limpia el proyecto activo', async () => {
    const repository = new InMemoryProjectRepository()
    const keep = buildProject({ id: 'keep' })
    const remove = buildProject({ id: 'remove' })
    repository.seed(keep, remove)

    const { result } = renderHook(() => useProjectController(repository))
    await waitFor(() => expect(result.current.projects).toHaveLength(2))
    act(() => result.current.selectProject('remove'))

    await act(async () => {
      await result.current.deleteProject('remove')
    })

    expect(repository.deletedIds).toEqual(['remove'])
    expect(result.current.projects.map((project) => project.id)).toEqual([
      'keep',
    ])
    expect(result.current.activeProject).toBeNull()
  })

  it('selecciona y limpia el proyecto activo', async () => {
    const repository = new InMemoryProjectRepository()
    const project = buildProject()
    repository.seed(project)

    const { result } = renderHook(() => useProjectController(repository))
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    act(() => result.current.selectProject(project.id))
    expect(result.current.activeProject).toEqual(project)

    act(() => result.current.selectProject(null))
    expect(result.current.activeProject).toBeNull()
  })

  it('expone un error si falla la carga de proyectos', async () => {
    const repository = new InMemoryProjectRepository()
    repository.listError = new Error('No se pudo leer IndexedDB')

    const { result } = renderHook(() => useProjectController(repository))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.projects).toEqual([])
    expect(result.current.error).toBe('No se pudo leer IndexedDB')
  })
})
