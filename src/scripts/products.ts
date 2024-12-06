import { sourceDatabase, targetDatabase } from "../data-source";
import { isValidURL } from "../utils/isUrl";
import { writeErrorToFile } from "../utils/writeErrors";

export async function insertProducts() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const products = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("product", "product")
    .getRawMany();

  try {
    await Promise.all(
      products?.map(async (pr, index) => {
        try {
          let reformatted_product = {
            id: pr.id,
            title: pr.title,
            subtitle: pr.subtitle,
            description: pr.description,
            handle: pr.handle,
            is_giftcard: pr.is_giftcard,
            thumbnail: isValidURL(pr.thumbnail) ? pr.thumbnail : null,
            weight: pr.weight,
            length: pr.length,
            height: pr.height,
            width: pr.width,
            hs_code: pr.hs_code,
            origin_country: pr.origin_country,
            mid_code: pr.mid_code,
            material: pr.material,
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            deleted_at: pr.deleted_at,
            metadata: null,
            collection_id: pr.collection_id,
            type_id: pr?.is_bundle === true ? "bundle" : "normal",
            discountable: pr.discountable,
            status: pr.status,
            external_id: pr.external_id,
            // packaging_data: null,
            // nutritional_data:
            //   '{"nutritional_statistics":null,"ingredients":null}',
            store_id: pr.store_id,
          };

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.product")
            .values(reformatted_product)
            .execute();

          //add product to main category

          if (pr?.type_id?.length > 0)
            await queryRunner2.manager
              .createQueryBuilder()
              .insert()
              .into("public.product_category_product")
              .values({
                product_category_id: pr.type_id,
                product_id: pr.id,
              })
              .execute();

          console.log(`Added product : ${index + 1}/${products.length}`);
        } catch (err) {
          writeErrorToFile(pr.id + "\n" + err);
          console.error("Error processing product:", pr.id, err);
          throw err;
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
