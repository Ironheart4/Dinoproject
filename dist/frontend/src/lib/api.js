"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDinos = fetchDinos;
exports.createDino = createDino;
exports.updateDino = updateDino;
exports.deleteDino = deleteDino;
exports.fetchProducts = fetchProducts;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.fetchQuizzes = fetchQuizzes;
exports.createQuiz = createQuiz;
exports.deleteQuiz = deleteQuiz;
exports.fetchOrders = fetchOrders;
exports.createOrder = createOrder;
exports.updateOrder = updateOrder;
const BASE = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE ? import.meta.env.VITE_API_BASE : 'http://localhost:5000';
function getHeaders(token) {
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}
// Dinosaurs
async function fetchDinos() {
    const res = await fetch(`${BASE}/api/dinosaurs`);
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function createDino(payload) {
    const res = await fetch(`${BASE}/api/dinosaurs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function updateDino(id, payload) {
    const res = await fetch(`${BASE}/api/dinosaurs/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function deleteDino(id) {
    const res = await fetch(`${BASE}/api/dinosaurs/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
// Products
async function fetchProducts() {
    const res = await fetch(`${BASE}/api/products`);
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function createProduct(payload, token) {
    const res = await fetch(`${BASE}/api/products`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function updateProduct(id, payload, token) {
    const res = await fetch(`${BASE}/api/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function deleteProduct(id, token) {
    const res = await fetch(`${BASE}/api/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(token),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
// Quizzes
async function fetchQuizzes() {
    const res = await fetch(`${BASE}/api/quizzes`);
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function createQuiz(payload, token) {
    const res = await fetch(`${BASE}/api/quizzes`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function deleteQuiz(id, token) {
    const res = await fetch(`${BASE}/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(token),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
// Orders
async function fetchOrders(token) {
    const res = await fetch(`${BASE}/api/orders`, {
        headers: getHeaders(token),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function createOrder(payload, token) {
    const res = await fetch(`${BASE}/api/orders`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function updateOrder(id, status, token) {
    const res = await fetch(`${BASE}/api/orders/${id}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ status }),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
//# sourceMappingURL=api.js.map