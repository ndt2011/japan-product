"use client";

import { Badge, Button, Card, Input, PageHeader, Select, Table, Td, Th, Thead, Tr } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { AiCandidateItem, CategoryOption } from "@/types/api";
import Link from "next/link";
import { useEffect, useState } from "react";

function fmtVnd(n: number | null | undefined) {
  if (n == null) return "—";
  return `${new Intl.NumberFormat("vi-VN").format(n)}đ`;
}

export function AiCandidatesScreen() {
  const [candidates, setCandidates] = useState<AiCandidateItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [approveForm, setApproveForm] = useState({
    product_category_id: "" as number | "",
    product_name_vn: "",
    price_vnd: "" as number | "",
    description: "",
    spec: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadCandidates() {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/ai/candidates?status=PENDING");
      const data = await res.json();
      if (data.success && data.data?.items) {
        setCandidates(data.data.items);
      } else {
        setError(translateMessage(data.message ?? "M0001"));
      }
    } catch {
      setError("API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
    fetch("/api/proxy/product-categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.items) setCategories(d.data.items);
      });
  }, []);

  function openReview(candidate: AiCandidateItem) {
    setActiveId(candidate.id);
    setApproveForm({
      product_category_id: candidate.suggested_category_id ?? "",
      product_name_vn: candidate.product_name_vn ?? candidate.product_name_jp,
      price_vnd: candidate.pricing?.price_vnd ?? "",
      description: candidate.description ?? "",
      spec: candidate.spec ?? "",
    });
    setRejectReason("");
    setError("");
  }

  async function handleApprove() {
    if (!activeId || approveForm.product_category_id === "") {
      setError("Chọn danh mục trước khi duyệt.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/proxy/ai/candidates/${activeId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_category_id: Number(approveForm.product_category_id),
          product_name_vn: approveForm.product_name_vn,
          price_vnd: approveForm.price_vnd !== "" ? Number(approveForm.price_vnd) : undefined,
          description: approveForm.description || undefined,
          spec: approveForm.spec || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }
      setActiveId(null);
      await loadCandidates();
    } catch {
      setError("Không duyệt được sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!activeId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/proxy/ai/candidates/${activeId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }
      setActiveId(null);
      await loadCandidates();
    } catch {
      setError("Không từ chối được sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  const active = candidates.find((c) => c.id === activeId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Duyệt Sản Phẩm AI"
        subtitle={loading ? "Đang tải..." : `${candidates.length} chờ duyệt`}
        actions={
          <Link href="/ai-center">
            <Button variant="secondary" size="sm">
              ← AI Center
            </Button>
          </Link>
        }
      />

      {error && <Card className="p-4 text-sm text-danger border-danger/30 bg-red-50">{error}</Card>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 overflow-hidden">
          <Table>
            <Thead>
              <tr>
                <Th>Tên (JP)</Th>
                <Th>Giá gốc JPY</Th>
                <Th>Giá bán gợi ý</Th>
                <Th>Nguồn</Th>
                <Th>Thao tác</Th>
              </tr>
            </Thead>
            <tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={5} className="text-center text-text-muted py-8">
                    Đang tải...
                  </Td>
                </Tr>
              ) : candidates.length === 0 ? (
                <Tr>
                  <Td colSpan={5} className="text-center text-text-muted py-8">
                    Không có sản phẩm chờ duyệt
                  </Td>
                </Tr>
              ) : (
                candidates.map((c) => (
                  <Tr key={c.id}>
                    <Td className="text-xs text-text-primary max-w-xs">
                      <p>{c.product_name_jp}</p>
                      {c.product_name_vn && <p className="text-text-muted">{c.product_name_vn}</p>}
                    </Td>
                    <Td className="text-xs">
                      {c.price_jpy != null ? `¥${c.price_jpy.toLocaleString("ja-JP")}` : "—"}
                    </Td>
                    <Td className="text-xs">{fmtVnd(c.pricing?.price_vnd)}</Td>
                    <Td className="text-xs">
                      {c.data_source === "rakuten_api" ? "Rakuten" : c.source_platform ?? "—"}
                    </Td>
                    <Td>
                      <Button size="sm" variant="outline" onClick={() => openReview(c)}>
                        Xem / Duyệt
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>

        <Card className="p-5 space-y-4 h-fit max-h-[85vh] overflow-y-auto">
          {!active ? (
            <p className="text-sm text-text-muted text-center py-8">Chọn một sản phẩm để duyệt hoặc từ chối</p>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{active.product_name_jp}</h3>
                {active.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={active.image_url}
                    alt=""
                    className="mt-3 w-full max-h-40 object-contain rounded-xl border border-border"
                  />
                )}
                {active.suggested_category_name && (
                  <Badge variant="info" className="mt-2">
                    AI gợi ý: {active.suggested_category_name}
                  </Badge>
                )}
                {active.usage_instructions && (
                  <div className="mt-3 p-3 bg-surface-muted rounded-xl">
                    <p className="text-xs font-medium text-text-primary">Cách dùng</p>
                    <p className="text-xs text-text-muted mt-1 whitespace-pre-wrap">{active.usage_instructions}</p>
                  </div>
                )}
                {active.source_url && (
                  <a
                    href={active.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand mt-2 inline-block hover:underline"
                  >
                    Link nguồn Rakuten
                  </a>
                )}
              </div>

              {active.pricing && (
                <div className="p-3 bg-brand-light/40 rounded-xl text-xs space-y-1">
                  <p>
                    <span className="text-text-muted">Giá gốc (JPY):</span>{" "}
                    <strong>¥{active.price_jpy?.toLocaleString("ja-JP") ?? "—"}</strong>
                  </p>
                  <p>
                    <span className="text-text-muted">Tỷ giá:</span> {active.pricing.exchange_rate} VND/JPY
                  </p>
                  <p>
                    <span className="text-text-muted">Markup:</span> +{active.pricing.markup_percent}%
                  </p>
                  <p className="text-text-primary">
                    Công thức: JPY × tỷ giá × 1.{active.pricing.markup_percent}
                  </p>
                </div>
              )}

              <Select
                label="Danh mục *"
                value={approveForm.product_category_id}
                onChange={(e) =>
                  setApproveForm((f) => ({
                    ...f,
                    product_category_id: e.target.value ? Number(e.target.value) : "",
                  }))
                }
                options={categories.map((c) => ({ value: c.id, label: c.category_name }))}
                placeholder="Chọn danh mục"
              />
              <Input
                label="Tên tiếng Việt"
                value={approveForm.product_name_vn}
                onChange={(e) => setApproveForm((f) => ({ ...f, product_name_vn: e.target.value }))}
              />
              <Input
                label="Quy cách"
                value={approveForm.spec}
                onChange={(e) => setApproveForm((f) => ({ ...f, spec: e.target.value }))}
              />
              <Input
                label="Giá bán VND (tự tính, có thể sửa)"
                type="number"
                min={0}
                value={approveForm.price_vnd}
                onChange={(e) =>
                  setApproveForm((f) => ({
                    ...f,
                    price_vnd: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
              <label className="block">
                <span className="text-xs text-text-muted">Mô tả / công dụng</span>
                <textarea
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-border text-sm min-h-24"
                  value={approveForm.description}
                  onChange={(e) => setApproveForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <p className="text-xs text-text-muted">
                Khi duyệt: ảnh tải về lưu theo sản phẩm; giá gốc JPY giữ trong cost_jpy.
              </p>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleApprove} disabled={saving}>
                  Duyệt & lưu catalog
                </Button>
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <Input
                  label="Lý do từ chối (≥10 ký tự)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Sản phẩm không phù hợp..."
                />
                <Button variant="danger" className="w-full" onClick={handleReject} disabled={saving || rejectReason.length < 10}>
                  Từ chối
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
