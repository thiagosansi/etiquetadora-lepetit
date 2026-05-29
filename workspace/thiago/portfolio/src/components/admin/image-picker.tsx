'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { listStorageFiles } from '@/lib/actions/storage'
import { getStoragePublicUrl } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ImageIcon, X } from 'lucide-react'

interface ImagePickerProps {
  bucket?: string
  value: string | null
  onChange: (path: string | null) => void
}

export function ImagePicker({ bucket = 'portfolio', value, onChange }: ImagePickerProps) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<{ name: string }[]>([])
  const [loading, setLoading] = useState(false)

  async function loadFiles() {
    setLoading(true)
    try {
      const data = await listStorageFiles(bucket)
      setFiles(data)
    } catch {
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) loadFiles()
  }, [open])

  const currentUrl = value ? getStoragePublicUrl(bucket, value) : null

  return (
    <div className="space-y-3">
      {/* Preview atual */}
      {currentUrl && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted/30 group">
          <Image
            src={currentUrl}
            alt="Cover atual"
            fill
            className="object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            aria-label="Remover imagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ImageIcon className="h-4 w-4 mr-2" />
          {value ? 'Trocar imagem' : 'Escolher do Storage'}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Escolher imagem — bucket: {bucket}</DialogTitle>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Carregando arquivos...
            </div>
          )}

          {!loading && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <p>Nenhum arquivo encontrado no bucket.</p>
              <p className="text-xs">Faça upload pelo Supabase Dashboard → Storage → portfolio</p>
            </div>
          )}

          {!loading && files.length > 0 && (
            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {files.map((file) => {
                const url = getStoragePublicUrl(bucket, file.name)
                const isSelected = value === file.name
                return (
                  <button
                    key={file.name}
                    type="button"
                    onClick={() => {
                      onChange(file.name)
                      setOpen(false)
                    }}
                    className={cn(
                      'relative aspect-video rounded-lg overflow-hidden border-2 transition-all',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Image
                      src={url}
                      alt={file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-background/80 px-2 py-1">
                      <p className="text-xs truncate text-foreground">{file.name}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {value && (
        <p className="text-xs text-muted-foreground font-mono truncate">{value}</p>
      )}
    </div>
  )
}
