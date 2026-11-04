# Integrantes
- Steven Joel Ramos Salazar
- Jhosua Alejandro Bustillos Calderon

# webTDD · Editor de presentaciones

Aplicación web cliente para crear, editar, organizar y presentar diapositivas.
Funciona de forma autónoma en el navegador: no requiere backend ni conexión a
internet durante el uso normal.

El diseño es **tablet-first**: la base visual parte de 768 px de ancho y en
teléfonos se acepta la vista de tablet como mínimo funcional.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- IndexedDB como almacenamiento local
- Jest + React Testing Library + `fake-indexeddb`
- **pnpm** como único gestor de paquetes

## Comandos

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm lint
pnpm typecheck
pnpm typecheck:test
```

## Arquitectura

Se usa MVC con inversión de dependencias. Los controladores dependen de
interfaces, no de implementaciones concretas:

```text
src/
├── models/          Contratos e interfaces (Slide, Project, ports)
├── infrastructure/  Adaptadores concretos (IndexedDB, HTTP futuro)
├── controllers/     Hooks con la lógica de negocio
├── views/           Componentes presentacionales y contenedores
└── tests/           Pruebas unitarias e integración
```

La interfaz `IProjectRepository` permite sustituir IndexedDB por una
arquitectura de microservicios REST sin modificar los controladores ni la vista.

## Estado del proyecto

- [x] Fase 1: setup, arquitectura base y modelos
- [x] Fase 2: TDD, IndexedDB y controlador de proyectos
- [x] Fase 3: componentes UI, layouts y modos edición/presentación
- [ ] HU-04: copiar y mover diapositivas entre proyectos
- [ ] Fase 4: exportación HTML/PDF, suite completa y publicación

## Fase 2

`IndexedDbProjectRepository` implementa el puerto existente, abre la base al
necesitarla y confirma los guardados al completar la transacción. Su método
`close()` libera la conexión; también la libera ante cambios de versión.

`useProjectController(repository)` recibe una instancia estable del repositorio.
Expone proyectos ordenados por última actualización, selección, carga y errores,
además de creación con portada, actualización y eliminación. Las operaciones
fallidas rechazan su promesa y conservan el estado anterior.

Las pruebas se ejecutaron primero en rojo y luego en verde por módulo. Cubren
el contrato con un repositorio en memoria, IndexedDB con `fake-indexeddb` y
la integración de ambos módulos bajo `StrictMode`, incluida la reapertura.

## Fase 3

La página conecta `useProjectController` e IndexedDB con la biblioteca de
proyectos, su creación y eliminación. `useSlideController` permite agregar,
seleccionar, editar y eliminar diapositivas; la portada se conserva siempre.

El editor y el modo de presentación reutilizan `Button`, `SlideRenderer`,
`HeaderFooter` y los tres layouts existentes. El diseño parte de tablet
(768 px): negro predominante, superficies blancas y acentos rojos, sin hover,
sombras, degradados ni animaciones. Los botones tienen un alto mínimo de 44 px.

La vista previa refleja el borrador. **Guardar cambios** persiste la edición;
si falla, el formulario conserva el contenido y permite reintentar. Se pide
confirmación antes de abandonar cambios o eliminar datos.

**Presentar** solicita pantalla completa cuando el navegador lo permite.
Se navega con botones táctiles o flechas izquierda/derecha y se sale con
Escape o **Salir de presentación**. Las imágenes se referencian mediante URL
HTTP/HTTPS; las imágenes remotas requieren conexión para cargarse.
