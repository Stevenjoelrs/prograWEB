import { render, screen } from '@testing-library/react'
import LayoutTextOnly from '../views/components/LayoutTextOnly'
import { buildContentSlide } from './factories/projectFactory'

describe('LayoutTextOnly', () => {
  it('renderiza el título del slide como encabezado de nivel 2', () => {
    const slide = buildContentSlide({ title: 'Introducción a TDD' })

    render(<LayoutTextOnly slide={slide} />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Introducción a TDD' }),
    ).toBeInTheDocument()
  })

  it('muestra el cuerpo de texto del slide', () => {
    const slide = buildContentSlide({ body: 'Escribir la prueba primero.' })

    render(<LayoutTextOnly slide={slide} />)

    expect(screen.getByText('Escribir la prueba primero.')).toBeInTheDocument()
  })

  it('conserva los saltos de línea del cuerpo', () => {
    const slide = buildContentSlide({ body: 'Primer párrafo' })

    render(<LayoutTextOnly slide={slide} />)

    expect(screen.getByText('Primer párrafo').className).toContain('whitespace-pre-line')
  })

  it('muestra un placeholder cuando el cuerpo no existe', () => {
    const slide = buildContentSlide({ body: undefined })

    render(<LayoutTextOnly slide={slide} />)

    expect(screen.getByText('Sin contenido')).toBeInTheDocument()
    expect(screen.queryByText('Escribir la prueba primero.')).not.toBeInTheDocument()
  })

  it('muestra el placeholder cuando el cuerpo está en blanco', () => {
    const slide = buildContentSlide({ body: '   ' })

    render(<LayoutTextOnly slide={slide} />)

    expect(screen.getByText('Sin contenido')).toBeInTheDocument()
  })

  it('ocupa el espacio disponible dentro del marco', () => {
    const { container } = render(<LayoutTextOnly slide={buildContentSlide()} />)

    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('w-full')
    expect(className).toContain('flex-1')
  })
})
