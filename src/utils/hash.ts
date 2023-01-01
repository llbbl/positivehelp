
// function to that uses the crypto library to create a hash of a string
export function hash(str: string): string {
    const crypto = require('crypto');
  return crypto.createHash('sha256').update(str).digest('hex')
}
    