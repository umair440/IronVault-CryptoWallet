import bcrypt from 'bcryptjs';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export abstract class AuthenticationMethod {
  abstract authenticate(credentials: { password: string; passwordHash: string }): Promise<boolean>;
}

export class PasswordAuthentication extends AuthenticationMethod {
  authenticate(credentials: { password: string; passwordHash: string }) {
    return verifyPassword(credentials.password, credentials.passwordHash);
  }
}
