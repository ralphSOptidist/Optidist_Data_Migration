import { sourceDatabase, targetDatabase } from "../data-source";
import { generateUUID } from "../utils/generateUUID";

export async function insertCustomersAndBusinesses() {
  const queryRunner = sourceDatabase.createQueryRunner();
  try {
    await queryRunner.connect();

    const businesses = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("business_information", "bs") // Table name as string and alias
      .where("bs.customer_id IS NOT NULL")
      .getRawMany();

    console.log(businesses[0], businesses[1]);

    await Promise.all(
      businesses?.map(async (bs) => {
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
            INSERT INTO customer (id, email, first_name, last_name, billing_address_id, password_hash, phone, has_account, created_at, updated_at, deleted_at, metadata, name, tax_number, bin, industries, verified_at, country_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            `;

        await targetDatabase.query(query, [
          bs.id.replaceAll("bus_", "cus_"),
          customer.email,
          customer.first_name,
          customer.last_name,
          bs.billing_address_id,
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
          bs.industries.join(","),
          new Date(),
          country.iso_2,
        ]);
      })
    );

    const customer_users = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("customer", "cs") // Table name as string and alias
      .where("cs.customer_id IS NOT NULL")
      .getRawMany();

    console.log(customer_users[0], customer_users[1]);

    await Promise.all(
      customer_users?.map(async (cs) => {
        let reformatted_customer = {
          id: "cus_user_" + generateUUID(),
          email: cs.email,
          first_name: cs.first_name,
          last_name: cs.last_name,
          password_hash: cs.password_hash,
          phone: cs.phone,
          verified_at: cs.verified_at,
          last_active: new Date(),
          locale: cs.locale,
          role: cs.role,
          customer_id: cs.business_information_id.replaceAll("bus_", "cus_"),
          updated_at: cs.updated_at,
          deleted_at: cs.deleted_at,
          created_at: cs.created_at,
          otp: cs.otp,
          is_subscribed: cs.is_subscribed,
        };
        const query = `
        INSERT INTO customer_user (
            id, email, first_name, last_name, password_hash, phone,
            verified_at, last_active, locale, role, customer_id,
            updated_at, deleted_at, created_at, otp, is_subscribed
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        `;

        const values = [
          reformatted_customer.id,
          reformatted_customer.email,
          reformatted_customer.first_name,
          reformatted_customer.last_name,
          reformatted_customer.password_hash,
          reformatted_customer.phone,
          reformatted_customer.verified_at,
          reformatted_customer.last_active,
          reformatted_customer.locale,
          reformatted_customer.role,
          reformatted_customer.customer_id,
          reformatted_customer.updated_at,
          reformatted_customer.deleted_at,
          reformatted_customer.created_at,
          reformatted_customer.otp,
          reformatted_customer.is_subscribed,
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
