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

    let customers = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("customer", "cs")
      //delete this line afterwards
      .where("cs.id = :id", {
        id: "cus_00_10",
      })
      .getRawMany();

    console.log(customers);

    let business_ids: string[] = [];

    customers.map((customer) => {
      if (customer?.business_information_id?.length > 0) {
        business_ids.push(customer.business_information_id);
      }
    });
    const businesses = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("business_information", "business_information") // Table name as string and alias
      .where("business_information.id IN (:...ids)", {
        ids: business_ids,
      })
      .getRawMany();

    await Promise.all(
      businesses?.map(async (bs: any, index: number) => {
        try {
          let customer = customers.find(
            (customer) => customer.business_information_id === bs.id
          );

          if (customer) {
            console.log("customer: ", customer);

            let country = await queryRunner.manager
              .createQueryBuilder()
              .select("*")
              .from("country", "c")
              .where("c.id = :id", { id: bs.country })
              .getRawOne();

            await queryRunner2.manager
              .createQueryBuilder()
              .insert()
              .into("customer")
              .values({
                id: customer.id,
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name,
                password_hash: customer.password_hash,
                phone: customer.phone || "",
                has_account: false,
                created_at: new Date(),
                updated_at: new Date(),
                deleted_at: null,
                metadata: "{}",
                name: bs.business_name,
                tax_number: bs.tax_number || "",
                bin: bs.bin || "",
                industries: JSON.stringify(bs.industries),
                verified_at: new Date(),
                country_code: country.iso_2,
              })
              .execute();

            await queryRunner2.manager
              .createQueryBuilder()
              .insert()
              .into("customer_user")
              .values({
                id: customer.id.replaceAll("cus_", "cus_user_"),
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name,
                password_hash: customer.password_hash,
                phone: customer.phone || "",
                verified_at: new Date(),
                last_active: new Date(),
                locale: "en",
                role: "admin",
                customer_id: customer.id,
                created_at: new Date(),
                updated_at: new Date(),
                deleted_at: new Date(),
                is_subscribed: true,
              })
              .execute();

            console.log(
              `Added customer business : ${index + 1}/${businesses.length}`
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
