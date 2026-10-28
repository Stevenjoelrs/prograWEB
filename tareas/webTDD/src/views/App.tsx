function App() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-100 px-8 py-12 text-slate-900">
      <section className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.3em] text-indigo-600 uppercase">
          webTDD
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Editor de presentaciones
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Arquitectura MVC, persistencia local con IndexedDB y desarrollo
          guiado por pruebas.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Tablet-first · React + TypeScript + Tailwind CSS
        </p>
      </section>
    </main>
  )
}

export default App
