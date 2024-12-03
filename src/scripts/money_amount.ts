import { sourceDatabase, targetDatabase } from "../data-source";
import { generateUUID } from "../utils/generateUUID";

export async function insertProductVariantMoneyAmounts() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const money_amounts = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("money_amount", "money_amount")
    .where("money_amount.price_list_id IS NULL")
    .getRawMany();

  try {
    await Promise.all(
      money_amounts?.map(async (ma, index) => {
        try {
          let reformatted_amount = {
            id: ma.id.replaceAll("variant_", "ma_").replaceAll("pl_", "ma_"),
            currency_code: ma.currency_code,
            amount: ma.amount,
            created_at: ma.created_at,
            updated_at: ma.updated_at,
            deleted_at: ma.deleted_at,
            min_quantity: ma.min_quantity,
            max_quantity: ma.max_quantity,
          };

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.money_amount")
            .values(reformatted_amount)
            .execute();

          console.log(
            `Added money amount : ${index + 1}/${money_amounts.length}`
          );
        } catch (err) {
          console.error("Error processing money amount:", ma.id, err);
          throw err;
        }
      })
    );

    await Promise.all(
      money_amounts?.map(async (ma, index) => {
        try {
          let reformatted_variant_amount = {
            id: "pvma__" + generateUUID(),
            money_amount_id: ma.id
              .replaceAll("variant_", "ma_")
              .replaceAll("pl_", "ma_"),
            variant_id: ma.variant_id,
            deleted_at: ma.deleted_at,
            created_at: ma.created_at,
            updated_at: ma.updated_at,
          };

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.product_variant_money_amount")
            .values(reformatted_variant_amount)
            .execute();

          console.log(
            `Added variant X money amount : ${index + 1}/${
              money_amounts.length
            }`
          );
        } catch (err) {
          console.error("Error processing variant X money amount:", ma.id, err);
          throw err;
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
