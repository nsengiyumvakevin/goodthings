const NAME_PATTERN = /^[\p{L}][\p{L}' -]*$/u;
const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z]{2,})+$/;
const CONSONANT_PATTERN = /[bcdfghjklmnpqrstvwxyz]/gi;

function validateName(value, label = "Name") {
  const name = String(value || "").trim();
  if (name.length < 4)
    return `${label} must be greater than 3 characters.`;
  if (name.length > 60)
    return `${label} must be 60 characters or fewer.`;
  if (!NAME_PATTERN.test(name))
    return `${label} can only contain letters, spaces, apostrophes, and hyphens.`;
  return "";
}

function validateEmail(value, { requireCapital = true } = {}) {
  const email = String(value || "").trim();
  if (!email) return "Email address is required.";
  if (email.length > 254)
    return "Email address must be 254 characters or fewer.";
  if (requireCapital && !/^[A-Z]/.test(email))
    return "Email address must start with a capital letter.";
  if (email.includes(".."))
    return "Email address cannot contain consecutive dots.";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain)
    return "Enter a valid email address, for example Name@example.com.";
  if (localPart.length > 64)
    return "The part before @ must be 64 characters or fewer.";
  if (localPart.startsWith(".") || localPart.endsWith("."))
    return "Email address cannot start or end with a dot.";
  if (!EMAIL_PATTERN.test(email))
    return "Enter a valid email address, for example Name@example.com.";
  const consonants = (email.match(CONSONANT_PATTERN) || []).length;
  if (consonants <= 3)
    return "Email address must contain more than 3 consonants.";
  return "";
}

function validatePassword(value) {
  const password = String(value || "");
  if (password.length < 8)
    return "Password must be at least 8 characters.";
  if (password.length > 128)
    return "Password must be 128 characters or fewer.";
  if (!/[a-z]/.test(password))
    return "Password must contain a lowercase letter.";
  if (!/[A-Z]/.test(password))
    return "Password must contain an uppercase letter.";
  if (!/\d/.test(password))
    return "Password must contain a number.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must contain a special character.";
  return "";
}

module.exports = { validateName, validateEmail, validatePassword };
