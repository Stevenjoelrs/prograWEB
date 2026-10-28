import { IDBFactory } from 'fake-indexeddb'
import { IndexedDbProjectRepository } from '../infrastructure/IndexedDbProjectRepository'
import { buildProject } from './factories/projectFactory'

describe('IndexedDbProjectRepository', () => {
  let factory: IDBFactory
  let databaseName: string
  let repository: IndexedDbProjectRepository
  let databaseSequence = 0

  beforeEach(() => {
    databaseSequence += 1
    factory = new IDBFactory()
    databaseName = `webtdd-test-${databaseSequence}`
    repository = new IndexedDbProjectRepository({
      factory,
      databaseName,
    })
  })

  afterEach(() => {
    repository?.close()
  })

  it('inicializa la base de datos y es idempotente', async () => {
    await expect(repository.init()).resolves.toBeUndefined()
    await expect(repository.init()).resolves.toBeUndefined()
  })

  it('guarda y recupera un proyecto', async () => {
    const project = buildProject()

    await repository.init()
    await repository.saveProject(project)

    await expect(repository.getProject(project.id)).resolves.toEqual(project)
  })

  it('devuelve null cuando el proyecto no existe', async () => {
    await repository.init()

    await expect(repository.getProject('inexistente')).resolves.toBeNull()
  })

  it('lista todos los proyectos guardados', async () => {
    const first = buildProject({ name: 'Primero' })
    const second = buildProject({ name: 'Segundo' })

    await repository.init()
    await repository.saveProject(first)
    await repository.saveProject(second)

    const projects = await repository.listProjects()

    expect(projects).toHaveLength(2)
    expect(projects).toEqual(expect.arrayContaining([first, second]))
  })

  it('actualiza un proyecto existente al volver a guardarlo', async () => {
    const project = buildProject()
    const updated: typeof project = {
      ...project,
      name: 'Proyecto actualizado',
      updatedAt: '2026-02-01T00:00:00.000Z',
    }

    await repository.init()
    await repository.saveProject(project)
    await repository.saveProject(updated)

    await expect(repository.getProject(project.id)).resolves.toEqual(updated)
    await expect(repository.listProjects()).resolves.toHaveLength(1)
  })

  it('elimina un proyecto y no falla si no existe', async () => {
    const project = buildProject()

    await repository.init()
    await repository.saveProject(project)
    await repository.deleteProject(project.id)

    await expect(repository.getProject(project.id)).resolves.toBeNull()
    await expect(
      repository.deleteProject('inexistente'),
    ).resolves.toBeUndefined()
  })

  it('persiste los datos entre instancias del repositorio', async () => {
    const project = buildProject()
    const firstRepository = new IndexedDbProjectRepository({
      factory,
      databaseName,
    })

    await firstRepository.init()
    await firstRepository.saveProject(project)
    firstRepository.close()

    const secondRepository = new IndexedDbProjectRepository({
      factory,
      databaseName,
    })

    await secondRepository.init()
    await expect(secondRepository.getProject(project.id)).resolves.toEqual(
      project,
    )
    secondRepository.close()
  })

  it('abre la base automáticamente al guardar sin init explícito', async () => {
    const project = buildProject()

    await repository.saveProject(project)

    await expect(repository.getProject(project.id)).resolves.toEqual(project)
  })
})
