// Cookie Forge Big — Rust reference/validation engine.
// Kept dependency-free so it can later be compiled to WebAssembly.

#[derive(Clone, Debug)]
pub struct BigIntDecimal {
    pub sign: i8,
    pub digits: String,
    pub exponent: i64,
}

impl BigIntDecimal {
    pub fn zero() -> Self {
        Self { sign: 1, digits: "0".into(), exponent: 0 }
    }

    pub fn from_scientific(s: &str) -> Result<Self, &'static str> {
        // Parser scaffold: the browser engine currently uses BigInt-backed JS.
        // Rust becomes the optional WASM/native acceleration path.
        if s.trim().is_empty() { return Err("empty value"); }
        Ok(Self::zero())
    }
}

pub fn engine_name() -> &'static str {
    "Forge Big Rust/WASM reference"
}
