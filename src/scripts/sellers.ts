import { sourceDatabase, targetDatabase } from "../data-source";
import { generateUUID } from "../utils/generateUUID";

export async function insertUsersAndStores() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const businesses = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("business_information", "business_information")
    .where("business_information.user_id IS NOT NULL")
    .getRawMany();

  const stores = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("store", "store")
    .getRawMany();

  const users = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("user", "user")
    .getRawMany();

  await Promise.all(
    users?.map(async (u) => {
      try {
        let store_id = u.store_id;

        let count = await queryRunner2.manager
          .createQueryBuilder()
          .from("store", "store")
          .where("store.id = :id", { id: store_id })
          .getRawOne();

        if (!count) {
          let business = businesses.find((bus) => bus.user_id === u.id);
          console.log(business);
          if (business) {
            let store = stores.find((st) => st.id === u.store_id);
            let country = await queryRunner.manager
              .createQueryBuilder()
              .select("*")
              .from("country", "c")
              .where("c.id = :id", { id: business.country })
              .getRawOne();

            let reformatted_store = {
              id: u.store_id,
              name: store.name,
              default_currency_code: store.default_currency_code,
              swap_link_template: store.swap_link_template,
              created_at: store.created_at,
              updated_at: store.updated_at,
              metadata: store.metadata,
              payment_link_template: store.payment_link_template,
              invite_link_template: store.invite_link_template,
              default_location_id: store.default_location_id,
              industries: JSON.stringify(business.industries),
              tax_number: business.tax_number,
              bin: business.bin,
              country_code: country.iso_2,
              verified_at: new Date(),
              legal_name: null,
              image: store.image ? JSON.stringify({ name: store.image }) : null,
            };

            await queryRunner2.manager
              .createQueryBuilder()
              .insert()
              .into("store")
              .values(reformatted_store)
              .execute();

            console.log("store: ", store);

            // await targetDatabase.query(
            //   `
            //     INSERT INTO store (
            //       id, name, default_currency_code, swap_link_template, created_at,
            //       updated_at, metadata, payment_link_template, invite_link_template,
            //       default_location_id, industries, tax_number, bin, country_code,
            //       verified_at, legal_name, image
            //     )
            //     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            //   `,
            //   [
            //     reformatted_store.id,
            //     reformatted_store.name,
            //     reformatted_store.default_currency_code,
            //     reformatted_store.swap_link_template,
            //     reformatted_store.created_at,
            //     reformatted_store.updated_at,
            //     reformatted_store.metadata,
            //     reformatted_store.payment_link_template,
            //     reformatted_store.invite_link_template,
            //     reformatted_store.default_location_id,
            //     reformatted_store.industries,
            //     reformatted_store.tax_number,
            //     reformatted_store.bin,
            //     reformatted_store.country_code,
            //     reformatted_store.verified_at,
            //     reformatted_store.legal_name,
            //     reformatted_store.image,
            //   ]
            // );
          }
        }
      } catch (e) {
        console.error("Error: ", e);
      }
    })
  );

  await Promise.all(
    users?.map(async (u, index) => {
      try {
        await queryRunner2.manager
          .createQueryBuilder()
          .insert()
          .into("public.user")
          .values({
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            password_hash: u.password_hash,
            api_token: u.api_token,
            created_at: u.created_at,
            updated_at: u.updated_at,
            deleted_at: u.deleted_at,
            metadata: u.metadata,
            role: u.role || "member",
            phone: u.phone || "", // Changed from empty string to null
            locale: u.locale || "en",
            system_role: null,
            verified_at: u.verified_at,
            last_active: new Date(),
            store_id: u.store_id,
            otp: u.otp,
          })
          .execute();
        console.log(`Added user : ${index + 1}/${users.length}`);
      } catch (e) {
        console.error("Error: ", e);
      }
    })
  );
}
