import { sourceDatabase, targetDatabase } from "../data-source";
import { isValidURL } from "../utils/isUrl";
import { writeErrorToFile } from "../utils/writeErrors";

export async function insertAddresses() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const addresses = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("address", "address")
    .getRawMany();

  try {
    await Promise.all(
      addresses?.map(async (address, index) => {
        try {
          let reformatted_address = {
            id: address.id,
            customer_id: address.customer_id,
            company: address.company,
            first_name: address.first_name,
            last_name: address.last_name,
            address_1: address.address_1,
            address_2: address.address_2,
            city: address.city,
            country_code: address.country_code,
            province: address.province,
            postal_code: address.postal_code,
            phone: address.phone,
            coordinates: address.location,
            created_at: address.created_at,
            updated_at: address.updated_at,
            deleted_at: address.deleted_at,
            metadata: null,
          };

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.address")
            .values(reformatted_address)
            .execute();

          console.log(`Added address : ${index + 1}/${addresses.length}`);
        } catch (err) {
          writeErrorToFile(address.id + "\n" + err);
          console.error("Error processing address:", address.id, err);
          throw err;
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
