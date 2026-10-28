import { useEffect, useState } from 'react'
import type { Project } from '../models/Project'
import type { IProjectRepository } from '../models/ports/IProjectRepository'

function byUpdatedAt(left: Project, right: Project): number {
  return right.updatedAt.localeCompare(left.updatedAt)
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'No se pudo completar la operación'
}

export function useProjectController(repository: IProjectRepository) {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, selectProject] = useState<string | null>(null)
  const [loadedRepository, setLoadedRepository] = useState<IProjectRepository | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadProjects() {
      try {
        await repository.init()
        const loaded = await repository.listProjects()
        if (active) {
          setProjects(loaded.toSorted(byUpdatedAt))
          selectProject(null)
          setError(null)
        }
      } catch (reason) {
        if (active) {
          setProjects([])
          selectProject(null)
          setError(errorMessage(reason))
        }
      } finally {
        if (active) setLoadedRepository(repository)
      }
    }

    void loadProjects()
    return () => { active = false }
  }, [repository])

  async function updateProject(project: Project): Promise<Project> {
    setError(null)

    try {
      const name = project.name.trim()
      if (!name) throw new Error('El nombre del proyecto es obligatorio')

      const saved: Project = {
        ...project,
        name,
        author: project.author.trim(),
        topic: project.topic.trim(),
        updatedAt: new Date().toISOString(),
      }
      await repository.saveProject(saved)
      setProjects(current => [
        ...current.filter(item => item.id !== saved.id), saved,
      ].toSorted(byUpdatedAt))
      return saved
    } catch (reason) {
      setError(errorMessage(reason))
      throw reason
    }
  }

  async function createProject(
    input: Pick<Project, 'name' | 'author' | 'topic'>,
  ): Promise<Project> {
    const now = new Date().toISOString()
    const project = await updateProject({
      ...input,
      id: crypto.randomUUID(),
      date: now.slice(0, 10),
      createdAt: now,
      updatedAt: now,
      slides: [{
        id: crypto.randomUUID(),
        type: 'title',
        title: input.name.trim(),
        subtitle: input.topic.trim(),
      }],
    })
    selectProject(project.id)
    return project
  }

  async function deleteProject(id: string): Promise<void> {
    setError(null)

    try {
      await repository.deleteProject(id)
      setProjects(current => current.filter(project => project.id !== id))
      selectProject(current => current === id ? null : current)
    } catch (reason) {
      setError(errorMessage(reason))
      throw reason
    }
  }

  const isLoading = loadedRepository !== repository
  const visibleProjects = isLoading ? [] : projects

  return {
    projects: visibleProjects,
    activeProject: visibleProjects.find(project => project.id === activeProjectId) ?? null,
    isLoading,
    error: isLoading ? null : error,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
  }
}
