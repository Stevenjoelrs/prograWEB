import type { Project } from '../Project'

/**
 * Puerto de persistencia para proyectos.
 *
 * Los controladores dependen de esta interfaz, nunca de IndexedDB ni de HTTP.
 * Así se puede sustituir `IndexedDbProjectRepository` por
 * `HttpMicroserviceRepository` sin cambiar la lógica de negocio ni la vista.
 */
export interface IProjectRepository {
  /** Abre la conexión y prepara el almacenamiento. Debe ser idempotente. */
  init(): Promise<void>

  /** Devuelve todos los proyectos guardados. */
  listProjects(): Promise<Project[]>

  /** Devuelve un proyecto por id o `null` si no existe. */
  getProject(id: string): Promise<Project | null>

  /** Crea o actualiza un proyecto completo (upsert). */
  saveProject(project: Project): Promise<void>

  /** Elimina un proyecto por id. No falla si el proyecto no existe. */
  deleteProject(id: string): Promise<void>
}
