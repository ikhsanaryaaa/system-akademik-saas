import type { ReactNode } from "react";
import { BookOpen, BriefcaseBusiness, Clock4, GraduationCap, Hash, Mail, Phone, UserRound, type LucideIcon } from "lucide-react";
import { photoSrc } from "../lib/master";
import IconActions from "./IconActions";

const rowIcons: Record<string, LucideIcon> = {
  NIP: Hash,
  Email: Mail,
  Telepon: Phone,
  "Jenis Kelamin": UserRound,
  Jabatan: BriefcaseBusiness,
  NIS: Hash,
  NISN: Hash,
  Kelas: GraduationCap,
  "Mata Pelajaran": BookOpen,
  Pengajar: UserRound,
  Waktu: Clock4,
};

export default function EntityCard({
  photo,
  title,
  fallbackTitle,
  hidePhoto = false,
  rows,
  badge,
  titleBadge = false,
  onEdit,
  onDelete,
}: {
  photo?: string;
  title: string;
  fallbackTitle?: string;
  hidePhoto?: boolean;
  rows: { label: string; value: string; mono?: boolean }[];
  badge?: ReactNode;
  titleBadge?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const initials = (fallbackTitle ?? title)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <article className="rounded-lg border border-hairline bg-canvas p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        {!hidePhoto && (
          <div className="grid aspect-[2/3] w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-primary-soft sm:w-24">
            {photo ? (
              <img src={photoSrc(photo)} alt={`Foto ${fallbackTitle ?? title}`} className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-base font-semibold text-white">
                {initials}
              </span>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 border-b border-hairline pb-2">
            <div className="min-w-0 pt-1">
              <h2
                className={
                  titleBadge
                    ? "inline-flex max-w-full rounded-md bg-primary-soft px-2.5 py-1 font-mono text-sm font-semibold text-primary"
                    : "truncate text-base font-semibold text-ink"
                }
              >
                <span className="truncate">{title}</span>
              </h2>
              {badge && <div className="mt-1">{badge}</div>}
            </div>
            <IconActions onEdit={onEdit} onDelete={onDelete} />
          </div>

          <dl className="divide-y divide-hairline text-sm">
            {rows.map((row) => {
              const Icon = rowIcons[row.label];
              return (
                <div key={row.label} className="grid grid-cols-[auto_1fr] items-start gap-2 py-2">
                  <dt className="flex items-center gap-1.5 text-muted">
                    {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />}
                    <span>{row.label}</span>
                  </dt>
                  <dd className={`min-w-0 break-words text-right text-body ${row.mono ? "font-mono" : ""}`}>
                    {row.value || "-"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </article>
  );
}
