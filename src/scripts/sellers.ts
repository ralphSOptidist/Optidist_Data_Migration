import { sourceDatabase, targetDatabase } from "../data-source";
import { transferImage } from "../utils/digitalOcean";
import { writeErrorToFile } from "../utils/writeErrors";

export async function insertUsersAndStores() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const users = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("user", "u")
    //delete this line afterwards
    .where("u.id = :id", { id: "usr_01JERE27T90AFKRVAK7WVJSCF3" })
    .getRawMany();

  let business_ids: string[] = [];
  const stores = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("store", "store")
    //delete this line afterwards
    .where("store.id = :id", { id: "store_01JERE27WAK0TK3AJ678A2X6X1" })
    .getRawMany();

  stores?.map((store) => {
    if (store?.business_information_id?.length > 0) {
      business_ids.push(store.business_information_id);
    }
  });

  const businesses = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("business_information", "business_information")
    .where("business_information.id IN(:...ids)", {
      ids: business_ids,
    })
    .getRawMany();

  try {
    await Promise.all(
      stores?.map(async (store) => {
        try {
          let user = users.filter(
            (user) => user.store_id === store.id && user.role == "admin"
          );

          if (user?.length > 0) {
            let business = businesses.find(
              (bus) => bus.id === user[0]?.business_information_id
            );
            let country = await queryRunner.manager
              .createQueryBuilder()
              .select("*")
              .from("country", "c")
              .where("c.id = :id", {
                id: business?.country || store.country_id,
              })
              .getRawOne();

            let reformatted_store = {
              id: store.id,
              name: store.name,
              default_currency_code: store.default_currency_code,
              swap_link_template: store.swap_link_template,
              created_at: store.created_at,
              updated_at: store.updated_at,
              metadata: store.metadata,
              payment_link_template: store.payment_link_template,
              invite_link_template: store.invite_link_template,
              default_location_id: store.default_location_id,
              industries: business?.industries
                ? JSON.stringify(business.industries)
                : [],
              tax_number: business?.tax_number || "",
              bin: business?.bin || "",
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
          } else {
            let country = await queryRunner.manager
              .createQueryBuilder()
              .select("*")
              .from("country", "c")
              .where("c.id = :id", { id: store.country_id })
              .getRawOne();

            let reformatted_store = {
              id: store.id,
              name: store.name,
              default_currency_code: store.default_currency_code,
              swap_link_template: store.swap_link_template,
              created_at: store.created_at,
              updated_at: store.updated_at,
              metadata: store.metadata,
              payment_link_template: store.payment_link_template,
              invite_link_template: store.invite_link_template,
              default_location_id: store.default_location_id,
              country_code: country.iso_2,
              verified_at: new Date(),
              legal_name: null,
              image:
                store?.image?.length > 0
                  ? process.env.TO_SPACES_URL +
                    "/" +
                    store.image.replaceAll("business/", "")
                  : null,
            };

            if (store?.image?.length > 0) {
              console.log(`Processing thumbnail for store ID ${store.id}...`);
              await transferImage(
                store.image,
                store.image.replaceAll("business/", "")
              );
            }

            await queryRunner2.manager
              .createQueryBuilder()
              .insert()
              .into("store")
              .values(reformatted_store)
              .execute();
          }
        } catch (err) {
          writeErrorToFile(store.id + "\n" + err);
          console.error("Error processing store:", store.id, err);
          throw err;
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
              phone: u.phone || "",
              locale: u.locale || "en",
              system_role: null,
              verified_at: u.verified_at,
              last_active: new Date(),
              store_id: u.store_id,
              otp: u.otp,
            })
            .execute();
          console.log(`Added user : ${index + 1}/${users.length}`);
        } catch (err) {
          writeErrorToFile(u.id + "\n" + err);
          console.error("Error inserting user:", u.id, err);
          throw err; // This will stop the Promise.all execution
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
