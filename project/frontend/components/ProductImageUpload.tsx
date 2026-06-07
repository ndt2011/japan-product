"use client";

import { Button, Card } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { ProductImageItem } from "@/types/api";
import { DragEvent, useCallback, useEffect, useRef, useState } from "react";

interface ProductImageUploadProps {
  productId: number;
  onPrimaryChange?: (url: string | null) => void;
}

export function ProductImageUpload({ productId, onPrimaryChange }: ProductImageUploadProps) {
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/proxy/products/${productId}/images`);
      const data = await res.json();
      if (data.success && data.data?.items) {
        setImages(data.data.items);
        const primary = data.data.items.find((img: ProductImageItem) => img.is_primary);
        onPrimaryChange?.(primary?.image_path ?? null);
      }
    } catch {
      setError("Không tải được danh sách ảnh.");
    } finally {
      setLoading(false);
    }
  }, [productId, onPrimaryChange]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setError("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP).");
      return;
    }

    setError("");
    setUploading(true);

    try {
      for (let i = 0; i < list.length; i++) {
        const formData = new FormData();
        formData.append("image", list[i]);
        formData.append("is_primary", i === 0 && images.length === 0 ? "1" : "0");

        const res = await fetch(`/api/proxy/products/${productId}/images`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(translateMessage(data.message ?? "M0001"));
          break;
        }
      }
      await loadImages();
    } catch {
      setError("Upload thất bại. Kiểm tra API backend.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  async function setPrimary(imageId: number) {
    const res = await fetch(`/api/proxy/products/${productId}/images/${imageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_primary: true }),
    });
    const data = await res.json();
    if (data.success) {
      await loadImages();
    } else {
      setError(translateMessage(data.message ?? "M0001"));
    }
  }

  async function removeImage(imageId: number) {
    if (!confirm("Xóa ảnh này?")) return;
    const res = await fetch(`/api/proxy/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      await loadImages();
    } else {
      setError(translateMessage(data.message ?? "M0001"));
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">Hình ảnh sản phẩm</h3>
        <p className="text-xs text-text-muted mt-0.5">Kéo thả hoặc chọn file (tối đa 5MB, JPEG/PNG/WebP)</p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-brand bg-brand/5" : "border-border hover:border-brand/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <p className="text-sm text-text-body">
          {uploading ? "Đang tải lên..." : "Kéo thả ảnh vào đây hoặc bấm để chọn"}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Đang tải ảnh...</p>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative rounded-xl overflow-hidden border ${
                img.is_primary ? "border-brand ring-2 ring-brand/30" : "border-border"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_path} alt="" className="w-full h-28 object-cover" />
              {img.is_primary && (
                <span className="absolute top-1 left-1 text-[10px] bg-brand text-white px-1.5 py-0.5 rounded">
                  Chính
                </span>
              )}
              <div className="flex gap-1 p-1.5 bg-surface">
                {!img.is_primary && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => setPrimary(img.id)}>
                    Đặt chính
                  </Button>
                )}
                <Button type="button" variant="danger" size="sm" onClick={() => removeImage(img.id)}>
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">Chưa có ảnh.</p>
      )}
    </Card>
  );
}
