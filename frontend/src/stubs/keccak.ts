// Browser stub for keccak — the @zama-fhe/relayer-sdk/web entry uses WASM instead
// This stub is only hit if something imports the Node keccak package directly
export function keccak(algorithm: string) {
  throw new Error(`keccak(${algorithm}) is not available in browser — use the WASM version`)
}
export default keccak
