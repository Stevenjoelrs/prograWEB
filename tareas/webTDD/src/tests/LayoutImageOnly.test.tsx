import { render, screen } from '@testing-library/react'
import LayoutImageOnly from '../views/components/LayoutImageOnly'
import { buildContentSlide } from './factories/projectFactory'

const imageUrl = 'https://example.com/diagrama.png'

describe('LayoutImageOnly', () => {
  it('renderiza el título del slide como encabezado de nivel 2', () => {
    const slide = buildContentSlide({ title: 'Arquitectura MVC' })

    render(<LayoutImageOnly slide={slide} />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Arquitectura MVC' }),
    ).toBeInTheDocument()
  })

  it('muestra la imagen con su origen y texto alternativo', () => {
    const slide = buildContentSlide({ imageUrl, imageAlt: 'Diagrama de capas' })

    render(<LayoutImageOnly slide={slide} />)

    const image = screen.getByRole('img', { name: 'Diagrama de capas' })
    expect(image).toHaveAttribute('src', imageUrl)
  })

  it('usa el título como texto alternativo cuando falta imageAlt', () => {
    const slide = buildContentSlide({
      title: 'Arquitectura MVC',
      imageUrl,
      imageAlt: undefined,
    })

    render(<LayoutImageOnly slide={slide} />)

    expect(screen.getByRole('img', { name: 'Arquitectura MVC' })).toBeInTheDocument()
  })

  it('muestra un placeholder cuando falta la URL de la imagen', () => {
    const slide = buildContentSlide({ imageUrl: undefined })

    render(<LayoutImageOnly slide={slide} />)

    expect(screen.getByText('Sin imagen')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('muestra el placeholder cuando la URL está en blanco', () => {
    const slide = buildContentSlide({ imageUrl: '   ' })

    render(<LayoutImageOnly slide={slide} />)

    expect(screen.getByText('Sin imagen')).toBeInTheDocument()
  })

  it('ocupa el espacio disponible dentro del marco', () => {
    const { container } = render(<LayoutImageOnly slide={buildContentSlide()} />)

    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('w-full')
    expect(className).toContain('flex-1')
  })
})
