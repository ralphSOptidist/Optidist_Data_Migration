import { insertCustomersAndBusinesses } from "./customers";
import { insertUsersAndStores } from "./sellers";

export async function runScripts() {
  await insertUsersAndStores();
  await insertCustomersAndBusinesses();
}
