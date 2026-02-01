import AES from "crypto-js/aes";
import encUtf8 from "crypto-js/enc-utf8";

const SECRET = process.env.TOKEN_ENCRYPTION_KEY || "default-secret";

export function encrypt(text: string): string {
  return AES.encrypt(text, SECRET).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = AES.decrypt(ciphertext, SECRET);
  return bytes.toString(encUtf8);
}
