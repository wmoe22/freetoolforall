// Simple hash implementations for demo purposes
// In production, use a proper crypto library like crypto-js

// Simple MD5-like hash function (not cryptographically secure)
export function simpleMD5(text: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    let h0 = 0x67452301;
    let h1 = 0xEFCDAB89;
    let h2 = 0x98BADCFE;
    let h3 = 0x10325476;

    // Simple mixing function
    for (let i = 0; i < data.length; i++) {
        const byte = data[i];
        h0 = (h0 + byte) & 0xFFFFFFFF;
        h1 = (h1 ^ (h0 << 7)) & 0xFFFFFFFF;
        h2 = (h2 + (h1 >>> 3)) & 0xFFFFFFFF;
        h3 = (h3 ^ (h2 << 11)) & 0xFFFFFFFF;

        // Rotate
        const temp = h0;
        h0 = h1;
        h1 = h2;
        h2 = h3;
        h3 = temp;
    }

    // Final mixing
    h0 = (h0 + h2) & 0xFFFFFFFF;
    h1 = (h1 + h3) & 0xFFFFFFFF;

    // Convert to hex
    const hex0 = h0.toString(16).padStart(8, '0');
    const hex1 = h1.toString(16).padStart(8, '0');
    const hex2 = h2.toString(16).padStart(8, '0');
    const hex3 = h3.toString(16).padStart(8, '0');

    return (hex0 + hex1 + hex2 + hex3).substring(0, 32);
}

// SHA-1 using Web Crypto API
export async function sha1Hash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// SHA-256 using Web Crypto API
export async function sha256Hash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}