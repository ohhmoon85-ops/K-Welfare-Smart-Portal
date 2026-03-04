"use client";
import React, { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { UploadCloud, X, FileText, FileImage, File, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "./badge";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface RequiredDoc {
  key: string;
  label: string;
  description?: string;
  accept?: string; // e.g. ".pdf,.jpg,.png"
}

interface FileUploadProps {
  requiredDocs: RequiredDoc[];
  value: Record<string, UploadedFile[]>; // key → files
  onChange: (value: Record<string, UploadedFile[]>) => void;
  maxSizeMB?: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) return <FileImage className="w-4 h-4 text-blue-400" />;
  if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

// ─── Single Drop Zone ─────────────────────────────────────────────────────────

function DropZone({
  doc,
  files,
  onAdd,
  onRemove,
  maxSizeMB = 10,
}: {
  doc: RequiredDoc;
  files: UploadedFile[];
  onAdd: (newFiles: UploadedFile[]) => void;
  onRemove: (id: string) => void;
  maxSizeMB?: number;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (rawFiles: FileList | null) => {
      if (!rawFiles) return;
      setError(null);
      const accepted: UploadedFile[] = [];

      Array.from(rawFiles).forEach((f) => {
        if (f.size > maxSizeMB * 1024 * 1024) {
          setError(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다. (${f.name})`);
          return;
        }
        const url = URL.createObjectURL(f);
        accepted.push({
          id: Math.random().toString(36).slice(2),
          name: f.name,
          size: f.size,
          type: f.type,
          url,
          uploadedAt: new Date().toISOString(),
        });
      });

      if (accepted.length) onAdd(accepted);
    },
    [maxSizeMB, onAdd]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const hasFiles = files.length > 0;

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{doc.label}</span>
          {hasFiles ? (
            <Badge variant="success" className="text-[10px] py-0 gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              {files.length}건 업로드
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] py-0">미첨부</Badge>
          )}
        </div>
        {doc.description && (
          <span className="text-[10px] text-slate-400">{doc.description}</span>
        )}
      </div>

      {/* Drop Area */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-all group",
          dragging
            ? "border-blue-400 bg-blue-50 scale-[1.01]"
            : hasFiles
            ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50"
            : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={doc.accept ?? ".pdf,.jpg,.jpeg,.png,.doc,.docx,.hwp"}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />

        {hasFiles ? (
          <div className="space-y-1.5">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 bg-white rounded px-2 py-1.5 border border-emerald-100 group/item"
                onClick={(e) => e.stopPropagation()}
              >
                <FileIcon type={f.type} />
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-xs font-medium text-slate-700 truncate hover:text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {f.name}
                </a>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatBytes(f.size)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(f.id); }}
                  className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-200"
                >
                  <X className="w-2.5 h-2.5 text-red-500" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-[10px] text-blue-500 mt-1">
              <UploadCloud className="w-3 h-3" />
              <span>여기에 파일을 드래그하거나 클릭하여 추가 업로드</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2 text-center">
            <UploadCloud
              className={cn(
                "w-6 h-6 transition-colors",
                dragging ? "text-blue-500" : "text-slate-300 group-hover:text-blue-400"
              )}
            />
            <p className="text-xs text-slate-500">
              <span className="font-medium text-blue-600">클릭</span> 또는{" "}
              <span className="font-medium text-blue-600">드래그 앤 드롭</span>
            </p>
            <p className="text-[10px] text-slate-400">
              PDF, HWP, JPG, PNG, DOC · 최대 {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FileUpload({ requiredDocs, value, onChange, maxSizeMB = 10 }: FileUploadProps) {
  const uploadedCount = Object.values(value).filter((arr) => arr.length > 0).length;
  const totalCount = requiredDocs.length;

  return (
    <div className="space-y-4">
      {/* Header progress */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">
          구비서류 첨부
          <span className="ml-1.5 text-slate-400">({uploadedCount}/{totalCount}건 첨부)</span>
        </p>
        <div className="flex items-center gap-1.5">
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(uploadedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">
            {Math.round((uploadedCount / totalCount) * 100)}%
          </span>
        </div>
      </div>

      {/* Drop zones per required doc */}
      <div className="space-y-3">
        {requiredDocs.map((doc) => (
          <DropZone
            key={doc.key}
            doc={doc}
            files={value[doc.key] ?? []}
            maxSizeMB={maxSizeMB}
            onAdd={(newFiles) =>
              onChange({
                ...value,
                [doc.key]: [...(value[doc.key] ?? []), ...newFiles],
              })
            }
            onRemove={(id) =>
              onChange({
                ...value,
                [doc.key]: (value[doc.key] ?? []).filter((f) => f.id !== id),
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
