# Catalog: Segment Enum → SegmentCategory Table + Line-Based Pricing UI

## 1. Exact Files to Touch

### Backend (Prisma + NestJS)
| Path | Action |
|------|--------|
| `apps/api/src/infra/prisma/schema.prisma` | Add model SegmentCategory; change ItemSegmentServicePrice to use segmentCategoryId (FK); remove enum Segment (after migration). |
| `apps/api/src/infra/prisma/migrations/<timestamp>_segment_category_table/migration.sql` | New migration: create SegmentCategory, add segmentCategoryId to ItemSegmentServicePrice, data migration, drop segment column and enum. |
| `apps/api/src/application/ports/segment-category-repo.port.ts` | **New**: SegmentCategoryRecord, SegmentCategoryRepo (create, getByCode, getById, listAll). |
| `apps/api/src/application/ports/item-segment-service-price-repo.port.ts` | Change segment → segmentCategoryId in record and all method signatures. |
| `apps/api/src/infra/prisma/repos/prisma-segment-category-repo.ts` | **New**: Prisma impl for SegmentCategoryRepo. |
| `apps/api/src/infra/prisma/repos/prisma-item-segment-service-price-repo.ts` | Use segmentCategoryId; unique (itemId, segmentCategoryId, serviceCategoryId). |
| `apps/api/src/infra/prisma/repos/index.ts` | Export PrismaSegmentCategoryRepo. |
| `apps/api/src/infra/infra.module.ts` | Register SEGMENT_CATEGORY_REPO. |
| `apps/api/src/application/ports/index.ts` | Export segment-category-repo.port. |
| `apps/api/src/application/catalog/list-catalog-items-with-matrix.use-case.ts` | Inject SegmentCategoryRepo; return segmentCategories in result. |
| `apps/api/src/application/catalog/update-catalog-item-with-matrix.use-case.ts` | Accept segmentCategoryId in rows; backward compat: sync segment with code 'MEN' to LaundryItemPrice. |
| `apps/api/src/application/catalog/create-segment-category.use-case.ts` | **New**: create segment (code, label). |
| `apps/api/src/application/catalog/import-catalog-from-file.use-case.ts` | Resolve segment code → segmentCategoryId via SegmentCategoryRepo; upsert by segmentCategoryId. |
| `apps/api/src/api/admin/controllers/admin-catalog-matrix.controller.ts` | GET items: add segmentCategories; PUT: accept segmentCategoryId in segmentPrices; POST /admin/catalog/segments. |
| `apps/api/src/api/admin/services/admin-catalog.service.ts` | listItemsWithMatrix returns segmentCategories; updateItemWithMatrix accepts segmentCategoryId; createSegmentCategory. |
| `apps/api/src/api/admin/dto/segment-price-item.dto.ts` | Replace segment with segmentCategoryId (string). |
| `apps/api/src/api/admin/dto/create-segment-category.dto.ts` | **New**: code, label, isActive optional. |
| `scripts/seed.ts` | Seed SegmentCategory for MEN/WOMEN/KIDS/HOME_LINEN; backfill ItemSegmentServicePrice using segmentCategoryId. |

### Admin Web
| Path | Action |
|------|--------|
| `apps/admin-web/types/catalog.ts` | Add SegmentCategory; ItemSegmentServicePrice.segment → segmentCategoryId; SegmentPriceInput.segmentCategoryId; CatalogMatrixResponse.segmentCategories. |
| `apps/admin-web/hooks/useCatalog.ts` | useCatalogItemsWithMatrix response includes segmentCategories; useUpdateItemWithMatrix payload segmentCategoryId; add useCreateSegmentCategory. |
| `apps/admin-web/components/catalog/EditItemModal.tsx` | Replace grid with line-based editor: rows with Segment dropdown, Service dropdown, Cost, Active, Remove; Add price line; duplicate (segmentCategoryId+serviceCategoryId) validation; Add Segment UI. |
| `apps/admin-web/components/catalog/CatalogCard.tsx` | Group by segment using segmentCategories (segmentCategoryId → label); show "— No prices" when empty. |
| `apps/admin-web/app/(protected)/catalog/page.tsx` | Pass segmentCategories to CatalogCard and EditItemModal. |

### Shared (optional)
| Path | Action |
|------|--------|
| `packages/shared/src/enums.ts` | Remove or deprecate Segment enum (backend no longer uses it; admin can rely on API segmentCategories). |

---

## 2. UI Checklist + Acceptance Criteria

- [ ] **U1** Edit Item modal shows a **line-based** pricing table: each row = Segment (dropdown) + Service (dropdown) + Cost (₹ int) + Active toggle + Remove.
- [ ] **U2** "Add price line" adds a new empty row (segment/service blank or first option; cost blank; active ON).
- [ ] **U3** Segment dropdown is populated from `segmentCategories` (API). Service dropdown from `serviceCategories`.
- [ ] **U4** Duplicate rows (same segmentCategoryId + serviceCategoryId) show inline error and **Save is disabled** until resolved.
- [ ] **U5** Blank cost = row treated as "not set" on save (omit from payload or send as remove). Cost 0 allowed; Active OFF = persist as inactive.
- [ ] **U6** "Add Segment" UI: Code + Label + Add button; calls POST /admin/catalog/segments; on success refreshes segment list in modal without closing.
- [ ] **U7** Save sends segmentCategoryId (not segment enum) in each price line; success toast and list refresh.
- [ ] **U8** Catalog card summary still groups by segment label and service label; uses segmentCategories to resolve segmentCategoryId → label; "— No prices" when none.

