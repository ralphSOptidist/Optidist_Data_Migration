import { sourceDatabase, targetDatabase } from "../data-source";
import { transferImage } from "../utils/digitalOcean";
import { isValidURL } from "../utils/isUrl";
import { writeErrorToFile } from "../utils/writeErrors";

export async function insertCollections() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const collections = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("product_collection", "product_collection")
    .getRawMany();

  try {
    await Promise.all(
      collections?.map(async (collection, index) => {
        try {
          let reformatted_collection = {
            id: collection.id,
            title: collection.title,
            created_at: collection.created_at,
            updated_at: collection.updated_at,
            deleted_at: collection.deleted_at,
            image_url:
              collection?.image?.length > 0
                ? process.env.TO_SPACES_URL +
                  "/" +
                  collection.image.replaceAll("brands/", "")
                : null,
            store_id: collection.store_id,
          };

          if (collection?.image.length > 0) {
            console.log(
              `Processing thumbnail for collection ID ${collection.id}...`
            );
            await transferImage(
              collection.image,
              collection.image.replaceAll("brands/", "")
            );
          }

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.product_collection")
            .values(reformatted_collection)
            .execute();

          console.log(`Added collection : ${index + 1}/${collections.length}`);
        } catch (err) {
          writeErrorToFile(collection.id + "\n" + err);
          console.error("Error processing collection:", collection.id, err);
          throw err;
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
