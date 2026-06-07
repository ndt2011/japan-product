"use client";

import { Badge, Button, Card, Input, PageHeader, Select, Table, Td, Th, Thead, Tr } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { AiCandidateItem, CategoryOption } from "@/types/api";
import Link from "next/link";
import { useEffect, useState } from "react";

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
      product_category_id: "",
      product_name_vn: candidate.product_name_jp,
      price_vnd: "",
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
                <Th>Giá JPY</Th>
                <Th>Nguồn</Th>
                <Th>Trạng thái</Th>
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
                    <Td className="text-xs text-text-primary max-w-xs">{c.product_name_jp}</Td>
                    <Td className="text-xs">
                      {c.price_jpy != null ? `¥${c.price_jpy.toLocaleString("ja-JP")}` : "—"}
                    </Td>
                    <Td className="text-xs">{c.source_platform ?? "—"}</Td>
                    <Td>
                      <Badge variant="warning">Chờ duyệt</Badge>
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

        <Card className="p-5 space-y-4 h-fit">
          {!active ? (
            <p className="text-sm text-text-muted text-center py-8">Chọn một sản phẩm để duyệt hoặc từ chối</p>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{active.product_name_jp}</h3>
                {active.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={active.image_url} alt="" className="mt-3 w-full max-h-40 object-contain rounded-xl border border-border" />
                )}
                {active.description && (
                  <p className="text-xs text-text-muted mt-2">{active.description}</p>
                )}
                {active.source_url && (
                  <a href={active.source_url} target="_blank" rel="noreferrer" className="text-xs text-brand mt-2 inline-block hover:underline">
                    Link nguồn
                  </a>
                )}
              </div>

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
                label="Giá bán VND"
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

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleApprove} disabled={saving}>
                  Duyệt
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
