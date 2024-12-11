import { sourceDatabase, targetDatabase } from "../data-source";
import { transferImage } from "../utils/digitalOcean";
import { writeErrorToFile } from "../utils/writeErrors";

export async function insertProductImages() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const images = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("image", "image")
    .getRawMany();

  try {
    await Promise.all(
      images?.map(async (im, index) => {
        try {
          let reformatted_image = {
            id: im.id,
            url:
              process.env.TO_SPACES_URL +
              "/" +
              im.url.replaceAll("products/", ""),
            created_at: im.created_at,
            updated_at: im.updated_at,
            deleted_at: im.deleted_at,
          };

          console.log(`Processing image ID ${im.id}...`);
          await transferImage(im.url, im.url.replaceAll("products/", ""));

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.image")
            .values(reformatted_image)
            .execute();

          console.log(`Added Image : ${index + 1}/${images.length}`);
        } catch (err) {
          writeErrorToFile(im.id + "\n" + err);
          console.error("Error processing image:", im.id, err);
          throw err;
        }
      })
    );

    let product_images = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("product_images", "product_images")
      .getRawMany();

    await Promise.all(
      product_images?.map(async (im, index) => {
        try {
          let reformatted_image = {
            product_id: im.product_id,
            image_id: im.image_id,
          };

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.product_images")
            .values(reformatted_image)
            .execute();

          console.log(
            `Added Product Image : ${index + 1}/${product_images.length}`
          );
        } catch (err) {
          writeErrorToFile(im.id + "\n" + err);
          console.error("Error processing product image:", im.id, err);
          throw err;
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
