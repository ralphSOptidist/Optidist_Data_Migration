import { sourceDatabase, targetDatabase } from "../data-source";
import { generateUUID } from "../utils/generateUUID";
import { writeErrorToFile } from "../utils/writeErrors";

export async function insertCustomersAndBusinesses() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();
  try {
    const addresses = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("address", "address")
      .getRawMany();

    const businesses = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("business_information", "bs") // Table name as string and alias
      .where("bs.customer_id IS NOT NULL")
      .getRawMany();

    const distinctBusinesses: any = businesses.reduce((acc, current) => {
      if (!acc.find((item: any) => item.customer_id === current.customer_id)) {
        acc.push(current);
      }
      return acc;
    }, []);
    await Promise.all(
      distinctBusinesses?.map(async (bs: any, index: number) => {
        try {
          let customer = await queryRunner.manager
            .createQueryBuilder()
            .select("*")
            .from("customer", "cs")
            .where("cs.id = :id", { id: bs.customer_id })
            .getRawOne();

          let country = await queryRunner.manager
            .createQueryBuilder()
            .select("*")
            .from("country", "c")
            .where("c.id = :id", { id: bs.country })
            .getRawOne();

          const query = `
            INSERT INTO customer (id, email, first_name, last_name, password_hash, phone, has_account, created_at, updated_at, deleted_at, metadata, name, tax_number, bin, industries, verified_at, country_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `;

          await targetDatabase.query(query, [
            customer.id,
            customer.email,
            customer.first_name,
            customer.last_name,
            customer.password_hash,
            customer.phone,
            false,
            new Date(),
            new Date(),
            null,
            "{}",
            bs.business_name,
            bs.tax_number,
            bs.bin,
            JSON.stringify(bs.industries),
            new Date(),
            country.iso_2,
          ]);

          const query2 = `
            INSERT INTO customer_user (id, email, first_name, last_name, password_hash, phone, verified_at, last_active, locale, role, customer_id, created_at, updated_at, deleted_at, is_subscribed)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            `;

          await targetDatabase.query(query2, [
            customer.id.replaceAll("cus_", "cus_user_"),
            customer.email,
            customer.first_name,
            customer.last_name,
            customer.password_hash,
            customer.phone,
            new Date(),
            new Date(),
            "en",
            "admin",
            customer.id,
            new Date(),
            new Date(),
            new Date(),
            true,
          ]);

          console.log(
            `Added customer business : ${index + 1}/${
              distinctBusinesses.length
            }`
          );

          let filtered_addresses = addresses.filter(
            (ad) => ad.customer_id === customer.id
          );
          if (filtered_addresses?.length > 0) {
            await Promise.all(
              filtered_addresses.map(async (address, index2) => {
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

                await queryRunner2.manager
                  .createQueryBuilder()
                  .insert()
                  .into("public.address_customer_user")
                  .values({
                    address_id: address.id,
                    customer_user_id: customer.id.replaceAll(
                      "cus_",
                      "cus_user_"
                    ),
                  })
                  .execute();

                console.log(
                  `Added address : ${index2 + 1}/${filtered_addresses.length}`
                );
              })
            );
          }
        } catch (err) {
          writeErrorToFile(bs.id + "\n" + err);
          console.error("Error processing customer business:", bs.id, err);
          throw err;
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  } finally {
    await queryRunner.release();
  }
}
