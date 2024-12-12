import { insertAddresses } from "./address";
import { insertBusinessCertificates } from "./business_certificates";
import { insertCollections } from "./collections";
import { insertCustomersAndBusinesses } from "./customers";
import { insertLocationCertificates } from "./location_certificates";
import { insertProductsWithRegion } from "./location_with_products";
import { insertProductVariantMoneyAmounts } from "./money_amount";
import { insertProductImages } from "./product_images";
import { insertSubCategoriesWithProducts } from "./product_sub_categories";
import { insertProducts } from "./products";
import { insertUsersAndStores } from "./sellers";
import { insertProductVariants } from "./variants";

export async function runScripts() {
  await insertCustomersAndBusinesses();
  await insertUsersAndStores();
  await insertCollections();
  await insertProducts();
  await insertSubCategoriesWithProducts();
  await insertProductImages();
  await insertProductVariants();
  await insertProductVariantMoneyAmounts();
  await insertAddresses();
  await insertBusinessCertificates();
  await insertLocationCertificates();
  await insertProductsWithRegion();
  console.log("DONE WITH ALL SCRIPTS");
}
