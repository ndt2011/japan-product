'use client';

/**
 * OrderStatusTabs — Filter đơn hàng theo status
 *
 * Cách dùng:
 *   <OrderStatusTabs
 *     counts={{ all: 47, PENDING: 5, CONFIRMED: 3, PROCESSING: 8, DELIVERED: 31 }}
 *     activeStatus={status}
 *     onChange={(s) => setStatus(s)}
 *   />
 */

export type OrderStatus = 'all' | 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED';

interface StatusTabsProps {
  counts?: Partial<Record<OrderStatus, number>>;
  activeStatus: OrderStatus;
  onChange: (status: OrderStatus) => void;
}

const TABS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'all',        label: 'Tất cả',        color: 'gray' },
  { value: 'DRAFT',      label: 'Nháp',           color: 'slate' },
  { value: 'PENDING',    label: 'Chờ xác nhận',   color: 'yellow' },
  { value: 'CONFIRMED',  label: 'Đã duyệt',       color: 'blue' },
  { value: 'PROCESSING', label: 'Đang xử lý',     color: 'purple' },
  { value: 'DELIVERED',  label: 'Đã giao',        color: 'green' },
  { value: 'CANCELLED',  label: 'Đã hủy',         color: 'red' },
];

const COLOR_MAP: Record<string, { active: string; badge: string }> = {
  gray:   { active: 'border-gray-600 text-gray-700',     badge: 'bg-gray-100 text-gray-600' },
  slate:  { active: 'border-slate-500 text-slate-700',   badge: 'bg-slate-100 text-slate-600' },
  yellow: { active: 'border-yellow-500 text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  blue:   { active: 'border-blue-500 text-blue-700',     badge: 'bg-blue-100 text-blue-700' },
  purple: { active: 'border-purple-500 text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  green:  { active: 'border-green-500 text-green-700',   badge: 'bg-green-100 text-green-700' },
  red:    { active: 'border-red-500 text-red-700',       badge: 'bg-red-100 text-red-700' },
};

export default function OrderStatusTabs({ counts = {}, activeStatus, onChange }: StatusTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-4">
      <nav className="flex overflow-x-auto -mb-px space-x-1">
        {TABS.map((tab) => {
          const count = counts[tab.value];
          const isActive = activeStatus === tab.value;
          const colors = COLOR_MAP[tab.color];

          return (
            <button
              key={tab.value}
              onClick={() => onChange(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? `${colors.active} bg-white`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── OrderProgress — hiển thị đơn đang ở bước nào ───────────────────────────
const PROGRESS_STEPS: OrderStatus[] = ['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'DELIVERED'];

interface OrderProgressProps {
  currentStatus: OrderStatus;
}

export function OrderProgress({ currentStatus }: OrderProgressProps) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        Đơn hàng đã hủy
      </div>
    );
  }

  const currentIndex = PROGRESS_STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-0">
      {PROGRESS_STEPS.map((step, index) => {
        const isDone    = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step} className="flex items-center">
            {/* Step dot */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                isDone
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : isCurrent
                  ? 'bg-white border-blue-600 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {isDone ? '✓' : index + 1}
            </div>

            {/* Step label */}
            <span
              className={`text-xs mx-1 ${
                isDone || isCurrent ? 'text-gray-700 font-medium' : 'text-gray-400'
              }`}
            >
              {TABS.find((t) => t.value === step)?.label}
            </span>

            {/* Connector line */}
            {index < PROGRESS_STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 ${index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── StatusBadge — dùng trong bảng danh sách ────────────────────────────────
export function StatusBadge({ status }: { status: OrderStatus }) {
  const tab = TABS.find((t) => t.value === status);
  if (!tab) return null;

  const colors = COLOR_MAP[tab.color];

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.badge}`}>
      {tab.label}
    </span>
  );
}
