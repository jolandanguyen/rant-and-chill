import { BACKEND_PORT } from './config.js';

export function loginUser(email, password) {
    return fetch(`http://localhost:${BACKEND_PORT}/auth/login`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
}

export function registerUser(name, email, password) {
    return fetch(`http://localhost:${BACKEND_PORT}/auth/register`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
}