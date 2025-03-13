import { BACKEND_PORT } from './config.js';

export function getComments(token, threadId) {
    return fetch(`http://localhost:${BACKEND_PORT}/comments?threadId=${threadId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
    });
}

export function postComment(token, content, threadId, parentCommentId) {
    return fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ content, threadId, parentCommentId })
    });
}

export function likeComment(token, id, turnon) {
    return fetch(`http://localhost:${BACKEND_PORT}/comment/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ id, turnon })
    });
}

export function editComment(token, id, content) {
    return fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ id, content })
    });
}

export function deleteComment(token, id) {
    return fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ id })
    });
}