import { useRef, useState, type DragEvent, type MouseEvent } from 'react';
import { UploadCloudIcon, ImageIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LogoDropzoneProps {
  /** URL real guardada del logo (la que se persiste al guardar). */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Zona de arrastrar y soltar para el logo del tenant.
 * La subida de archivos todavía no está conectada a un endpoint — soltar o
 * seleccionar una imagen solo genera una vista previa local (blob URL) a modo
 * de demo. Lo único que se guarda de verdad es la URL del campo de texto.
 */
export function LogoDropzone({ value, onChange }: LogoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayUrl = localPreview ?? (value || null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setLocalPreview(URL.createObjectURL(file));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleRemove(e: MouseEvent) {
    e.stopPropagation();
    setLocalPreview(null);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'group relative flex items-center gap-4 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors',
          isDragging
            ? 'border-accent bg-accent/5'
            : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
          {displayUrl ? (
            <img src={displayUrl} alt="Logo" className="h-full w-full object-contain p-1" />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-300" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <UploadCloudIcon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-accent" />
            Arrastra tu logo aquí o haz clic para seleccionarlo
          </span>
          <span className="text-xs text-slate-400">
            {localPreview
              ? 'Vista previa local — la subida de archivos aún no está conectada'
              : 'PNG o JPG · por ahora, usa el campo de URL de abajo para guardar el logo'}
          </span>
        </div>

        {displayUrl && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-slate-400 hover:text-destructive"
            onClick={handleRemove}
          >
            <XIcon />
          </Button>
        )}
      </div>

      <Input
        type="url"
        placeholder="https://... (URL pública del logo)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
