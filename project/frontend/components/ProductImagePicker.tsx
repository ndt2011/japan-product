"use client";

import { Button } from "@/components/ui";
import { DragEvent, useCallback, useState } from "react";

interface ProductImagePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxImages?: number;
}

export function ProductImagePicker({ files, onChange, maxImages = 8 }: ProductImagePickerProps) {
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const allowed = Array.from(incoming).filter(
        (f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024,
      );
      const next = [...files, ...allowed].slice(0, maxImages);
      onChange(next);
      setPreviews(next.map((f) => URL.createObjectURL(f)));
    },
    [files, maxImages, onChange],
  );

  function removeAt(index: number) {
    const next = files.filter((_, i) => i !== index);
    onChange(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      {files.length < maxImages && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => document.getElementById("product-create-images")?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            dragOver ? "border-brand bg-brand-light/30" : "border-border hover:border-brand/50"
          }`}
        >
          <p className="text-sm text-text-muted">
            Kéo thả ảnh hoặc <span className="text-brand underline">chọn file</span>
          </p>
          <p className="text-xs text-text-placeholder mt-1">
            JPG, PNG, WEBP — tối đa 5MB/ảnh, {maxImages} ảnh
          </p>
          <input
            id="product-create-images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((url, index) => (
            <div key={url} className="relative aspect-square group">
              <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-border" />
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-brand text-white text-xs px-1.5 py-0.5 rounded">
                  Chính
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center">
                <Button type="button" size="sm" variant="danger" onClick={() => removeAt(index)}>
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <p className="text-xs text-text-muted">
          {files.length}/{maxImages} ảnh — ảnh đầu tiên sẽ là ảnh chính
        </p>
      )}
    </div>
  );
}
