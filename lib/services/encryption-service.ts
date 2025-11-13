/**
 * Encryption Service
 *
 * Handles encryption and decryption of sensitive data:
 * - Odoo.sh API tokens
 * - Odoo credentials (username, password, API keys)
 * - Supports key rotation
 *
 * Uses AES-256-GCM for encryption (authenticated encryption)
 */

import crypto from 'crypto'

export interface EncryptionConfig {
  algorithm?: string
  keyLength?: number
  ivLength?: number
  saltLength?: number
  iterations?: number
}

export class EncryptionService {
  private algorithm: string
  private keyLength: number
  private ivLength: number
  private saltLength: number
  private iterations: number

  // Master encryption key (should be stored in environment variable)
  private masterKey: Buffer

  constructor(config?: EncryptionConfig) {
    this.algorithm = config?.algorithm || 'aes-256-gcm'
    this.keyLength = config?.keyLength || 32 // 256 bits
    this.ivLength = config?.ivLength || 16 // 128 bits
    this.saltLength = config?.saltLength || 16
    this.iterations = config?.iterations || 100000 // PBKDF2 iterations

    // Get master key from environment variable
    const masterKeyEnv = process.env.ENCRYPTION_MASTER_KEY
    if (!masterKeyEnv) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required')
    }

    // Master key should be 32 bytes (256 bits) for AES-256
    // If provided as hex string, decode it; otherwise use as-is
    if (masterKeyEnv.length === 64) {
      // Hex string (64 chars = 32 bytes)
      this.masterKey = Buffer.from(masterKeyEnv, 'hex')
    } else {
      // Use PBKDF2 to derive key from password
      const salt = Buffer.from('odoo-orchestrator-salt', 'utf8')
      this.masterKey = crypto.pbkdf2Sync(
        masterKeyEnv,
        salt,
        this.iterations,
        this.keyLength,
        'sha256'
      )
    }
  }

  /**
   * Encrypt a value
   */
  encrypt(value: string, keyId: string = 'default'): string {
    if (!value) {
      return value
    }

    try {
      // Generate IV (Initialization Vector)
      const iv = crypto.randomBytes(this.ivLength)

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv)

      // Encrypt
      let encrypted = cipher.update(value, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      // Get auth tag (for GCM mode)
      const authTag = cipher.getAuthTag()

      // Combine: keyId:iv:authTag:encrypted
      const result = `${keyId}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`

      return result
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Decrypt a value
   */
  decrypt(encryptedValue: string): string {
    if (!encryptedValue) {
      return encryptedValue
    }

    try {
      // Parse: keyId:iv:authTag:encrypted
      const parts = encryptedValue.split(':')
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted value format')
      }

      const [keyId, ivHex, authTagHex, encrypted] = parts

      // Decode IV and auth tag
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv)
      decipher.setAuthTag(authTag)

      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Encrypt Odoo.sh API token
   */
  encryptOdooShToken(token: string): string {
    return this.encrypt(token, 'odoo_sh_token')
  }

  /**
   * Decrypt Odoo.sh API token
   */
  decryptOdooShToken(encryptedToken: string): string {
    return this.decrypt(encryptedToken)
  }

  /**
   * Encrypt Odoo credentials
   */
  encryptOdooCredentials(credentials: { username: string; password: string; apiKey?: string }): {
    username: string // Username is not encrypted (needed for display)
    password_encrypted: string
    api_key_encrypted?: string
  } {
    return {
      username: credentials.username,
      password_encrypted: this.encrypt(credentials.password, 'odoo_password'),
      api_key_encrypted: credentials.apiKey
        ? this.encrypt(credentials.apiKey, 'odoo_api_key')
        : undefined,
    }
  }

  /**
   * Decrypt Odoo credentials
   */
  decryptOdooCredentials(encryptedCredentials: {
    username: string
    password_encrypted: string
    api_key_encrypted?: string
  }): {
    username: string
    password: string
    apiKey?: string
  } {
    return {
      username: encryptedCredentials.username,
      password: this.decrypt(encryptedCredentials.password_encrypted),
      apiKey: encryptedCredentials.api_key_encrypted
        ? this.decrypt(encryptedCredentials.api_key_encrypted)
        : undefined,
    }
  }

  /**
   * Rotate encryption key (re-encrypt with new key)
   */
  rotateKey(encryptedValue: string, newKeyId: string): string {
    const decrypted = this.decrypt(encryptedValue)
    return this.encrypt(decrypted, newKeyId)
  }

  /**
   * Check if encrypted value uses a specific key ID
   */
  getKeyId(encryptedValue: string): string | null {
    if (!encryptedValue) {
      return null
    }

    const parts = encryptedValue.split(':')
    if (parts.length !== 4) {
      return null
    }

    return parts[0]
  }

  /**
   * Generate a new master key (for key rotation)
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Hash a value (one-way, for comparison)
   */
  static hash(value: string, salt?: string): string {
    const usedSalt = salt || crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(value, usedSalt, 100000, 64, 'sha512')
    return `${usedSalt}:${hash.toString('hex')}`
  }

  /**
   * Verify a hash
   */
  static verifyHash(value: string, hash: string): boolean {
    const [salt, hashValue] = hash.split(':')
    const computedHash = crypto.pbkdf2Sync(value, salt, 100000, 64, 'sha512')
    return computedHash.toString('hex') === hashValue
  }
}

// Singleton instance
let encryptionServiceInstance: EncryptionService | null = null

/**
 * Get encryption service instance (singleton)
 */
export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new EncryptionService()
  }
  return encryptionServiceInstance
}
