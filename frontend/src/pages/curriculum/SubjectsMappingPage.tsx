import { useState } from "react";
import { BookOpen, Network } from "lucide-react";
import SubjectsPage from "./SubjectsPage";
import ClassSubjectsPage from "./ClassSubjectsPage";

const tabs = [
  { id: "subjects", label: "Mata Pelajaran", icon: BookOpen },
  { id: "mapping", label: "Pemetaan Kelas", icon: Network },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SubjectsMappingPage() {
  const [activeTab, setActiveTab] = useState<TabId>("subjects");

  return (
    <div>
      <div className="mb-6 border-b border-hairline">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Mata Pelajaran dan Pemetaan">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel">
        {activeTab === "subjects" ? <SubjectsPage /> : <ClassSubjectsPage />}
      </div>
    </div>
  );
}
