import { BACKEND_PORT } from './config.js';

export function getUser(token, userId) {
    return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userId}`, {
        method: 'GET',
        headers: { 'Content-type': 'application/json', 'Authorization': token },
    })
}

export function updateUser(token, email, password, name, image) {
    return fetch(`http://localhost:${BACKEND_PORT}/user`, {
        method: 'PUT',
        headers: { 'Content-type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ email, password, name, image })
    })
}

export function setAdminStatus(token, userId, turnon) {
    return fetch(`http://localhost:${BACKEND_PORT}/user/admin`, {
        method: 'PUT',
        headers: { 'Content-type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ userId, turnon })
    })
}