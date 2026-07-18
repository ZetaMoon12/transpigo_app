import { useEffect, useMemo, useRef } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';

interface PhotoUploadGridProps {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
}

// Grid de miniaturas + input de cámara oculto. `capture="environment"` fuerza la
// cámara trasera en móvil sin necesitar ninguna librería adicional.
export function PhotoUploadGrid({ files, onChange, max = 5 }: PhotoUploadGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    onChange([...files, ...selected].slice(0, max));
    e.target.value = '';
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {previews.map((url, index) => (
        <div key={index} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200">
          <img src={url} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => removeAt(index)}
            className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      ))}

      {files.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-500"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold">Foto</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  );
}
