import crypto from 'crypto';

const WORDS = ['amber', 'vault', 'ledger', 'seed', 'wallet', 'network', 'secure', 'orbit', 'future', 'token', 'shield', 'cipher'];

export function generateRecoveryPhrase(length = 12) {
  return Array.from({ length }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ');
}

export function encryptSecret(secret: string, password: string) {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    algorithm: 'aes-256-gcm',
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function generateDemoEvmAddress() {
  return `0x${crypto.randomBytes(20).toString('hex')}`;
}

export function validateEvmAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
