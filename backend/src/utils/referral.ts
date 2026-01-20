import crypto from 'crypto';

/**
 * Генерирует уникальный реферальный код
 */
export const generateReferralCode = (name: string): string => {
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${random}`;
};
