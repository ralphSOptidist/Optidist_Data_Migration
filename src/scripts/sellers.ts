import { sourceDatabase, targetDatabase } from "../data-source";
import { generateUUID } from "../utils/generateUUID";

export async function insertUsersAndStores() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  try {
    await queryRunner.connect();
    await queryRunner2.connect();

    const businesses = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("business_information", "bs")
      .where("bs.user_id IS NOT NULL")
      .getRawMany();

    const stores = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("store", "s")
      .getRawMany();

    const users = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("user", "u")
      .getRawMany();

    await Promise.all(
      users?.map(async (u) => {
        let store_id = u.store_id;

        let count = await queryRunner2.manager
          .createQueryBuilder()
          .from("store", "s")
          .where("s.id = :id", { id: store_id })
          .getCount();

        if (count === 0) {
          let business = businesses.find((bus) => {
            bus.user_id === u.id;
          });
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
              industries: business.industries,
              tax_number: business.tax_number,
              bin: business.bin,
              country_code: country.iso_2,
              verified_at: new Date(),
              legal_name: null,
              image: store.image,
            };
            await targetDatabase.query(
              `
                INSERT INTO store (
                  id, name, default_currency_code, swap_link_template, created_at, 
                  updated_at, metadata, payment_link_template, invite_link_template, 
                  default_location_id, industries, tax_number, bin, country_code, 
                  verified_at, legal_name, image
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
              `,
              [
                reformatted_store.id,
                reformatted_store.name,
                reformatted_store.default_currency_code,
                reformatted_store.swap_link_template,
                reformatted_store.created_at,
                reformatted_store.updated_at,
                reformatted_store.metadata,
                reformatted_store.payment_link_template,
                reformatted_store.invite_link_template,
                reformatted_store.default_location_id,
                reformatted_store.industries,
                reformatted_store.tax_number,
                reformatted_store.bin,
                reformatted_store.country_code,
                reformatted_store.verified_at,
                reformatted_store.legal_name,
                reformatted_store.image,
              ]
            );
          }
        }
      })
    );

    await Promise.all(
      users?.map(async (u) => {
        const query = `
    INSERT INTO users (
      id, email, first_name, last_name, password_hash, api_token,
      created_at, updated_at, deleted_at, metadata, role, phone, 
      locale, system_role, verified_at, last_active, store_id, otp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

        const values = [
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.password_hash,
          u.api_token,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          u.metadata,
          u.role,
          u.phone,
          u.locale,
          null,
          u.verified_at,
          new Date(),
          u.store_id,
          u.otp,
        ];

        await targetDatabase.query(query, values);
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  } finally {
    await queryRunner.release();
  }
}
