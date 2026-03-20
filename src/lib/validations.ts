/**
 * Centralized validation utilities
 * Provides reusable validation functions for forms across the application
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export type EmployeeLoginEmailValidationError =
    | 'invalidInstitutionalEmail'
    | 'useInstitutionalEmail';

export interface EmployeeLoginEmailValidationResult {
    valid: boolean;
    errorKey?: EmployeeLoginEmailValidationError;
}

export const CALENDAR_YEAR_MIN = 1900;

export const getCalendarYearMax = (): number => new Date().getFullYear() + 10;

export interface PasswordValidation {
    minLength: boolean;
    hasUpperLower: boolean;
    hasNumber: boolean;
}

/**
 * Validates a full name with Portuguese naming conventions
 * Accepts prepositions (de, da, do, dos, das, e) in lowercase
 * Requires at least 2 words, each main word starting with uppercase
 */
export const validateName = (name: string): ValidationResult => {
    const normalized = name.trim().replace(/\s+/g, ' ');
    if (!normalized) return { valid: false, error: 'O nome é obrigatório' };

    const words = normalized.split(' ');
    const errors: string[] = [];
    if (words.length < 2) {
        errors.push('Indique pelo menos 2 palavras.');
    }

    // Common Portuguese prepositions that can be lowercase
    const prepositions = ['de', 'da', 'do', 'dos', 'das', 'e'];

    // Pattern for main words: starts with uppercase, at least 2 letters total
    const segmentPattern = /^[\p{Lu}][\p{L}]{1,}$/u;
    const wordPattern = new RegExp(`^(?:${segmentPattern.source})(?:-(?:${segmentPattern.source}))*$`, 'u');

    // Pattern for prepositions: lowercase, at least 1 letter
    const prepositionPattern = /^[\p{Ll}]{1,}$/u;

    for (const w of words) {
        const isPreposition = prepositions.includes(w.toLowerCase());

        if (isPreposition) {
            // Prepositions must be all lowercase
            if (!prepositionPattern.test(w)) {
                errors.push('Preposições (de, da, do, etc.) devem estar em minúsculas');
                break;
            }
        } else {
            // Main words must start with uppercase
            if (!wordPattern.test(w)) {
                errors.push('Cada palavra principal deve começar por maiúscula');
                errors.push('Use apenas letras e hífen (-)');
                errors.push('Cada palavra deve ter pelo menos 2 letras');
                break;
            }
        }
    }
    if (errors.length > 0) {
        return { valid: false, error: errors.join('\n') };
    }
    return { valid: true };
};

/**
 * Validates Portuguese NIF (9 digits)
 */
export const validateNIF = (nif: string): boolean => {
    if (!/^\d{9}$/.test(nif)) return false;

    // Reject clearly invalid repeated sequences.
    if (/^(\d)\1{8}$/.test(nif)) return false;

    const digits = nif.split('').map(Number);
    const checkDigit = digits[8];
    const sum = digits
        .slice(0, 8)
        .reduce((acc, digit, index) => acc + digit * (9 - index), 0);

    const mod11 = sum % 11;
    const expected = mod11 < 2 ? 0 : 11 - mod11;

    return checkDigit === expected;
};

/**
 * Validates Portuguese phone contact (9 digits)
 */
export const validateContact = (contact: string): boolean => {
    return /^\d{9}$/.test(contact);
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validates employee login email against a configurable institutional domain.
 * Returns error keys so UI can translate messages with i18n.
 */
export const validateEmployeeLoginEmail = (
    identifier: string,
    domain: string
): EmployeeLoginEmailValidationResult => {
    const normalizedIdentifier = identifier.trim();
    const normalizedDomain = domain.trim();

    if (!normalizedIdentifier.includes('@')) {
        return { valid: false, errorKey: 'invalidInstitutionalEmail' };
    }

    // Domain must look like "@example.com" (single @ prefix is required).
    if (!/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalizedDomain)) {
        return { valid: false, errorKey: 'invalidInstitutionalEmail' };
    }

    if (!normalizedIdentifier.endsWith(normalizedDomain)) {
        return { valid: false, errorKey: 'useInstitutionalEmail' };
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedIdentifier)) {
        return { valid: false, errorKey: 'invalidInstitutionalEmail' };
    }

    return { valid: true };
};

/**
 * Validates password strength
 * Requires: min 8 characters, uppercase, lowercase, and number
 */
export const validatePassword = (password: string): PasswordValidation => {
    return {
        minLength: password.length >= 8,
        hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
        hasNumber: /\d/.test(password),
    };
};

/**
 * Checks if password meets all requirements
 */
export const isPasswordValid = (password: string): boolean => {
    const validation = validatePassword(password);
    return validation.minLength && validation.hasUpperLower && validation.hasNumber;
};

/**
 * Validates birth date
 * Checks format (dd/mm/yyyy), validity, and minimum age (18 years)
 */
export const validateBirthDate = (birthDate: string): ValidationResult => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
        return { valid: false, error: 'Utilize o formato dd/mm/aaaa' };
    }
    const [dayStr, monthStr, yearStr] = birthDate.split('/');
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    const date = new Date(year, month - 1, day);
    const isRealDate =
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;

    if (!isRealDate) {
        return { valid: false, error: 'Data inválida' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
        return { valid: false, error: 'Data não pode ser no futuro' };
    }

    // Validation for minimum age
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 18) {
        return { valid: false, error: 'Deve ter pelo menos 18 anos para se registar' };
    }

    return { valid: true };
};

/**
 * Formats a date object to dd/mm/yyyy string
 */
export const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Validates a calendar year input.
 * Rules: numeric only, exactly 4 digits, and within supported calendar bounds.
 */
export const validateCalendarYear = (yearInput: string): ValidationResult => {
    if (!/^\d{4}$/.test(yearInput)) {
        return { valid: false, error: 'O ano deve ter exatamente 4 dígitos numéricos' };
    }

    const year = Number(yearInput);
    const maxYear = getCalendarYearMax();

    if (year < CALENDAR_YEAR_MIN || year > maxYear) {
        return { valid: false, error: `O ano deve estar entre ${CALENDAR_YEAR_MIN} e ${maxYear}` };
    }

    return { valid: true };
};
