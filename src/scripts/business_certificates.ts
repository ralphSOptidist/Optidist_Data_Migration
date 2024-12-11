import { sourceDatabase, targetDatabase } from "../data-source";
import { transferImage } from "../utils/digitalOcean";
import { generateUUID } from "../utils/generateUUID";
import { isValidURL } from "../utils/isUrl";
import { writeErrorToFile } from "../utils/writeErrors";

export async function insertBusinessCertificates() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const business_certificates = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("business_certificate", "business_certificate")
    //delete this line
    .where("business_certificate.id = :id", {
      id: "buscert_01H5AD5XKBNVJY7THPM6B40C23",
    })
    .getRawMany();

  try {
    await Promise.all(
      business_certificates?.map(async (bc, index) => {
        try {
          let store = await queryRunner.manager
            .createQueryBuilder()
            .select("*")
            .from("store", "s")
            .where("s.business_information_id = :business_information_id", {
              business_information_id: bc.business_id,
            })
            .getRawOne();

          let customer = await queryRunner.manager
            .createQueryBuilder()
            .select("*")
            .from("customer", "cs")
            .where("cs.business_information_id = :business_information_id", {
              business_information_id: bc.business_id,
            })
            .andWhere("cs.role = :role", { role: "admin" })
            .getRawOne();

          let entity_id: string = "";
          let entity_type: string = "";

          if (store) {
            entity_id = store.id;
            entity_type = "store";
          } else if (customer) {
            entity_id = customer.id;
            entity_type = "customer";
          }

          let reformatted_bc = {
            id: "doc_" + generateUUID(),
            name: bc.name.replaceAll("business/", ""),
            url:
              process.env.TO_SPACES_URL +
              "/" +
              bc.url.replaceAll("business/", ""),
            entity_id: entity_id,
            entity_type: entity_type,
          };

          console.log(
            `Processing thumbnail for business certificate ${bc.id}...`
          );
          await transferImage(bc.name, bc.name.replaceAll("business/", ""));

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.document")
            .values(reformatted_bc)
            .execute();

          console.log(
            `Added business certificate : ${index + 1}/${
              business_certificates.length
            }`
          );
        } catch (err) {
          writeErrorToFile(bc.id + "\n" + err);
          console.error("Error processing business certificate:", bc.id, err);
          throw err;
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