---

## 3. Backend/DB Checklist + Migration Notes

### Data preservation plan
1. **Create** table `SegmentCategory` (id, code unique, label, isActive, createdAt).
2. **Insert** four rows: MEN, WOMEN, KIDS, HOME_LINEN (with labels).
3. **Add** column `ItemSegmentServicePrice.segmentCategoryId` (nullable FK to SegmentCategory).
4. **Data migration**: UPDATE ItemSegmentServicePrice SET segmentCategoryId = (id of SegmentCategory where code = segment).
5. **Drop** unique constraint on (itemId, segment, serviceCategoryId); **add** unique (itemId, segmentCategoryId, serviceCategoryId).
6. **Make** segmentCategoryId NOT NULL; **drop** column segment.
7. **Drop** enum Segment (if no other references; confirm Order/others don’t use it).
8. **Seed**: Ensure SegmentCategory rows exist; seed script uses segmentCategoryId for ItemSegmentServicePrice.

### Backward compatibility
- **LaundryItemPrice sync**: In update-catalog-item-with-matrix, find SegmentCategory with code 'MEN'; for rows with that segmentCategoryId, sync to LaundryItemPrice as today (by service category code → ServiceType). No change to order/invoice logic.

### Endpoints
- **GET /admin/catalog/items**: Response adds `segmentCategories: Array<{ id, code, label, isActive, createdAt }>`.
- **PUT /admin/catalog/items/:id**: Body segmentPrices[].segment → segmentPrices[].segmentCategoryId (string UUID).
- **POST /admin/catalog/segments**: Body { code, label, isActive? }; returns created SegmentCategory.

---

## 4. Step-by-Step Implementation Plan (Order)

1. **Prisma**: Add SegmentCategory model; add segmentCategoryId to ItemSegmentServicePrice; keep segment temporarily for migration.
2. **Migration SQL**: Create SegmentCategory; insert MEN/WOMEN/KIDS/HOME_LINEN; add segmentCategoryId; data migration; drop segment column; new unique; drop enum Segment.
3. **Ports**: Add SegmentCategoryRepo; update ItemSegmentServicePriceRepo to use segmentCategoryId.
4. **Repos**: Implement PrismaSegmentCategoryRepo; update PrismaItemSegmentServicePriceRepo (segmentCategoryId, new unique).
5. **Use cases**: list-catalog-items-with-matrix returns segmentCategories; update-catalog-item-with-matrix takes segmentCategoryId, sync MEN by segmentCategory code; create-segment-category; import resolves segment code → segmentCategoryId.
6. **Admin API**: DTOs (segmentCategoryId in segment price item; create-segment DTO); controller GET/PUT/POST segments; service methods.
7. **Seed**: SegmentCategory seed; ItemSegmentServicePrice backfill by segmentCategoryId.
8. **Admin types**: SegmentCategory; segmentCategoryId in price types; CatalogMatrixResponse.segmentCategories.
9. **Hooks**: useCatalogItemsWithMatrix includes segmentCategories; useUpdateItemWithMatrix segmentCategoryId; useCreateSegmentCategory.
10. **EditItemModal**: Line-based editor; dropdowns; add line; add segment; duplicate validation; save payload.
11. **CatalogCard**: Group by segmentCategoryId using segmentCategories for label; "— No prices".
12. **Catalog page**: Pass segmentCategories to card and modal.

---

## 5. Test Plan (Manual)

1. **Backend**
   - Run migration; run seed. Verify SegmentCategory rows and ItemSegmentServicePrice rows have segmentCategoryId.
   - GET /admin/catalog/items → response includes segmentCategories and items[].segmentPrices[].segmentCategoryId.
   - POST /admin/catalog/segments with code UNISEX, label Unisex → 201 and segment list includes it.
   - PUT /admin/catalog/items/:id with segmentPrices using segmentCategoryId → 200; verify DB rows and LaundryItemPrice sync for MEN.

2. **UI**
   - Open Catalog; open Edit on an item. See line-based rows with Segment and Service dropdowns, Cost, Active, Remove.
   - Add a price line; choose segment + service + cost; Save → success and card shows new line.
   - Add duplicate (same segment + service) → inline error, Save disabled.
   - Add Segment (e.g. UNISEX); confirm it appears in Segment dropdown; add a price line with it; Save.
   - Card view: verify matrix grouped by segment label and service label; "— No prices" when none.

3. **Backward compat**
   - For an item with MEN segment prices, confirm LaundryItemPrice rows still updated so existing order/invoice flow unchanged.
