import { customAlphabet } from "nanoid";
export const generateUUID = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nanoid = customAlphabet(alphabet, 26);

  const uniqueString = nanoid();
  return uniqueString;
};
