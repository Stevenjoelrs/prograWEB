import type { Project } from '../../models/Project'
import type { IProjectRepository } from '../../models/ports/IProjectRepository'

function snapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Repositorio en memoria para probar los controladores sin acoplarlos a
 * IndexedDB. Implementa el mismo puerto que la infraestructura real.
 */
export class InMemoryProjectRepository implements IProjectRepository {
  private readonly projects = new Map<string, Project>()

  readonly savedProjects: Project[] = []
  readonly deletedIds: string[] = []
  initCalls = 0
  listError: Error | null = null
  saveError: Error | null = null

  seed(...projects: Project[]): void {
    for (const project of projects) {
      this.projects.set(project.id, snapshot(project))
    }
  }

  async init(): Promise<void> {
    this.initCalls += 1
  }

  async listProjects(): Promise<Project[]> {
    if (this.listError) {
      throw this.listError
    }

    return [...this.projects.values()].map((project) => snapshot(project))
  }

  async getProject(id: string): Promise<Project | null> {
    const project = this.projects.get(id)
    return project ? snapshot(project) : null
  }

  async saveProject(project: Project): Promise<void> {
    if (this.saveError) {
      throw this.saveError
    }

    const saved = snapshot(project)
    this.projects.set(project.id, saved)
    this.savedProjects.push(saved)
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id)
    this.deletedIds.push(id)
  }
}
