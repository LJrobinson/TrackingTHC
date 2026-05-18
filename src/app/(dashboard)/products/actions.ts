"use server";

import { ProductCategory, ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { recordAuditEvent } from "@/server/audit/audit.service";
import { getOperationalContext } from "@/server/core/context";
import { assertPermission } from "@/server/auth/permissions";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getProductCategory(value: string) {
  if (Object.values(ProductCategory).includes(value as ProductCategory)) {
    return value as ProductCategory;
  }

  throw new Error("Select a valid product category.");
}

function getProductStatus(value: string) {
  if (Object.values(ProductStatus).includes(value as ProductStatus)) {
    return value as ProductStatus;
  }

  throw new Error("Select a valid product status.");
}

function getPriceCents(value: string) {
  if (!value) {
    throw new Error("Default price is required.");
  }

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Enter a valid default price.");
  }

  return Math.round(price * 100);
}

function productSnapshot(product: {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  unitOfMeasure: string;
  priceCents: number;
  status: ProductStatus;
}) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    unitOfMeasure: product.unitOfMeasure,
    priceCents: product.priceCents,
    status: product.status
  };
}

export async function createProduct(formData: FormData) {
  await assertPermission("catalog:write");

  const context = await getOperationalContext();
  const name = getText(formData, "name");
  const sku = getText(formData, "sku");
  const unitOfMeasure = getText(formData, "unitOfMeasure") || "each";

  if (!name || !sku) {
    throw new Error("Product name and SKU are required.");
  }

  if (!unitOfMeasure) {
    throw new Error("Unit is required.");
  }

  const existingProduct = await prisma.product.findUnique({
    where: {
      organizationId_sku: {
        organizationId: context.organizationId,
        sku
      }
    }
  });

  if (existingProduct) {
    throw new Error("A product with this SKU already exists.");
  }

  const product = await prisma.product.create({
    data: {
      organizationId: context.organizationId,
      facilityId: context.facilityId,
      name,
      sku,
      category: getProductCategory(getText(formData, "category")),
      unitOfMeasure,
      priceCents: getPriceCents(getText(formData, "price")),
      status: ProductStatus.ACTIVE
    }
  });

  await recordAuditEvent({
    organizationId: context.organizationId,
    facilityId: context.facilityId,
    actorUserId: context.actorUserId,
    action: "product.created",
    entityType: "Product",
    entityId: product.id,
    after: productSnapshot(product)
  });

  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function updateProduct(formData: FormData) {
  await assertPermission("catalog:write");

  const context = await getOperationalContext();
  const id = getText(formData, "productId");
  const before = await prisma.product.findUniqueOrThrow({ where: { id } });
  const name = getText(formData, "name");
  const sku = getText(formData, "sku");
  const unitOfMeasure = getText(formData, "unitOfMeasure") || "each";

  if (!name || !sku) {
    throw new Error("Product name and SKU are required.");
  }

  const existingProduct = await prisma.product.findUnique({
    where: {
      organizationId_sku: {
        organizationId: context.organizationId,
        sku
      }
    }
  });

  if (existingProduct && existingProduct.id !== id) {
    throw new Error("A different product already uses this SKU.");
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      sku,
      category: getProductCategory(getText(formData, "category")),
      unitOfMeasure,
      priceCents: getPriceCents(getText(formData, "price")),
      status: getProductStatus(getText(formData, "status"))
    }
  });

  await recordAuditEvent({
    organizationId: context.organizationId,
    facilityId: context.facilityId,
    actorUserId: context.actorUserId,
    action: "product.updated",
    entityType: "Product",
    entityId: product.id,
    before: productSnapshot(before),
    after: productSnapshot(product)
  });

  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function archiveProduct(formData: FormData) {
  await assertPermission("catalog:write");

  const context = await getOperationalContext();
  const id = getText(formData, "productId");
  const before = await prisma.product.findUniqueOrThrow({ where: { id } });
  const product = await prisma.product.update({
    where: { id },
    data: { status: ProductStatus.ARCHIVED }
  });

  await recordAuditEvent({
    organizationId: context.organizationId,
    facilityId: context.facilityId,
    actorUserId: context.actorUserId,
    action: "product.archived",
    entityType: "Product",
    entityId: product.id,
    before: productSnapshot(before),
    after: productSnapshot(product)
  });

  revalidatePath("/products");
  revalidatePath("/dashboard");
}
