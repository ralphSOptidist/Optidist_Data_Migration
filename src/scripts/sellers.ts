import { sourceDatabase, targetDatabase } from "../data-source";
import { generateUUID } from "../utils/generateUUID";

export async function insertUsersAndStores() {
  const queryRunner = sourceDatabase.createQueryRunner();
  try {
    await queryRunner.connect();

    const businesses = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("business_information", "bs") // Table name as string and alias
      .where("bs.user_id IS NOT NULL")
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

    const users = await queryRunner.manager
      .createQueryBuilder()
      .select("*")
      .from("user", "u") // Table name as string and alias
      .getRawMany();

    console.log(users[0], users[1]);

    await Promise.all(
      users?.map(async (u) => {
        let reformatted_customer = {
          id: u.id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          password_hash: u.password_hash,
          phone: u.phone,
          verified_at: u.verified_at,
          last_active: new Date(),
          locale: u.locale,
          role: u.role,
          customer_id: u.business_information_id.replaceAll("bus_", "cus_"),
          updated_at: u.updated_at,
          deleted_at: u.deleted_at,
          created_at: u.created_at,
          otp: u.otp,
          is_subscribed: u.is_subscribed,
        };
        const query = `
        INSERT INTO public.user (
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
