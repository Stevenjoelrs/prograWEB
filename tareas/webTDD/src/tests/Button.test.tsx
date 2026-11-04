import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../views/components/Button'

describe('Button', () => {
  it('renderiza su etiqueta como botón accesible', () => {
    render(<Button label="Guardar" onClick={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('ejecuta onClick al hacer clic', async () => {
    const onClick = jest.fn()
    const user = userEvent.setup()
    render(<Button label="Siguiente" onClick={onClick} />)

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('se activa con la tecla Enter estando enfocado', async () => {
    const onClick = jest.fn()
    const user = userEvent.setup()
    render(<Button label="Aceptar" onClick={onClick} />)

    await user.tab()
    await user.keyboard('{Enter}')

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('usa la variante y el tamaño por defecto', () => {
    render(<Button label="Primario" onClick={jest.fn()} />)

    const button = screen.getByRole('button', { name: 'Primario' })
    expect(button.className).toContain('bg-red-600')
    expect(button.className).toContain('px-6 py-3')
    expect(button.className).toContain('text-lg')
  })

  it.each([
    ['primary', 'bg-red-600'],
    ['secondary', 'bg-black'],
    ['danger', 'text-red-400'],
  ] as const)('aplica las clases de la variante %s', (variant, expected) => {
    render(<Button label={variant} onClick={jest.fn()} variant={variant} />)

    expect(screen.getByRole('button', { name: variant }).className).toContain(expected)
  })

  it.each([
    ['sm', 'px-2 py-1', 'text-sm'],
    ['md', 'px-4 py-2', 'text-base'],
    ['lg', 'px-6 py-3', 'text-lg'],
  ] as const)('aplica las clases del tamaño %s', (size, padding, fontSize) => {
    render(<Button label={size} onClick={jest.fn()} size={size} />)

    const className = screen.getByRole('button', { name: size }).className
    expect(className).toContain(padding)
    expect(className).toContain(fontSize)
  })

  it('concatena una clase personalizada sin perder las clases base', () => {
    render(<Button label="Ancho" onClick={jest.fn()} className="w-full" />)

    const className = screen.getByRole('button', { name: 'Ancho' }).className
    expect(className).toContain('w-full')
    expect(className).toContain('rounded')
    expect(className).toContain('font-medium')
  })

  it('respeta las propiedades nativas del botón como disabled', () => {
    render(<Button label="Deshabilitado" onClick={jest.fn()} disabled />)

    expect(screen.getByRole('button', { name: 'Deshabilitado' })).toBeDisabled()
  })

  it.each(['primary', 'secondary', 'danger'] as const)('ofrece área táctil y evita hover en %s', variant => {
    render(<Button label="Acción" variant={variant} />)
    const button = screen.getByRole('button', { name: 'Acción' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button.className).toContain('min-h-11')
    expect(button.className).not.toContain('hover:')
  })

  it('permite usar un botón submit sin onClick', async () => {
    const submit = jest.fn(event => event.preventDefault())
    render(<form onSubmit={submit}><Button label="Guardar formulario" type="submit" /></form>)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar formulario' }))
    expect(submit).toHaveBeenCalledTimes(1)
  })
})
