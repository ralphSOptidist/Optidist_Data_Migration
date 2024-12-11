import { sourceDatabase, targetDatabase } from "../data-source";
import { transferImage } from "../utils/digitalOcean";
import { generateUUID } from "../utils/generateUUID";
import { isValidURL } from "../utils/isUrl";
import { writeErrorToFile } from "../utils/writeErrors";

export async function insertLocationCertificates() {
  const queryRunner = sourceDatabase.createQueryRunner();
  const queryRunner2 = targetDatabase.createQueryRunner();
  await queryRunner.connect();
  await queryRunner2.connect();

  const location_certificates = await queryRunner.manager
    .createQueryBuilder()
    .select("*")
    .from("location_certificate", "location_certificate")
    //delete this line
    .where("location_certificate.id = :id", {
      id: "adcert_01H93TRGWG3QW4N1TGMPH9R7VPp",
    })
    .getRawMany();

  try {
    await Promise.all(
      location_certificates?.map(async (lc, index) => {
        try {
          let reformatted_bc = {
            id: "doc_" + generateUUID(),
            name: lc.name,
            url: process.env.TO_SPACES_URL + "/" + lc.url,
            entity_id: lc.address_id,
            entity_type: "address",
          };

          console.log(
            `Processing thumbnail for location certificate ${lc.id}...`
          );
          await transferImage(lc.url, lc.url);

          await queryRunner2.manager
            .createQueryBuilder()
            .insert()
            .into("public.document")
            .values(reformatted_bc)
            .execute();

          console.log(
            `Added location certificate : ${index + 1}/${
              location_certificates.length
            }`
          );
        } catch (err) {
          writeErrorToFile(lc.id + "\n" + err);
          console.error("Error processing location certificate:", lc.id, err);
          throw err;
        }
      })
    );
  } catch (e) {
    console.error("Error: ", e);
  }
}
