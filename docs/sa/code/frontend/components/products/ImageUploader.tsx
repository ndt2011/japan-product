'use client';

/**
 * ImageUploader — Upload nhiều ảnh sản phẩm
 *
 * Features:
 * - Drag-and-drop hoặc click để chọn file
 * - Preview grid sau khi chọn
 * - Set ảnh primary (dùng làm ảnh đại diện)
 * - Xóa từng ảnh
 * - Validate: max 8 ảnh, chỉ image/*, max 5MB mỗi file
 *
 * Cách dùng:
 *   <ImageUploader
 *     existingImages={product.images}    // ảnh đã có (khi edit)
 *     onChange={(files, primaryIndex) => {
 *       setNewFiles(files);
 *       setPrimaryIndex(primaryIndex);
 *     }}
 *   />
 *
 * IMPORTANT: Khi submit form, KHÔNG set Content-Type header.
 * Dùng FormData và để browser tự set boundary.
 */

import { useCallback, useState } from 'react';
import { Upload, X, Star } from 'lucide-react';

interface ExistingImage {
  id: number;
  image_path: string;
  is_primary: boolean;
  order_no: number;
}

interface ImageUploaderProps {
  existingImages?: ExistingImage[];
  onChange?: (files: File[], primaryIndex: number) => void;
  maxImages?: number;
}

export default function ImageUploader({
  existingImages = [],
  onChange,
  maxImages = 8,
}: ImageUploaderProps) {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPrimaryIndex, setNewPrimaryIndex] = useState(0);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeExisting = existingImages.filter((img) => !deletedIds.includes(img.id));
  const totalCount = activeExisting.length + newFiles.length;

  // ── Validate files ────────────────────────────────────────────────────────
  const validateAndAdd = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const arr = Array.from(files);
      const remaining = maxImages - totalCount;

      if (arr.length > remaining) {
        setError(`Tối đa ${maxImages} ảnh. Còn có thể thêm ${remaining} ảnh.`);
        return;
      }

      for (const file of arr) {
        if (!file.type.startsWith('image/')) {
          setError(`"${file.name}" không phải file ảnh.`);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`"${file.name}" vượt quá 5MB.`);
          return;
        }
      }

      const updated = [...newFiles, ...arr];
      setNewFiles(updated);
      onChange?.(updated, newPrimaryIndex);
    },
    [newFiles, newPrimaryIndex, totalCount, maxImages, onChange]
  );

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      validateAndAdd(e.dataTransfer.files);
    },
    [validateAndAdd]
  );

  // ── Remove existing ───────────────────────────────────────────────────────
  const removeExisting = (id: number) => {
    setDeletedIds((prev) => [...prev, id]);
  };

  // ── Remove new file ───────────────────────────────────────────────────────
  const removeNew = (index: number) => {
    const updated = newFiles.filter((_, i) => i !== index);
    const newPrimary = newPrimaryIndex >= updated.length ? 0 : newPrimaryIndex;
    setNewFiles(updated);
    setNewPrimaryIndex(newPrimary);
    onChange?.(updated, newPrimary);
  };

  // ── Set primary (new files only — existing primary handled by API) ─────────
  const setPrimary = (index: number) => {
    setNewPrimaryIndex(index);
    onChange?.(newFiles, index);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {totalCount < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('image-input')?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <Upload className="mx-auto mb-2 text-gray-400" size={32} />
          <p className="text-sm text-gray-600">
            Kéo thả ảnh vào đây, hoặc{' '}
            <span className="text-blue-600 font-medium">chọn file</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PNG, JPG, WebP — tối đa 5MB mỗi ảnh ({totalCount}/{maxImages})
          </p>
          <input
            id="image-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && validateAndAdd(e.target.files)}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
      )}

      {/* Preview grid */}
      {(activeExisting.length > 0 || newFiles.length > 0) && (
        <div className="grid grid-cols-4 gap-3">
          {/* Existing images */}
          {activeExisting.map((img) => (
            <div key={img.id} className="relative group aspect-square">
              <img
                src={img.image_path}
                alt="product"
                className="w-full h-full object-cover rounded-lg border"
              />
              {img.is_primary && (
                <span className="absolute top-1 left-1 bg-yellow-400 text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                  <Star size={10} fill="currentColor" /> Chính
                </span>
              )}
              <button
                type="button"
                onClick={() => removeExisting(img.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* New files preview */}
          {newFiles.map((file, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className={`w-full h-full object-cover rounded-lg border-2 ${
                  index === newPrimaryIndex ? 'border-yellow-400' : 'border-gray-200'
                }`}
              />
              {/* Set primary button */}
              <button
                type="button"
                onClick={() => setPrimary(index)}
                title="Đặt làm ảnh chính"
                className={`absolute top-1 left-1 rounded-full p-0.5 transition-opacity ${
                  index === newPrimaryIndex
                    ? 'bg-yellow-400 text-white opacity-100'
                    : 'bg-white text-gray-400 opacity-0 group-hover:opacity-100'
                }`}
              >
                <Star size={12} fill={index === newPrimaryIndex ? 'white' : 'none'} />
              </button>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeNew(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              {index === newPrimaryIndex && activeExisting.length === 0 && (
                <span className="absolute bottom-1 left-1 bg-yellow-400 text-xs px-1.5 py-0.5 rounded font-medium">
                  Chính
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helper: build FormData để submit ────────────────────────────────────────
// Dùng trong ProductForm khi submit:
//
// const formData = buildProductFormData(formValues, imageFiles, primaryIndex);
// await fetch('/api/products', { method: 'POST', body: formData });
// ⚠️  KHÔNG set Content-Type header — để browser tự set với boundary
//
export function buildProductFormData(
  fields: Record<string, string | number | boolean | null>,
  imageFiles: File[],
  primaryIndex: number
): FormData {
  const fd = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined) {
      fd.append(key, String(value));
    }
  }

  imageFiles.forEach((file, i) => {
    fd.append('images[]', file);
    if (i === primaryIndex) {
      fd.append('primary_image_index', String(i));
    }
  });

  return fd;
}
