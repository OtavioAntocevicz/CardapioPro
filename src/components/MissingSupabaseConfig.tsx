export function MissingSupabaseConfig() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12 text-center dark:bg-slate-950">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
          Configuração necessária
        </p>
        <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
          Variáveis do Supabase não encontradas
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          O build não recebeu <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">VITE_SUPABASE_URL</code> nem{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">VITE_SUPABASE_ANON_KEY</code>. No Vite elas precisam existir{' '}
          <strong>no momento do build</strong> (não só no runtime).
        </p>
        <ol className="mt-6 space-y-3 text-left text-sm text-slate-700 dark:text-slate-300">
          <li className="flex gap-2">
            <span className="font-semibold text-brand-600 dark:text-brand-400">1.</span>
            No painel da Vercel: <strong>Project → Settings → Environment Variables</strong>.
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-brand-600 dark:text-brand-400">2.</span>
            Adicione as duas variáveis (mesmos nomes do <code className="text-xs">.env.example</code>), ambas marcadas para{' '}
            <strong>Production</strong> (e Preview se usar).
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-brand-600 dark:text-brand-400">3.</span>
            <strong>Redeploy</strong> o projeto (Deployments → ⋮ → Redeploy) para o build embutir os valores.
          </li>
        </ol>
        <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
          Localmente, copie <code className="text-slate-600 dark:text-slate-400">.env.example</code> para{' '}
          <code className="text-slate-600 dark:text-slate-400">.env</code> e preencha.
        </p>
      </div>
    </div>
  )
}
