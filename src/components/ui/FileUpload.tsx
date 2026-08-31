import { useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Input";

interface FileUploadProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label?: ReactNode;
  required?: boolean;
  name: string;
  onFileChange?: (file: File | null) => void;
}

export default function FileUpload({
  label,
  required,
  name,
  onFileChange,
  className,
  ...props
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    onFileChange?.(f);
  };

  const clear = () => {
    setFile(null);
    onFileChange?.(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      {label && <Label required={required}>{label}</Label>}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500 transition-colors hover:border-brand-400 hover:bg-brand-50/40",
          file && "border-brand-400 bg-brand-50/40",
        )}
      >
        {file ? (
          <>
            <span className="max-w-[70%] truncate font-medium text-brand-700">{file.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm hover:text-rose-500"
              aria-label="Remove file"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4" />
            <span>Click to upload a document</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        onChange={handleChange}
        className="sr-only"
        {...props}
      />
    </div>
  );
}
