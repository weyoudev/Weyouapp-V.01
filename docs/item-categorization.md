# Item categorization and pricing

This doc describes how laundry items are categorized and priced, aligned with the customer-facing UI (tabs: Wash & Fold, Steam Ironing, Dry Cleaning, Home Linen, Shoes, Add ons).

## Main categories

| Category        | Pricing model              | Sub-categories / notes                                      |
|----------------|----------------------------|--------------------------------------------------------------|
| **Wash & Fold** | By **weight (Kg)**         | Optional sub-type: Wash & Fold vs Wash & Iron (both by Kg). |
| **Wash & Iron** | By **weight (Kg)**         | Same as above.                                               |
| **Steam Ironing** | **Per item**             | Products grouped by **Men**, **Women**, **Kids**.            |
| **Dry Cleaning** | **Per item**             | Products grouped by **Men**, **Women**, **Kids**.            |
| **Home Linen**  | Per item                   | Can be **added to any order** (optional add-on category).     |
| **Shoes**       | Per item                   | Can be **added to any order** (optional add-on category).    |
| **Add ons**     | Per item (e.g. Starch, Stain removal) | Can be **added to any item** (optional).              |

## Rules

- **Wash & Fold** and **Wash & Iron** are calculated in **Kgs**. Order-level `estimatedWeightKg` / `actualWeightKg` drive pricing; catalog may show price per Kg.
- **Steam Iron** and **Dry Clean** have **multiple products** per segment: **Men**, **Women**, **Kids**. Each product has its own per-item price.
- **Home Linen**, **Shoes**, and **Add ons** can be **added to any item** (customer can attach them to a main order). They are optional add-on categories.

## Mapping to code

- **ServiceType** (enum): `WASH_FOLD`, `WASH_IRON`, `STEAM_IRON`, `DRY_CLEAN`, `HOME_LINEN`, `SHOES`, `ADD_ONS`.
- **Weight-based** (WASH_FOLD, WASH_IRON): use `Order.estimatedWeightKg` / `actualWeightKg`; invoice lines may be “per Kg” or a single service line.
- **Per-item** (STEAM_IRON, DRY_CLEAN, HOME_LINEN, SHOES, ADD_ONS): catalog items have a price per `ServiceType`; order/invoice lines are per item with quantity.
- **Men / Women / Kids**: can be represented as item naming (e.g. “SHIRT (Men)”), or a future `itemCategory` / variant field on items.
- **Add-ons attached to any item**: `InvoiceItemType.ADDON`; line items can reference the main item or stand as additional charges.
