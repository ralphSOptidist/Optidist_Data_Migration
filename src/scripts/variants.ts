import { sourceDatabase, targetDatabase } from "../data-source";

export async function insertProductVariants() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const product_variants = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("product_variant", "product_variant")
    .getRawMany();

  try {
    await Promise.all(
      product_variants?.map(async (va, index) => {
        try {
          let reformatted_variant = {
            id: va.id,
            title: va.title,
            product_id: va.product_id,
            sku: va.sku,
            barcode: va.barcode,
            ean: va.ean,
            upc: va.upc,
            inventory_quantity: va.inventory_quantity,
            allow_backorder: va.allow_backorder,
            manage_inventory: va.manage_inventory,
            hs_code: va.hs_code,
            origin_country: va.origin_country,
            mid_code: va.mid_code,
            material: va.material,
            weight: va.weight,
            length: va.length,
            height: va.height,
            width: va.width,
            created_at: va.created_at,
            updated_at: va.updated_at,
            deleted_at: va.deleted_at,
            variant_rank: va.variant_rank0,
            packaging_data:
              va?.unit ||
              va?.unit_type ||
              va?.unit_quantity ||
              va?.items_per_pack
                ? {
                    unit: va?.unit || null,
                    unit_type: va?.unit_type || null,
                    unit_quantity: va?.unit_quantity || null,
                    items_per_pack: va?.items_per_pack || null,
                  }
                : null,
            store_id: va.store_id,
            minimum_order_qty: va.minimum_order_qty,
          };

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.product_variant")
            .values(reformatted_variant)
            .execute();

          console.log(
            `Added variant : ${index + 1}/${product_variants.length}`
          );
        } catch (err) {
          console.error("Error processing variant:", va.id, err);
          throw err;
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
