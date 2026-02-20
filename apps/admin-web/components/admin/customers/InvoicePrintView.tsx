'use client';

import { forwardRef } from 'react';
import { formatMoney, formatDate } from '@/lib/format';
import { getApiOrigin } from '@/lib/api';
import type { OrderAdminSummary } from '@/types';
import type { CatalogMatrixResponse } from '@/types/catalog';

type InvoiceType = 'ACK' | 'FINAL';

export interface InvoicePrintViewProps {
  summary: OrderAdminSummary;
  invoice: OrderAdminSummary['invoices'][number];
  type: InvoiceType;
  branding: {
    businessName?: string | null;
    logoUrl?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    panNumber?: string | null;
    gstNumber?: string | null;
    termsAndConditions?: string | null;
  } | null;
  /** For FINAL invoice: the ack invoice (Ref block). */
  ackInvoice?: OrderAdminSummary['invoices'][number] | null;
  catalogMatrix?: CatalogMatrixResponse | null;
  /** Subscription usage row shows Qty as "X KG" or "X Nos" when set; row index when subscription applied. */
  subscriptionUnit?: 'KG' | 'Nos';
  subscriptionUsageRowIndex?: number;
}

export const InvoicePrintView = forwardRef<HTMLDivElement, InvoicePrintViewProps>(
  function InvoicePrintView(
    { summary, invoice, type, branding, ackInvoice, catalogMatrix, subscriptionUnit, subscriptionUsageRowIndex },
    ref
  ) {
    const { order, customer, address, branch } = summary;
    const items = invoice.items ?? [];
    const useMatrix = Boolean(catalogMatrix?.items?.length);
    const taxPercent = invoice.subtotal > 0 ? Math.round((invoice.tax / invoice.subtotal) * 1000) / 10 : 0;

    function segmentLabel(id: string | null | undefined): string {
      if (!id || !catalogMatrix) return '—';
      return catalogMatrix.segmentCategories.find((s) => s.id === id)?.label ?? '—';
    }
    function serviceLabel(id: string | null | undefined): string {
      if (!id || !catalogMatrix) return '—';
      return catalogMatrix.serviceCategories.find((s) => s.id === id)?.label ?? '—';
    }

    return (
      <div ref={ref} className="bg-white text-black p-6 max-w-2xl mx-auto space-y-4 invoice-print-view">
        {/* Logo + business name + branch */}
        <div className="flex gap-4 border-b pb-4 items-start justify-start">
          <div className="flex-shrink-0 flex justify-start">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl.startsWith('http') ? branding.logoUrl : `${getApiOrigin()}${branding.logoUrl}`}
                alt="Logo"
                className="h-14 w-auto object-contain object-left"
              />
            ) : (
              <div className="h-14 w-24 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                Logo
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg">{branding?.businessName ?? 'Company'}</p>
            {branch && <p className="text-sm font-medium text-gray-600 mt-0.5">{branch.name}</p>}
          </div>
        </div>

        {/* ACK: single block with code; FINAL: Invoice number (left) | Ref Acknowledgement (right) */}
        {type === 'ACK' ? (
          invoice.code && (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <p className="font-medium mb-0.5">Acknowledge Invoice</p>
              <p className="text-gray-600 text-xs">{invoice.code}</p>
              {invoice.issuedAt && (
                <p className="text-gray-600 text-xs mt-0.5">
                  Issued: {formatDate(invoice.issuedAt)}
                  {invoice.issuedAt.includes('T') &&
                    ' ' + new Date(invoice.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          )
        ) : (
          <div className="flex flex-nowrap gap-4 items-start justify-between">
            <div className="min-w-0 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm flex-shrink">
              <p className="font-medium mb-0.5">Invoice number</p>
              <p className="text-gray-600 text-xs">{invoice.code ?? '—'}</p>
              {invoice.issuedAt && (
                <p className="text-gray-600 text-xs">
                  Issued: {formatDate(invoice.issuedAt)}
                  {invoice.issuedAt.includes('T') &&
                    ' ' + new Date(invoice.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            {ackInvoice && (
              <div className="text-right rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm shrink-0 min-w-0">
                <p className="font-medium mb-0.5">Ref Acknowledgement invoice</p>
                <p className="text-gray-600 text-xs leading-tight">
                  {ackInvoice.code && <span>Code: {ackInvoice.code}</span>}
                  {ackInvoice.subtotal != null && (
                    <span>{ackInvoice.code ? ' · ' : ''}Subtotal: {formatMoney(ackInvoice.subtotal)}</span>
                  )}
                </p>
                {ackInvoice.issuedAt && (
                  <p className="text-gray-600 text-xs leading-tight mt-0.5">
                    Issued: {formatDate(ackInvoice.issuedAt)}
                    {ackInvoice.issuedAt.includes('T') &&
                      ' ' +
                        new Date(ackInvoice.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Order details (left) | PAN, GST, Branch (right) */}
        <div className="flex flex-wrap gap-4 items-start rounded-md bg-gray-50 p-3 text-sm">
          <div className="flex-1 min-w-[200px]">
            <p className="font-medium mb-1">Order details</p>
            <p>{customer.name ?? '—'}</p>
            <p className="text-gray-600">
              {order.orderType === 'SUBSCRIPTION'
                ? `Subscription booking${summary.subscription?.planName ? ` (${summary.subscription.planName})` : ''}`
                : `Service: ${(order.serviceTypes?.length ? order.serviceTypes : [order.serviceType]).map((s) => s.replace(/_/g, ' ')).join(', ')}`}
            </p>
            <p>{address.addressLine}, {address.pincode}</p>
            <p className="text-gray-600">
              Pickup: {formatDate(order.pickupDate)} {order.timeWindow}
            </p>
          </div>
          <div className="text-right text-gray-600 space-y-0.5">
            {branding?.panNumber && <p>PAN: {branding.panNumber}</p>}
            {branding?.gstNumber && <p>GST: {branding.gstNumber}</p>}
            {branch && (
              <>
                <p className="font-medium text-gray-900">{branch.name}</p>
                <p>{branch.address}</p>
              </>
            )}
          </div>
        </div>

        {/* Subscription utilised (green box) */}
        {summary.subscriptionUsage && summary.subscription && (
          <div className="rounded-md border border-green-200 bg-green-50 p-2.5 text-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-green-700 font-medium" aria-hidden>✓</span>
              <span className="text-green-800 font-medium">{summary.subscription.planName}</span>
              <span className="text-green-800">
                {summary.subscription.remainingPickups}/{summary.subscription.maxPickups} pickups left
                {summary.subscription.kgLimit != null &&
                  ` · ${Number(summary.subscription.usedKg ?? 0)}/${summary.subscription.kgLimit} kg`}
                {summary.subscription.itemsLimit != null &&
                  ` · ${summary.subscription.usedItemsCount ?? 0}/${summary.subscription.itemsLimit} items`}
                {' · Applied'}
              </span>
            </div>
          </div>
        )}

        {/* Line items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {useMatrix ? (
                  <>
                    <th className="text-left py-2">Item</th>
                    <th className="text-left py-2">Segment</th>
                    <th className="text-left py-2">Service</th>
                  </>
                ) : (
                  <>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Name</th>
                  </>
                )}
                <th className="text-right py-2">Qty</th>
                {useMatrix ? (
                  <>
                    <th className="text-right py-2">Service cost (₹)</th>
                    <th className="text-right py-2">Total cost (₹)</th>
                  </>
                ) : (
                  <>
                    <th className="text-right py-2">Unit (₹)</th>
                    <th className="text-right py-2">Amount (₹)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr className="border-b">
                  <td
                    colSpan={useMatrix ? 6 : 5}
                    className="py-3 text-center text-gray-500"
                  >
                    NA
                  </td>
                </tr>
              ) : (
                items.map((row, i) => {
                  const isSubUsageRow = subscriptionUsageRowIndex === i && subscriptionUnit;
                  const qtyDisplay = isSubUsageRow
                    ? `${row.quantity} ${subscriptionUnit}`
                    : String(row.quantity);
                  return (
                    <tr key={i} className="border-b border-gray-200">
                      {useMatrix ? (
                        <>
                          <td className="py-1.5">{row.name}</td>
                          <td className="py-1.5">{segmentLabel(row.segmentCategoryId)}</td>
                          <td className="py-1.5">{serviceLabel(row.serviceCategoryId)}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-1.5">{row.type}</td>
                          <td className="py-1.5">{row.name}</td>
                        </>
                      )}
                      <td className="text-right py-1.5">{qtyDisplay}</td>
                      {useMatrix ? (
                        <>
                          <td className="text-right py-1.5">{formatMoney(row.unitPrice)}</td>
                          <td className="text-right py-1.5">{formatMoney(row.amount)}</td>
                        </>
                      ) : (
                        <>
                          <td className="text-right py-1.5">{formatMoney(row.unitPrice)}</td>
                          <td className="text-right py-1.5">{formatMoney(row.amount)}</td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t space-y-1 text-right">
          <p className="text-base">
            Subtotal: {formatMoney(invoice.subtotal)}
            {taxPercent > 0 && (
              <> · Tax ({taxPercent}%): {formatMoney(invoice.tax)}</>
            )}
            {invoice.discountPaise != null && invoice.discountPaise > 0 && (
              <> · Discount (₹): -{formatMoney(invoice.discountPaise)}</>
            )}
          </p>
          <p className="text-2xl font-bold">
            {(() => {
              const subscriptionBased =
                invoice.orderMode === 'SUBSCRIPTION_ONLY' ||
                invoice.orderMode === 'BOTH' ||
                order.orderType === 'SUBSCRIPTION' ||
                order.orderType === 'BOTH';
              return invoice.total <= 0 && subscriptionBased
                ? 'Prepaid'
                : `Total: ${formatMoney(invoice.total)}`;
            })()}
          </p>
        </div>

        {/* Comments */}
        {invoice.comments && (
          <p className="text-sm text-gray-600 pt-2 border-t">{invoice.comments}</p>
        )}

        {/* Terms and Conditions */}
        {branding?.termsAndConditions?.trim() && (
          <div className="mt-4 pt-4 border-t text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700">Terms and Conditions</p>
            <div className="whitespace-pre-line">{branding.termsAndConditions.trim()}</div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 text-center text-sm text-gray-600 space-y-1">
          <p>
            {[branch?.address ?? branding?.address ?? '', branding?.email ?? '', branding?.phone ?? '']
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>
    );
  }
);
