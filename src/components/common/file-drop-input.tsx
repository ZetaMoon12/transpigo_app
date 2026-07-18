import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { UploadIcon, FileIcon, Trash2Icon, FileTextIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldError } from '@/components/ui/field';

interface FileDropInputProps {
  label: string;
  required?: boolean;
  error?: string;
  accept?: string;
  onChange: (file: File | undefined) => void;
  value?: File;
  helperText?: string;
}

export function FileDropInput({
  label,
  required,
  error,
  accept = 'image/*,application/pdf',
  onChange,
  value,
  helperText = 'Formatos soportados: JPG, PNG, PDF (máx. 5MB)',
}: FileDropInputProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onChange(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onChange(file);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const isPdf = value?.type === 'application/pdf';
  const isImage = value?.type.startsWith('image/');

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label */}
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>

      {/* Dropzone container */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={cn(
          "relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all duration-200 min-h-[120px]",
          isDragActive
            ? "border-[#5AB507] bg-[#5AB507]/5 scale-[1.01]"
            : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50",
          error && "border-destructive/60 hover:border-destructive bg-destructive/5",
          value && "border-solid border-[#5AB507]/30 bg-[#5AB507]/5"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />

        {value ? (
          // File preview state
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {isImage ? (
                <div className="w-12 h-12 rounded-lg border border-slate-100 overflow-hidden shrink-0 bg-white shadow-xs">
                  <img
                    src={URL.createObjectURL(value)}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs border border-emerald-100">
                  {isPdf ? <FileTextIcon className="w-6 h-6" /> : <FileIcon className="w-6 h-6" />}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-[300px]">
                  {value.name}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {formatSize(value.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-sm transition-all duration-150"
              title="Quitar archivo"
            >
              <Trash2Icon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Empty upload state
          <div className="text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2 transition-transform duration-200 hover:scale-110">
              <UploadIcon className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Arrastra aquí tu archivo o <span className="text-[#5AB507] hover:underline">haz clic para buscar</span>
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{helperText}</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
