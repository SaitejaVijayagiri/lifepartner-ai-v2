/**
 * Blocklist of disposable, temporary, and fake email domains.
 * Blocks domains used by temporary email generators (e.g. adsprite.com, cadebek.com).
 */
const DISPOSABLE_DOMAINS = new Set([
    "adsprite.com",
    "cadebek.com",
    "temp-mail.org",
    "tempmail.com",
    "tempmail.net",
    "tempmail.co",
    "tempmail.dev",
    "tempmailo.com",
    "mailinator.com",
    "yopmail.com",
    "yopmail.fr",
    "yopmail.net",
    "yopmail.org",
    "yopmail.co.uk",
    "yopmail.com.br",
    "10minutemail.com",
    "10minutemail.net",
    "10minutemail.org",
    "10minutemail.co.za",
    "10minutemail.us",
    "guerrillamail.com",
    "guerrillamail.org",
    "guerrillamail.net",
    "guerrillamail.biz",
    "guerrillamail.de",
    "guerrillamailblock.com",
    "grr.la",
    "sharklasers.com",
    "dispostable.com",
    "getairmail.com",
    "throwawaymail.com",
    "maildrop.cc",
    "trashmail.com",
    "trashmail.net",
    "mytrashmail.com",
    "fakeinbox.com",
    "generator.email",
    "crazymailing.com",
    "owlymail.com",
    "burnermail.io",
    "minuteinbox.com",
    "mailnull.com",
    "moakt.com",
    "pokemail.net",
    "dropmail.me",
    "clipmail.org",
    "cool.fr.nf",
    "jetable.org",
    "meltmail.com",
    "spambox.us",
    "emailondestruct.com",
    "disposablemail.com"
]);

export function isDisposableEmail(email: string): boolean {
    if (!email) return false;
    const parts = email.split('@');
    if (parts.length < 2) return false;
    const domain = parts[1].trim().toLowerCase();

    // Check direct match
    if (DISPOSABLE_DOMAINS.has(domain)) {
        return true;
    }

    // Additional check for subdomains (e.g. sub.temp-mail.org)
    for (const dispDomain of DISPOSABLE_DOMAINS) {
        if (domain.endsWith('.' + dispDomain)) {
            return true;
        }
    }

    return false;
}
