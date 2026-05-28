export function Footer() {
  return (
    <footer className="border-t border-border/40 py-6 mt-16">
      <div className="container mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Thiago Santos. Construído com Next.js e Supabase.</p>
      </div>
    </footer>
  )
}
