import type { Project } from '../models/Project'
import type { IProjectRepository } from '../models/ports/IProjectRepository'

export class IndexedDbProjectRepository implements IProjectRepository {
  private readonly factory: IDBFactory
  private readonly databaseName: string
  private connection: Promise<IDBDatabase> | null = null

  constructor({
    factory = globalThis.indexedDB,
    databaseName = 'webtdd',
  }: { factory?: IDBFactory; databaseName?: string } = {}) {
    this.factory = factory
    this.databaseName = databaseName
  }

  async init(): Promise<void> {
    await this.open()
  }

  listProjects(): Promise<Project[]> {
    return this.request('readonly', store => store.getAll())
  }

  async getProject(id: string): Promise<Project | null> {
    const project = await this.request<Project | undefined>('readonly', store => store.get(id))
    return project ?? null
  }

  async saveProject(project: Project): Promise<void> {
    await this.request('readwrite', store => store.put(project))
  }

  async deleteProject(id: string): Promise<void> {
    await this.request('readwrite', store => store.delete(id))
  }

  close(): void {
    const connection = this.connection
    this.connection = null
    void connection?.then(database => database.close(), () => {})
  }

  private open(): Promise<IDBDatabase> {
    if (!this.connection) {
      const connection = new Promise<IDBDatabase>((resolve, reject) => {
        if (!this.factory) {
          throw new Error('IndexedDB no está disponible en este navegador')
        }

        const request = this.factory.open(this.databaseName, 1)
        request.onupgradeneeded = () => {
          request.result.createObjectStore('projects', { keyPath: 'id' })
        }
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const database = request.result
          database.onversionchange = () => {
            database.close()
            if (this.connection === connection) this.connection = null
          }
          resolve(database)
        }
      })

      this.connection = connection
      void connection.catch(() => {
        if (this.connection === connection) this.connection = null
      })
    }

    return this.connection
  }

  private async request<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const database = await this.open()

    return new Promise<T>((resolve, reject) => {
      const transaction = database.transaction('projects', mode)
      transaction.onabort = () => reject(
        transaction.error ?? new Error('La transacción de IndexedDB fue cancelada'),
      )
      const request = operation(transaction.objectStore('projects'))
      // Una solicitud exitosa todavía puede terminar en una transacción abortada.
      transaction.oncomplete = () => resolve(request.result)
    })
  }
}
