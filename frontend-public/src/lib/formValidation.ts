export const PERSON_NAME_REGEX = /^[\p{L}\s\-'.]+$/u;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[\d\s+\-()]+$/;
export const INSTITUTION_REGEX = /^[\p{L}\p{N}\s.,'\-&()/]+$/u;
export const COURSE_REGEX = /^[\p{L}\p{N}\s.,\-&()/]+$/u;
export const POSITION_REGEX = /^[\p{L}\p{N}\s.\-&/()]+$/u;
export const URL_REGEX = /^https?:\/\/.+/i;

// Validation Functions
export function validatePersonName(name: string): string {
  if (!name.trim()) return "Please enter a name.";
  if (name.length < 2) return "Name must contain at least 2 characters.";
  if (name.length > 100) return "Name must be 100 characters or fewer.";
  if (/\d/.test(name)) return "Name can contain letters, spaces, hyphens, apostrophes, and periods only.";
  if (!PERSON_NAME_REGEX.test(name)) return "Name can contain letters, spaces, hyphens, apostrophes, and periods only.";
  return "";
}

export function validateEmail(email: string): string {
  if (!email.trim()) return "Please enter an email address.";
  if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address.";
  return "";
}

export function validatePhone(phone: string, required: boolean): string {
  if (!phone.trim()) {
    return required ? "Please enter a phone number." : "";
  }
  if (!PHONE_REGEX.test(phone)) return "Phone number can contain only digits, spaces, +, -, and parentheses.";
  if (phone.length < 7 || phone.length > 20) return "Phone number must contain 7–20 characters.";
  return "";
}

export function validateInstitutionName(name: string): string {
  if (name && name.length > 200) return "College / University name must be 200 characters or fewer.";
  if (name && !INSTITUTION_REGEX.test(name)) return "Please enter a valid college or university name.";
  return "";
}

export function validateCourseYear(course: string): string {
  if (course && course.length > 100) return "Course and year must be 100 characters or fewer.";
  if (course && !COURSE_REGEX.test(course)) return "Please enter a valid course and year.";
  return "";
}

export function validateJobPosition(position: string): string {
  if (!position.trim()) return "Please enter a valid position.";
  if (position.length < 2 || position.length > 200) return "Please enter a valid position.";
  if (!POSITION_REGEX.test(position)) return "Please enter a valid position.";
  return "";
}

export function validateURL(url: string, required: boolean): string {
  if (!url.trim()) return required ? "Please enter a valid LinkedIn or portfolio URL." : "";
  if (!URL_REGEX.test(url)) return "Please enter a valid LinkedIn or portfolio URL.";
  if (/^(javascript|data|vbscript|file):/i.test(url.trim())) return "Please enter a valid LinkedIn or portfolio URL.";
  return "";
}

export function validateFreeText(text: string, minLength: number, maxLength: number, isRequired: boolean = false): string {
  if (!text.trim()) {
    return isRequired ? `Message must contain at least ${minLength} characters.` : "";
  }
  if (text.length < minLength) return `Message must contain at least ${minLength} characters.`;
  if (text.length > maxLength) return `Message must be ${maxLength} characters or fewer.`;
  return "";
}

export function validateSelect(value: string, requiredMessage: string): string {
  if (!value) return requiredMessage;
  return "";
}
