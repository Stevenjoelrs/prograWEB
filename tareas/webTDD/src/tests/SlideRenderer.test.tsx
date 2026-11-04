import { render, screen, within } from '@testing-library/react'
import SlideRenderer from '../views/components/SlideRenderer'
import { buildContentSlide, buildProject, buildTitleSlide } from './factories/projectFactory'

describe('SlideRenderer', () => {
  describe('portada (type: title)', () => {
    it('renderiza el título como encabezado de nivel 1', () => {
      const slide = buildTitleSlide({ title: 'Compiladores' })

      render(<SlideRenderer slide={slide} project={buildProject()} slideIndex={0} />)

      expect(
        screen.getByRole('heading', { level: 1, name: 'Compiladores' }),
      ).toBeInTheDocument()
    })

    it('muestra el subtítulo cuando existe', () => {
      const slide = buildTitleSlide({ subtitle: 'Semestre 2026' })

      render(<SlideRenderer slide={slide} project={buildProject()} slideIndex={0} />)

      expect(screen.getByText('Semestre 2026')).toBeInTheDocument()
    })

    it('no muestra el subtítulo cuando no existe', () => {
      const slide = buildTitleSlide({ subtitle: undefined })

      render(<SlideRenderer slide={slide} project={buildProject()} slideIndex={0} />)

      expect(screen.queryByText(/undefined/)).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('no envuelve la portada en el marco de header y footer', () => {
      render(
        <SlideRenderer slide={buildTitleSlide()} project={buildProject()} slideIndex={0} />,
      )

      expect(screen.queryByRole('banner')).not.toBeInTheDocument()
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    })
  })

  describe('diapositivas de desarrollo (type: content)', () => {
    it('envuelve el layout en el marco con autor y tópico del proyecto', () => {
      const project = buildProject({ author: 'Grace Hopper', topic: 'Traductores' })

      render(
        <SlideRenderer slide={buildContentSlide()} project={project} slideIndex={0} />,
      )

      const banner = screen.getByRole('banner')
      expect(within(banner).getByText('Grace Hopper')).toBeInTheDocument()
      expect(within(banner).getByText('Traductores')).toBeInTheDocument()
    })

    it('muestra la fecha del proyecto y el número de slide en el footer', () => {
      const project = buildProject({ date: '12/10/2026' })

      render(
        <SlideRenderer slide={buildContentSlide()} project={project} slideIndex={2} />,
      )

      const contentinfo = screen.getByRole('contentinfo')
      expect(within(contentinfo).getByText('3')).toBeInTheDocument()
      expect(within(contentinfo).getByText('12/10/2026')).toBeInTheDocument()
    })

    it('usa el índice 0 como primer número cuando no se envía slideIndex', () => {
      render(<SlideRenderer slide={buildContentSlide()} project={buildProject()} />)

      expect(within(screen.getByRole('contentinfo')).getByText('1')).toBeInTheDocument()
    })

    it('renderiza el layout de solo texto', () => {
      const slide = buildContentSlide({
        layout: 'text-only',
        body: 'Contenido en texto',
      })

      render(<SlideRenderer slide={slide} project={buildProject()} slideIndex={0} />)

      expect(screen.getByText('Contenido en texto')).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('renderiza el layout de solo imagen', () => {
      const slide = buildContentSlide({
        layout: 'image-only',
        imageUrl: 'https://example.com/grafo.png',
        imageAlt: 'Grafo de dependencias',
      })

      render(<SlideRenderer slide={slide} project={buildProject()} slideIndex={0} />)

      expect(screen.getByRole('img', { name: 'Grafo de dependencias' })).toBeInTheDocument()
      expect(screen.queryByText('Contenido de prueba')).not.toBeInTheDocument()
    })

    it('renderiza el layout de texto e imagen', () => {
      const slide = buildContentSlide({
        layout: 'text-and-image',
        body: 'Texto del layout mixto',
        imageUrl: 'https://example.com/mixto.png',
        imageAlt: 'Imagen mixta',
      })

      render(<SlideRenderer slide={slide} project={buildProject()} slideIndex={0} />)

      expect(screen.getByText('Texto del layout mixto')).toBeInTheDocument()
      expect(screen.getByRole('img', { name: 'Imagen mixta' })).toBeInTheDocument()
    })

    it('coloca el header, el layout y el footer en ese orden', () => {
      const { container } = render(
        <SlideRenderer
          slide={buildContentSlide({ layout: 'text-only' })}
          project={buildProject()}
          slideIndex={0}
        />,
      )

      const root = container.firstElementChild
      expect(root?.children).toHaveLength(3)
      expect(root?.children[0]).toBe(screen.getByRole('banner'))
      expect(root?.children[2]).toBe(screen.getByRole('contentinfo'))
    })
  })

  describe('presentación del marco', () => {
    it('concatena una className personalizada sin perder las clases base', () => {
      const { container } = render(
        <SlideRenderer
          slide={buildContentSlide()}
          project={buildProject()}
          slideIndex={0}
          className="text-white"
        />,
      )

      const className = container.firstElementChild?.className ?? ''
      expect(className).toContain('text-white')
      expect(className).toContain('w-full')
    })

    it('propaga las propiedades nativas del contenedor', () => {
      render(
        <SlideRenderer
          slide={buildContentSlide()}
          project={buildProject()}
          slideIndex={0}
          data-testid="slide"
        />,
      )

      expect(screen.getByTestId('slide')).toBeInTheDocument()
    })
  })
})
