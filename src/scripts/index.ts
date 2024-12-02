import { insertCollections } from "./collections";
import { insertCustomersAndBusinesses } from "./customers";
import { insertSubCategoriesWithProducts } from "./product_sub_categories";
import { insertProducts } from "./products";
import { insertUsersAndStores } from "./sellers";

export async function runScripts() {
  await insertUsersAndStores();
  // await insertCustomersAndBusinesses();
  await insertCollections();
  await insertProducts();
  await insertSubCategoriesWithProducts();
  console.log("DONE WITH ALL SCRIPTS");
}
