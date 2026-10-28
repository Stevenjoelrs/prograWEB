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
- [ ] Fase 2: TDD, IndexedDB y controladores
- [ ] Fase 3: componentes UI, layouts y modos edición/presentación
- [ ] Fase 4: exportación HTML/PDF, suite completa y publicación
