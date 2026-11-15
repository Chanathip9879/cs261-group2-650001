import React, { useEffect, useState } from 'react';
import { Facebook, Info, MessageCircle, Phone } from 'lucide-react';
import { getShopById } from '../services/api';
import { formatPhone, telHref } from '../utils/shopDisplay';

export default function ShopContactCard({ shopId }) {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    getShopById(shopId)
      .then((response) => {
        if (!response?.success || !response.data) throw new Error('โหลดข้อมูลติดต่อไม่ได้');
        if (!cancelled) setShop(response.data);
      })
      .catch(() => {
        if (!cancelled) {
          setShop(null);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shopId, attempt]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl bg-surface-low p-3" aria-label="กำลังโหลดข้อมูลติดต่อ">
        <div className="mb-3 h-4 w-36 rounded bg-surface-mid" />
        <div className="space-y-2">
          <div className="h-11 rounded-lg bg-surface-mid" />
          <div className="h-11 rounded-lg bg-surface-mid" />
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="rounded-xl bg-surface-low p-3 text-center">
        <p className="text-sm text-ink-muted">โหลดข้อมูลติดต่อไม่ได้</p>
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          className="mt-2 min-h-11 rounded-lg px-3 text-sm font-semibold text-brand hover:bg-surface-mid"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  const phone = usableValue(shop?.phone);
  const lineId = usableValue(shop?.line_id);
  const facebook = usableValue(shop?.facebook);
  const otherContact = usableValue(shop?.other_contact);
  const facebookUrl = facebook && /^https?:\/\//i.test(facebook) ? facebook : null;

  return (
    <section className="rounded-xl bg-surface-low p-3 text-ink">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Info className="size-4 shrink-0 text-brand" />
        ช่องทางติดต่อร้าน
      </h2>
      {!phone && !lineId && !facebook && !otherContact ? (
        <p className="py-2 text-sm text-ink-muted">ร้านยังไม่ได้เพิ่มข้อมูลติดต่อ</p>
      ) : (
        <ul className="space-y-1">
          {phone && (
            <li>
              <a
                href={telHref(phone)}
                className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm hover:bg-surface-mid"
              >
                <Phone className="size-4 shrink-0 text-brand" />
                <span className="shrink-0 text-ink-muted">โทรศัพท์</span>
                <span className="min-w-0 break-all font-medium">{formatPhone(phone)}</span>
              </a>
            </li>
          )}
          {lineId && (
            <li>
              <a
                href={lineHref(lineId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm hover:bg-surface-mid"
              >
                <MessageCircle className="size-4 shrink-0 text-brand" />
                <span className="shrink-0 text-ink-muted">LINE</span>
                <span className="min-w-0 break-all font-medium">{lineId}</span>
              </a>
            </li>
          )}
          {facebook && (
            <li>
              {facebookUrl ? (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm hover:bg-surface-mid"
                >
                  <Facebook className="size-4 shrink-0 text-brand" />
                  <span className="shrink-0 text-ink-muted">Facebook</span>
                  <span className="min-w-0 break-all font-medium">{facebook}</span>
                </a>
              ) : (
                <div className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm">
                  <Facebook className="size-4 shrink-0 text-brand" />
                  <span className="shrink-0 text-ink-muted">Facebook</span>
                  <span className="min-w-0 break-all font-medium">{facebook}</span>
                </div>
              )}
            </li>
          )}
          {otherContact && (
            <li className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm">
              <Info className="size-4 shrink-0 text-brand" />
              <span className="shrink-0 text-ink-muted">อื่น ๆ</span>
              <span className="min-w-0 break-all font-medium">{otherContact}</span>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function usableValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function lineHref(lineId) {
  return lineId.startsWith('@')
    ? `https://line.me/R/ti/p/%40${encodeURIComponent(lineId.slice(1))}`
    : `https://line.me/ti/p/~${encodeURIComponent(lineId)}`;
}
