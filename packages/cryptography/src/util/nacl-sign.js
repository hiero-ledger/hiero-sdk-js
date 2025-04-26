import * as curve25519 from '@exodus/crypto/curve25519'

function assertUint8(arr, size) {
  if (arr instanceof Uint8Array && arr.length === size) return
  throw new Error(`Expected an Uint8Array of size ${Number(size)}`)
}

// @exodus/crypto uses 32-byte private keys, nacl uses 64-byte private:public keys
// Everything else is verified on @exodus/crypto side, we just need to process 64-byte keys

// nacl.sign.detached(message, secretKey)
export function detached(message, secretKey) {
  assertUint8(secretKey, 64)
  return curve25519.signDetachedSync({ message, privateKey: secretKey.subarray(0, 32) })
}

// nacl.sign.detached.verify(message, signature, publicKey)
export function detachedVerify(message, signature, publicKey) {
  return curve25519.verifyDetachedSync({ message, signature, publicKey })
}

// nacl.sign.keyPair.fromSeed(seed)
export function keyPairFromSeed(seed) {
  const publicKey = curve25519.edwardsToPublicSync({ privateKey: seed })
  const secretKey = new Uint8Array(64)
  secretKey.set(seed, 0)
  secretKey.set(publicKey, 32)
  return { publicKey, secretKey }
}

// nacl.sign.keyPair.fromSecretKey(key)
export function keyPairFromSecretKey(key) {
  assertUint8(key, 64)
  const keyPair = keyPairFromSeed(key.subarray(0, 32)) // keyPairFromSeed copies data

  // re-validate to ensure that public key was correct
  for (let i = 0; i < key.length; i++) {
    if (key[i] !== keyPair.secretKey[i]) throw new Error('Invalid keypair')
  }

  return keyPair
}
