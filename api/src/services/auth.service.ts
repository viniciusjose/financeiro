import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { UserRepository } from "@/repositories/user.repository.js";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(input: { email: string; name: string; password: string }) {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new Error("E-mail já cadastrado");
    }

    const user = await this.userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash: this.hashPassword(input.password),
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new Error("Credenciais inválidas");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(":");

    if (!salt || !hash) {
      return false;
    }

    const inputHash = createHash("sha256").update(`${salt}:${password}`).digest("hex");

    try {
      return timingSafeEqual(Buffer.from(hash), Buffer.from(inputHash));
    } catch {
      return false;
    }
  }
}
