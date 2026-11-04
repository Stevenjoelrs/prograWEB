import { useEffect, useState } from 'react'
import { useProjectController } from '../controllers/useProjectController'
import { IndexedDbProjectRepository } from '../infrastructure/IndexedDbProjectRepository'
import type { Project } from '../models/Project'
import type { IProjectRepository } from '../models/ports/IProjectRepository'
import Button from './components/Button'
import EditorView from './containers/EditorView'
import PresentationView from './containers/PresentationView'

const defaultRepository = new IndexedDbProjectRepository()

export default function App({ repository = defaultRepository }: { repository?: IProjectRepository }) {
  const controller = useProjectController(repository)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPresentation, setIsPresentation] = useState(false)
  const [presentationNotice, setPresentationNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!dirty) return
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  useEffect(() => {
    function fullscreenChanged() {
      if (!document.fullscreenElement) setIsPresentation(false)
    }
    document.addEventListener('fullscreenchange', fullscreenChanged)
    return () => document.removeEventListener('fullscreenchange', fullscreenChanged)
  }, [])

  function canLeave() {
    return !dirty || window.confirm('Hay cambios sin guardar. ¿Quieres descartarlos y continuar?')
  }

  async function saveProject(project: Project) {
    setBusy(true)
    setError(null)
    try { return await controller.updateProject(project) } finally { setBusy(false) }
  }

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await controller.createProject({
        name: String(data.get('name') ?? ''),
        author: String(data.get('author') ?? ''),
        topic: String(data.get('topic') ?? ''),
      })
      setDirty(false)
      setCreating(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la presentación')
    } finally { setBusy(false) }
  }

  async function deleteProject() {
    const project = controller.activeProject
    if (!project || !window.confirm(`¿Eliminar «${project.name}» y todas sus diapositivas? Esta acción no se puede deshacer.`)) return
    setBusy(true)
    setError(null)
    try {
      await controller.deleteProject(project.id)
      setDirty(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar el proyecto')
    } finally { setBusy(false) }
  }

  function present() {
    if (!canLeave()) return
    setDirty(false)
    setPresentationNotice(null)
    setIsPresentation(true)
    if (document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => {
        setPresentationNotice('No se pudo activar la pantalla completa. Puedes continuar con la presentación en esta ventana.')
      })
    }
  }

  function exitPresentation() {
    setIsPresentation(false)
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => setError('No se pudo salir de pantalla completa. Usa Escape.'))
    }
  }

  if (isPresentation && controller.activeProject) {
    return <PresentationView project={controller.activeProject} notice={presentationNotice} onExit={exitPresentation} />
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">Ir al editor</a>
      <header className="topbar">
        <div className="wordmark"><span className="brand-mark" aria-hidden="true" />DIAPOSITIVAS<span className="brand-dot">.</span></div>
        <div className="topbar-actions">
          <span className="local-note">Tus ideas, en tu dispositivo.</span>
          <Button label="Presentar" size="md" disabled={!controller.activeProject || creating || busy} onClick={present} />
        </div>
      </header>
      <aside className="sidebar" aria-label="Proyectos">
        <p className="eyebrow">Biblioteca <span>{controller.projects.length.toString().padStart(2, '0')}</span></p>
        <Button label="Nuevo proyecto" size="md" className="w-full" disabled={busy || controller.isLoading} onClick={() => {
          if (!canLeave()) return
          setDirty(false)
          setError(null)
          controller.selectProject(null)
          setCreating(true)
        }} />
        <nav className="project-list" aria-label="Presentaciones guardadas">
          {controller.projects.map(project => (
            <Button key={project.id} label={project.name} variant="secondary" size="md"
              aria-pressed={controller.activeProject?.id === project.id} disabled={busy} onClick={() => {
                if (controller.activeProject?.id === project.id && !creating) return
                if (!canLeave()) return
                setDirty(false)
                setCreating(false)
                setError(null)
                controller.selectProject(project.id)
              }} />
          ))}
        </nav>
        <p className="sidebar-note">Guardadas en este navegador.<br />Sin cuentas. A tu ritmo.</p>
      </aside>
      <main className="workspace" id="workspace">
        {(error ?? controller.error) && <p className="error-message" role="alert">{error ?? controller.error}</p>}
        {controller.isLoading ? <p role="status">Abriendo tus presentaciones…</p> : creating ? (
          <section className="new-project" aria-labelledby="new-project-heading">
            <p className="eyebrow">Empieza por una idea</p>
            <h1 id="new-project-heading">Nueva presentación</h1>
            <p className="intro">Ponle un nombre. La primera diapositiva será tu portada.</p>
            <form onSubmit={createProject} onChange={() => setDirty(true)}>
              <fieldset disabled={busy} className="form-grid">
                <label className="field wide">Nombre del proyecto<input name="name" required autoFocus placeholder="Por ejemplo, una nueva idea" /></label>
                <label className="field">Autor<input name="author" autoComplete="name" /></label>
                <label className="field">Tema<input name="topic" /></label>
                <div className="button-row wide">
                  <Button label={busy ? 'Creando…' : 'Crear presentación'} type="submit" size="md" />
                  <Button label="Cancelar" variant="secondary" size="md" onClick={() => {
                    if (canLeave()) {
                      setDirty(false)
                      setCreating(false)
                    }
                  }} />
                </div>
              </fieldset>
            </form>
          </section>
        ) : controller.activeProject ? (
          <>
            <EditorView key={controller.activeProject.id} project={controller.activeProject} busy={busy}
              onSave={saveProject} canLeave={canLeave} onDirtyChange={setDirty} onError={setError} />
            <div className="project-footer"><Button label="Eliminar proyecto" variant="danger" size="sm" disabled={busy} onClick={() => { void deleteProject() }} /></div>
          </>
        ) : (
          <section className="empty-state">
            <p className="eyebrow">Un espacio para tus ideas</p>
            <h1>{controller.projects.length ? 'Continúa donde lo dejaste.' : 'Tu primera presentación.'}</h1>
            <p className="intro">{controller.projects.length ? 'Elige un proyecto de tu biblioteca o empieza uno nuevo.' : 'Escribe, da forma y presenta. Todo se guarda aquí.'}</p>
            <div className="empty-sheet" aria-hidden="true"><span>01</span><p>Una idea.<br />Una diapositiva.<br />Un comienzo<span className="brand-dot">.</span></p><span>PORTADA</span></div>
          </section>
        )}
      </main>
    </div>
  )
}
