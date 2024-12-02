import { sourceDatabase, targetDatabase } from "../data-source";

export async function insertSubCategoriesWithProducts() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  //fetch available sub categories
  const available_tags = await queryRunner2.manager
    .createQueryBuilder()
    .select("*")
    .from("product_category", "product_category")
    .where("product_category.parent_category_id IS NOT NULL")
    .getRawMany();

  const available_tags_ids = available_tags.map((tag) => tag.id);

  //sub categories
  const tags = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("product_tags", "product_tags")
    .where("product_tags.product_tag_id IN (:...ids)", {
      ids: available_tags_ids,
    })
    .getRawMany();

  try {
    await Promise.all(
      tags?.map(async (tag, index) => {
        try {
          let reformatted_sub_category = {
            product_category_id: tag.product_tag_id,
            product_id: tag.product_id,
          };

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.product_category_product")
            .values(reformatted_sub_category)
            .execute();

          console.log(
            `Added product to sub category : ${index + 1}/${tags.length}`
          );
        } catch (err) {
          console.error(
            "Error processing product to sub category:",
            tag.id,
            err
          );
          throw err;
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
