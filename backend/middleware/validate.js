import { z } from 'zod';

/**
 * Returns an Express middleware that validates req.body against the given Zod schema.
 * On failure it responds 400 with a structured errors array; on success it replaces
 * req.body with the parsed (coerced + stripped) value and calls next().
 */
export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            return res.status(400).json({ message: 'Validation failed', errors });
        }
        req.body = result.data;
        next();
    };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Must be a valid email address'),
    password: z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password is required'),
});

export const registerSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Must be a valid email address'),
    password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be at most 128 characters'),
    displayName: z
        .string()
        .trim()
        .max(100, 'Display name must be at most 100 characters')
        .optional()
        .nullable(),
});

// ── Decks ─────────────────────────────────────────────────────────────────────

const deckCardSchema = z.object({
    cardId: z.string({ required_error: 'cardId is required' }).cuid('cardId must be a valid CUID'),
    quantity: z
        .number({ required_error: 'quantity is required' })
        .int('quantity must be an integer')
        .min(1, 'quantity must be at least 1')
        .max(4, 'quantity must be at most 4'),
});

export const createDeckSchema = z.object({
    name: z
        .string({ required_error: 'Deck name is required' })
        .trim()
        .min(1, 'Deck name cannot be blank')
        .max(100, 'Deck name must be at most 100 characters'),
    description: z
        .string()
        .trim()
        .max(2000, 'Description must be at most 2000 characters')
        .optional()
        .nullable(),
    isPublic: z.boolean().optional().default(false),
    cards: z.array(deckCardSchema).max(200, 'Deck cannot contain more than 200 card entries').optional(),
    builderDetails: z
        .object({
            championCard: z.string().optional(),
            domain: z.string().optional(),
            colors: z.string().optional(),
        })
        .optional()
        .nullable(),
});

export const updateDeckSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Deck name cannot be blank')
        .max(100, 'Deck name must be at most 100 characters')
        .optional(),
    description: z
        .string()
        .trim()
        .max(2000, 'Description must be at most 2000 characters')
        .optional()
        .nullable(),
    isPublic: z.boolean().optional(),
    cards: z.array(deckCardSchema).max(200, 'Deck cannot contain more than 200 card entries').optional(),
});

export const copyDeckSchema = z.object({
    name: z
        .string()
        .trim()
        .max(100, 'Deck name must be at most 100 characters')
        .optional(),
});
