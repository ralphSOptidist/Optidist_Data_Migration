export function isValidURL(url: string): boolean {
  const urlPattern = new RegExp(
    /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/,
    "i"
  );
  return urlPattern.test(url);
}
