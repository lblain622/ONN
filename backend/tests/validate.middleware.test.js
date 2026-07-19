import { describe, it, expect, vi } from 'vitest';
import { validate, loginSchema, registerSchema, createDeckSchema, updateDeckSchema } from '../middleware/validate.js';

function mockReqRes(body) {
    const req = { body };
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();
    return { req, res, next };
}

describe('validate middleware', () => {
    describe('loginSchema', () => {
        it('passes with valid credentials', () => {
            const { req, res, next } = mockReqRes({ email: 'a@b.com', password: 'secret' });
            validate(loginSchema)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('rejects a missing email', () => {
            const { req, res, next } = mockReqRes({ password: 'secret' });
            validate(loginSchema)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });

        it('rejects an invalid email format', () => {
            const { req, res, next } = mockReqRes({ email: 'not-an-email', password: 'secret' });
            validate(loginSchema)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            const body = res.json.mock.calls[0][0];
            expect(body.errors[0].field).toBe('email');
        });
    });

    describe('registerSchema', () => {
        it('passes with a strong password', () => {
            const { req, res, next } = mockReqRes({ email: 'a@b.com', password: 'strongpass' });
            validate(registerSchema)(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('rejects a password shorter than 8 characters', () => {
            const { req, res, next } = mockReqRes({ email: 'a@b.com', password: 'short' });
            validate(registerSchema)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            const body = res.json.mock.calls[0][0];
            expect(body.errors[0].field).toBe('password');
        });
    });

    describe('createDeckSchema', () => {
        it('passes with a valid deck payload', () => {
            const { req, res, next } = mockReqRes({ name: 'My Deck' });
            validate(createDeckSchema)(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('rejects an empty deck name', () => {
            const { req, res, next } = mockReqRes({ name: '   ' });
            validate(createDeckSchema)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('rejects a deck name over 100 characters', () => {
            const { req, res, next } = mockReqRes({ name: 'a'.repeat(101) });
            validate(createDeckSchema)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('rejects card quantity of 0', () => {
            const { req, res, next } = mockReqRes({
                name: 'Test',
                cards: [{ cardId: 'clxxxxxxxxxxxxxxxxxxxxxx', quantity: 0 }],
            });
            validate(createDeckSchema)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('rejects card quantity over 4', () => {
            const { req, res, next } = mockReqRes({
                name: 'Test',
                cards: [{ cardId: 'clxxxxxxxxxxxxxxxxxxxxxx', quantity: 5 }],
            });
            validate(createDeckSchema)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('updateDeckSchema', () => {
        it('passes with partial update (only isPublic)', () => {
            const { req, res, next } = mockReqRes({ isPublic: true });
            validate(updateDeckSchema)(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('passes with an empty body (all fields optional)', () => {
            const { req, res, next } = mockReqRes({});
            validate(updateDeckSchema)(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
