import { useId, useState, type ChangeEvent } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { photoSrc, uploadPhoto } from "../lib/master";

export default function PhotoUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string) => void;
}) {
  const inputId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    try {
      onChange(await uploadPhoto(file));
    } catch {
      setError("Gagal mengunggah foto. Gunakan jpg, png, atau webp maksimal 2MB.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-body">Foto</label>
      <label
        htmlFor={inputId}
        className="mt-1 block cursor-pointer overflow-hidden rounded-lg border border-dashed border-hairline bg-surface-soft focus-within:border-primary"
      >
        <span className="relative mx-auto grid aspect-[2/3] w-28 place-items-center sm:w-32">
          {value ? (
            <img src={photoSrc(value)} alt="Preview foto" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-sm text-muted">
              <ImagePlus className="h-8 w-8" />
              Pilih foto
            </span>
          )}
          {loading && (
            <span className="absolute inset-0 grid place-items-center bg-overlay text-white">
              <LoaderCircle className="h-7 w-7 animate-spin" aria-label="Mengunggah foto" />
            </span>
          )}
        </span>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={loading}
          className="sr-only"
        />
      </label>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
