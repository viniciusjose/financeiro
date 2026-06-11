import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { User } from "@/models/schema/users.js";
import type { UserRepository } from "@/repositories/user.repository.js";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(input: { email: string; name: string; birthDate: string; password: string }) {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new Error("E-mail já cadastrado");
    }

    const user = await this.userRepository.create({
      email: input.email,
      name: input.name,
      birthDate: input.birthDate,
      passwordHash: this.hashPassword(input.password),
    });

    return this.toPublicUser(user);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new Error("Credenciais inválidas");
    }

    return this.toPublicUser(user);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    return this.toPublicUser(user);
  }

  async changePassword(input: { userId: string; currentPassword: string; newPassword: string }) {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (!this.verifyPassword(input.currentPassword, user.passwordHash)) {
      throw new Error("Senha atual incorreta");
    }

    if (input.currentPassword === input.newPassword) {
      throw new Error("A nova senha deve ser diferente da senha atual");
    }

    await this.userRepository.updatePassword(input.userId, this.hashPassword(input.newPassword));
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      birthDate: user.birthDate,
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
