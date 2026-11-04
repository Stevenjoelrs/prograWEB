import { useState } from 'react'
import type { Project } from '../../models/Project'
import type { Slide } from '../../models/Slide'
import { useSlideController } from '../../controllers/useSlideController'
import Button from '../components/Button'
import SlideRenderer from '../components/SlideRenderer'

interface EditorViewProps {
  project: Project
  busy: boolean
  onSave: (project: Project) => Promise<Project>
  canLeave: () => boolean
  onDirtyChange: (dirty: boolean) => void
  onError: (message: string | null) => void
}

export default function EditorView({ project, busy, onSave, canLeave, onDirtyChange, onError }: EditorViewProps) {
  const controller = useSlideController(project, onSave)

  async function changeSlides(operation: () => Promise<void>) {
    onError(null)
    try {
      await operation()
      onDirtyChange(false)
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'No se pudo guardar la diapositiva')
    }
  }

  return (
    <section aria-label="Editor de diapositivas">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Tu presentación</p>
          <h1>{project.name}</h1>
          <p className="project-info">{[project.author, project.topic, project.date].filter(Boolean).join(' · ')}</p>
        </div>
        <span className="slide-count">{project.slides.length} {project.slides.length === 1 ? 'diapositiva' : 'diapositivas'}</span>
      </div>
      <nav className="slide-strip" aria-label="Diapositivas">
        {project.slides.map((slide, index) => (
          <Button key={slide.id}
            label={`${index + 1}. ${slide.type === 'title' ? 'Portada' : slide.title || 'Sin título'}`}
            variant="secondary" size="sm" disabled={busy}
            aria-pressed={controller.activeSlide.id === slide.id}
            onClick={() => {
              if (slide.id !== controller.activeSlide.id && canLeave()) {
                onError(null)
                onDirtyChange(false)
                controller.selectSlide(slide.id)
              }
            }} />
        ))}
        <Button label="Añadir diapositiva" variant="secondary" size="sm" disabled={busy}
          onClick={() => { if (canLeave()) void changeSlides(() => controller.addSlide()) }} />
      </nav>
      <SlideForm key={controller.activeSlide.id}
        slide={controller.activeSlide} project={project} index={controller.activeIndex}
        busy={busy} onDirtyChange={onDirtyChange} onError={onError} onSave={controller.updateSlide}
        onDelete={() => {
          if (window.confirm('¿Eliminar esta diapositiva y sus cambios? Esta acción no se puede deshacer.')) {
            void changeSlides(() => controller.deleteSlide(controller.activeSlide.id))
          }
        }} />
    </section>
  )
}

function SlideForm({ slide, project, index, busy, onSave, onDelete, onDirtyChange, onError }: {
  slide: Slide
  project: Project
  index: number
  busy: boolean
  onSave: (slide: Slide) => Promise<void>
  onDelete: () => void
  onDirtyChange: (dirty: boolean) => void
  onError: (message: string | null) => void
}) {
  const [draft, setDraft] = useState(slide)
  const [status, setStatus] = useState('Guardado en este dispositivo')

  function change(updated: Slide) {
    setDraft(updated)
    setStatus('Cambios sin guardar')
    onDirtyChange(true)
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onError(null)
    try {
      await onSave(draft)
      onDirtyChange(false)
      setStatus('Cambios guardados')
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'No se pudieron guardar los cambios')
    }
  }

  return (
    <>
      <div className="canvas-caption"><span>Vista previa</span><span>{String(index + 1).padStart(2, '0')} / {String(project.slides.length).padStart(2, '0')}</span></div>
      <div className="slide-canvas" aria-label="Vista previa de la diapositiva">
        <SlideRenderer slide={draft} project={project} slideIndex={index} className="h-full" />
      </div>
      <form className="slide-form" onSubmit={save}>
        <fieldset disabled={busy}>
          <legend className="eyebrow">{draft.type === 'title' ? 'Editar portada' : 'Editar diapositiva'}</legend>
          <div className="form-grid">
            <label className="field wide">Título de la diapositiva
              <input value={draft.title} onChange={event => change({ ...draft, title: event.target.value })} />
            </label>
            {draft.type === 'title' ? (
              <label className="field wide">Subtítulo
                <textarea rows={2} value={draft.subtitle ?? ''} onChange={event => change({ ...draft, subtitle: event.target.value })} />
              </label>
            ) : (
              <>
                <label className="field wide">Formato
                  <select value={draft.layout} onChange={event => change({ ...draft, layout: event.target.value as typeof draft.layout })}>
                    <option value="text-only">Solo texto</option>
                    <option value="image-only">Solo imagen</option>
                    <option value="text-and-image">Texto e imagen</option>
                  </select>
                </label>
                {draft.layout !== 'image-only' && (
                  <label className="field wide">Texto
                    <textarea rows={4} value={draft.body ?? ''} onChange={event => change({ ...draft, body: event.target.value })} />
                  </label>
                )}
                {draft.layout !== 'text-only' && (
                  <>
                    <label className="field">URL de imagen
                      <input type="url" placeholder="https://" value={draft.imageUrl ?? ''} onChange={event => change({ ...draft, imageUrl: event.target.value })} />
                    </label>
                    <label className="field">Descripción de la imagen
                      <input value={draft.imageAlt ?? ''} onChange={event => change({ ...draft, imageAlt: event.target.value })} />
                    </label>
                  </>
                )}
              </>
            )}
          </div>
          <div className="form-actions">
            <p role="status">{busy ? 'Guardando…' : status}</p>
            <div className="button-row">
              {draft.type === 'content' && <Button label="Eliminar diapositiva" variant="danger" size="sm" onClick={onDelete} />}
              <Button label="Guardar cambios" type="submit" size="md" />
            </div>
          </div>
        </fieldset>
      </form>
    </>
  )
}
