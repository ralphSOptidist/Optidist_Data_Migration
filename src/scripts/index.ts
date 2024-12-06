import { insertCollections } from "./collections";
import { insertCustomersAndBusinesses } from "./customers";
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
  console.log("DONE WITH ALL SCRIPTS");
}
