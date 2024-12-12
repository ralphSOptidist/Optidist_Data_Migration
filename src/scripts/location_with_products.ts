import { sourceDatabase, targetDatabase } from "../data-source";
import { generateUUID } from "../utils/generateUUID";
import { region_bulgaria } from "../utils/regionBulgaria";
import { writeErrorToFile } from "../utils/writeErrors";

export async function insertProductsWithRegion() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const old_stores = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("store", "store")
    .getRawMany();

  const old_store_ids = old_stores.map((store) => store.id);

  const stores = await queryRunner2.manager
    .createQueryBuilder()
    .select("*")
    .from("store", "store")
    .where("store.id IN(:...ids)", { ids: old_store_ids })
    .getRawMany();

  try {
    await Promise.all(
      stores?.map(async (st) => {
        try {
          let regionId;
          try {
            const region = await queryRunner2.manager
              .createQueryBuilder()
              .insert()
              .into("public.region")
              .values({
                id: "reg_" + generateUUID(),
                name: "Bulgaria",
                currency_code: "bgn",
                store_id: st.id,
                tax_rate: 0,
                coverage: region_bulgaria,
              })
              .returning(["id"])
              .execute();

            regionId = region.generatedMaps[0].id;
          } catch (err) {
            writeErrorToFile(
              `Error inserting region for store ${st.id}: ${err}`
            );
            console.error("Error inserting region:", err);
            return;
          }

          let stockLocationId;
          try {
            const stock_location = await queryRunner2.manager
              .createQueryBuilder()
              .insert()
              .into("public.stock_location")
              .values({
                id: "sloc_" + generateUUID(),
                name: "Bulgaria",
                region_id: regionId,
                store_id: st.id,
              })
              .returning(["id"])
              .execute();

            stockLocationId = stock_location.generatedMaps[0].id;
          } catch (err) {
            writeErrorToFile(
              `Error inserting stock location for store ${st.id}: ${err}`
            );
            console.error("Error inserting stock location:", err);
            return;
          }

          let products;
          try {
            products = await queryRunner2.manager
              .createQueryBuilder()
              .select("*")
              .from("product", "product")
              .leftJoinAndSelect("product.variants", "variants")
              .where("product.store_id = :store_id", { store_id: st.id })
              .getRawMany();
          } catch (err) {
            writeErrorToFile(
              `Error fetching products for store ${st.id}: ${err}`
            );
            console.error("Error fetching products:", err);
            return;
          }

          for (const prod of products) {
            for (const variant of prod?.variants || []) {
              let inventoryItemId;
              try {
                const inventory_item = await queryRunner2.manager
                  .createQueryBuilder()
                  .insert()
                  .into("public.inventory_item")
                  .values({
                    id: "iitem_" + generateUUID(),
                    sku: variant.sku,
                    origin_country: variant.origin_country,
                    hs_code: variant.hs_code,
                    mid_code: variant.mid_code,
                    material: variant.material,
                    weight: variant.weight,
                    length: variant.length,
                    height: variant.height,
                    width: variant.width,
                    requires_shipping: true,
                    metadata: null,
                    title: null,
                    description: null,
                    thumbnail: null,
                  })
                  .returning(["id"])
                  .execute();

                inventoryItemId = inventory_item.generatedMaps[0].id;
              } catch (err) {
                writeErrorToFile(
                  `Error inserting inventory item for variant ${variant.id}: ${err}`
                );
                console.error("Error inserting inventory item:", err);
                continue;
              }

              try {
                await queryRunner2.manager
                  .createQueryBuilder()
                  .insert()
                  .into("public.inventory_level")
                  .values({
                    id: "ilev_" + generateUUID(),
                    inventory_item_id: inventoryItemId,
                    location_id: stockLocationId,
                    stocked_quantity: variant.inventory_quantity,
                    reserved_quantity: 0,
                    incoming_quantity: 0,
                    metadata: null,
                  })
                  .returning(["id"])
                  .execute();
              } catch (err) {
                writeErrorToFile(
                  `Error inserting inventory level for variant ${variant.id}: ${err}`
                );
                console.error("Error inserting inventory level:", err);
                continue;
              }

              try {
                await queryRunner2.manager
                  .createQueryBuilder()
                  .insert()
                  .into("public.product_variant_inventory_item")
                  .values({
                    id: "pvitem_" + generateUUID(),
                    inventory_item_id: inventoryItemId,
                    variant_id: variant.id,
                    required_quantity: variant.minimum_order_qty,
                  })
                  .returning(["id"])
                  .execute();
              } catch (err) {
                writeErrorToFile(
                  `Error inserting product variant inventory item for variant ${variant.id}: ${err}`
                );
                console.error(
                  "Error inserting product variant inventory item:",
                  err
                );
                continue;
              }

              try {
                await queryRunner2.manager
                  .createQueryBuilder()
                  .insert()
                  .into("public.product_variant_location")
                  .values({
                    id: "pvl_" + generateUUID(),
                    variant_id: variant.id,
                    location_id: stockLocationId,
                  })
                  .returning(["id"])
                  .execute();
              } catch (err) {
                writeErrorToFile(
                  `Error inserting product variant location for variant ${variant.id}: ${err}`
                );
                console.error("Error inserting product variant location:", err);
                continue;
              }
            }
          }
        } catch (err) {
          writeErrorToFile(`Error processing store ${st.id}: ${err}`);
          console.error("Error processing store:", st.id, err);
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
