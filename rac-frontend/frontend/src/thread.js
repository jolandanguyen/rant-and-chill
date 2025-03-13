import { BACKEND_PORT } from './config.js';

export function createThread(token, title, isPublic, content) {
    return fetch(`http://localhost:${BACKEND_PORT}/thread`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ title, isPublic, content })
    });
}
export function getThread(token, threadId) {
    return fetch(`http://localhost:${BACKEND_PORT}/thread?id=${threadId}`, {
        method: 'GET',
        headers: { 'Content-type': 'application/json', 'Authorization': token },
    });
}

export function getAllThreads(token, start) {
    return fetch(`http://localhost:${BACKEND_PORT}/threads?start=${start}`, {
        method: 'GET',
        headers: { 'Content-type': 'application/json', 'Authorization': token },
    });
}

export function updateThread(token, id, title, isPublic, lock, content) {
    return fetch(`http://localhost:${BACKEND_PORT}/thread`, {
        method: 'PUT',
        headers: { 'Content-type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ id, title, isPublic, lock, content })
    });
}
export function deleteThread(token, id) {
    return fetch(`http://localhost:${BACKEND_PORT}/thread`, {
        method: 'DELETE',
        headers: { 'Content-type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ id })
    });
}

export function updateLikeStatus(token, id, turnon) {
    return fetch(`http://localhost:${BACKEND_PORT}/thread/like`, {
        method: 'PUT',
        headers: { 'Content-type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ id, turnon })
    });
}

export function watchThread(token, id, turnon) {
    return fetch(`http://localhost:${BACKEND_PORT}/thread/watch`, {
        method: 'PUT',
        headers: { 'Content-type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ id, turnon })
    });
}