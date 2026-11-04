import { useEffect, useState } from 'react'
import type { Project } from '../../models/Project'
import Button from '../components/Button'
import SlideRenderer from '../components/SlideRenderer'

export default function PresentationView({ project, notice, onExit }: {
  project: Project
  notice: string | null
  onExit: () => void
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    function navigate(event: KeyboardEvent) {
      if (event.key === 'Escape') onExit()
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setIndex(current => Math.min(project.slides.length - 1, current + 1))
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setIndex(current => Math.max(0, current - 1))
      }
    }
    window.addEventListener('keydown', navigate)
    return () => window.removeEventListener('keydown', navigate)
  }, [project.slides.length, onExit])

  return (
    <section className="presentation" aria-label="Presentación">
      <header className="presentation-bar">
        <p>{project.name}</p>
        <Button label="Salir de presentación" variant="secondary" size="md" onClick={onExit} autoFocus />
      </header>
      {notice && <p className="presentation-notice" role="status">{notice}</p>}
      <div className="presentation-stage">
        <div className="presentation-canvas">
          <SlideRenderer slide={project.slides[index]} project={project} slideIndex={index} className="h-full" />
        </div>
      </div>
      <nav className="presentation-controls" aria-label="Navegación de presentación">
        <Button label="Anterior" variant="secondary" size="md" disabled={index === 0} onClick={() => setIndex(index - 1)} />
        <p aria-live="polite">{index + 1} / {project.slides.length}</p>
        <Button label="Siguiente" size="md" disabled={index === project.slides.length - 1} onClick={() => setIndex(index + 1)} />
      </nav>
    </section>
  )
}
