# Backend expansion plan — invoice workflow, subscriptions, CMS, analytics

## 1) Prisma schema changes (summary)

### Enums
- **InvoiceType** (new): `ACKNOWLEDGEMENT` | `FINAL`
- **InvoiceStatus** (replace): `DRAFT` | `ISSUED` | `VOID` (remove FINAL; FINAL is a type)
- **SubscriptionVariant** (new): `SINGLE` | `COUPLE` | `FAMILY`
- **PaymentProvider**: add `UPI` (keep RAZORPAY, CASH, NONE)

### Models changed
- **User**: add `name String?`, `notes String?`
- **Invoice**: add `type InvoiceType`, `issuedAt DateTime?`, `discountPaise Int?`; change `status` to new enum; **unique (orderId, type)** so one ACK + one FINAL per order
- **SubscriptionPlan**: add `variant SubscriptionVariant`, rename `totalPickups` → `maxPickups`, add `itemsLimit Int?`, add `pricePaise Int`; keep `kgLimit`, `minKgPerPickup`, `applicableServiceTypes`, `active`
- **Subscription**: add `usedKg Decimal @default(0)`, `usedItemsCount Int @default(0)`; keep `remainingPickups`, `expiryDate`, `active`
- **SubscriptionUsage**: add `deductedKg Decimal @default(0)`, `deductedItemsCount Int @default(0)`
- **BrandingSettings**: add `upiId String?`, `upiPayeeName String?`, `upiLink String?`, `upiQrUrl String?`; allow fixed id `branding-default`

### Models new
- **LaundryItem**: id, name (unique), active, createdAt, updatedAt
- **LaundryItemPrice**: id, itemId (fk), serviceType, unitPricePaise, active; unique (itemId, serviceType)
- **OrderItem**: id, orderId (fk), laundryItemId (fk nullable), serviceType, quantity, estimatedWeightKg?, actualWeightKg?, unitPricePaise?, amountPaise?, notes?

### Order ↔ Invoice
- One order can have multiple invoices: one ACK and one FINAL. So **Order** has one-to-many to Invoice (remove current 1:1). Schema: `Invoice.orderId` non-unique, unique `(orderId, type)`.

### Payment / Order
- Keep Payment.orderId unique. When Payment.status → CAPTURED, update Order.paymentStatus (application logic).

---

## 2) Confirmed API endpoint list

### Admin CMS (ADMIN / BILLING)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/admin/branding | Get branding |
| PUT | /api/admin/branding | Update branding |
| POST | /api/admin/branding/logo | Upload logo (multipart) |
| POST | /api/admin/branding/upi-qr | Upload UPI QR or generate from upiId |
| GET | /api/assets/branding/:fileName | Stream branding asset |

### Service areas (ADMIN)
| GET | /api/admin/service-areas | List |
| POST | /api/admin/service-areas | Create |
| PATCH | /api/admin/service-areas/:pincode | Update active |

### Serviceability (public/customer)
| GET | /api/serviceability?pincode=XXXXX | { serviceable, message } |

### Laundry items
| GET | /api/admin/items | Admin list |
| POST | /api/admin/items | Create |
| PATCH | /api/admin/items/:id | Update |
| PUT | /api/admin/items/:id/prices | Set prices by service type |
| GET | /api/items?serviceType=... | Customer catalog (active) |

### Subscription plans
| GET | /api/admin/subscription-plans | Admin list |
| POST | /api/admin/subscription-plans | Create |
| PATCH | /api/admin/subscription-plans/:id | Update |
| GET | /api/subscription-plans | Customer list (active only) |

### Orders
| GET | /api/admin/orders?status=&pincode=&... | Admin list with filters |
| GET | /api/admin/orders/:id | Admin order detail |
| (existing) | /api/orders, /api/orders/:id, PATCH status | Customer + status |

### Invoices (ACK + FINAL)
| POST | /api/admin/orders/:id/ack-invoice/draft | Draft ACK |
| POST | /api/admin/orders/:id/ack-invoice/issue | Issue ACK (after PICKED_UP) |
| POST | /api/admin/orders/:id/final-invoice/draft | Draft FINAL |
| POST | /api/admin/orders/:id/final-invoice/issue | Issue FINAL (only if DELIVERED) |
| GET | /api/admin/invoices/:id/pdf | Stream PDF (admin) |
| GET | /api/orders/:id/invoices | Customer list invoices for order |
| GET | /api/invoices/:id/pdf | Stream PDF (owner only) |

### Payments
| PATCH | /api/admin/orders/:id/payment | Update payment status/amount |

### Analytics
| GET | /api/admin/analytics/revenue?preset=... or dateFrom&dateTo | Billed + collected revenue |

### Customer admin
| GET | /api/admin/customers/search?phone= | Search by phone |
| GET | /api/admin/customers/:userId | Profile + orders/invoices/payments/subscriptions |
| PATCH | /api/admin/customers/:userId | Update profile + notes (ADMIN) |
| PATCH | /api/admin/customers/:userId/subscription | Activate/deactivate/adjust (ADMIN) |

---

## 3) Implementation order
1. Migration + seed
2. AppError codes + HTTP mapping
3. Tests (ACK/FINAL rules, payment, subscription limits, analytics presets)
4. Ports + use-cases (application)
5. Infra repos (Prisma)
6. Controllers + DTOs + guards
7. Postman + smoke test + docs
