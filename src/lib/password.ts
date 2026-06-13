import { createHash, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function passwordsMatch(
  plainPassword: string,
  storedHash: string,
): boolean {
  const inputHash = hashPassword(plainPassword).toLowerCase();
  const expectedHash = storedHash.toLowerCase();

  const inputBuffer = Buffer.from(inputHash, "utf8");
  const expectedBuffer = Buffer.from(expectedHash, "utf8");

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}
