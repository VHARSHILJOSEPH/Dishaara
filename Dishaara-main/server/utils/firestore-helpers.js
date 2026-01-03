/**
 * Firestore Helper Functions
 * Common utilities for Firestore operations
 */

import { db, docToObject, docsToArray, toDate } from '../firebase/firebase.js';

/**
 * Paginate Firestore query results
 */
export const paginateQuery = async (query, page = 1, limit = 10) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const totalSnapshot = await query.count().get();
  const total = totalSnapshot.data().count;

  // Apply pagination
  const snapshot = await query
    .offset(skip)
    .limit(parseInt(limit))
    .get();

  return {
    data: docsToArray(snapshot.docs),
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
      limit: parseInt(limit)
    }
  };
};

/**
 * Get document by ID
 */
export const getDocById = async (collection, id) => {
  const doc = await db.collection(collection).doc(id).get();
  return docToObject(doc);
};

/**
 * Get documents with filters
 */
export const getDocsWithFilters = async (collection, filters = {}, orderBy = null, orderDirection = 'desc') => {
  let query = db.collection(collection);

  // Apply filters
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && value.operator) {
        // Handle operators like { operator: '>=', value: 100 }
        query = query.where(field, value.operator, value.value);
      } else if (Array.isArray(value) && value.length > 0) {
        // Handle array-contains-any
        query = query.where(field, 'in', value);
      } else if (value instanceof RegExp) {
        // Firestore doesn't support regex directly, we'll filter client-side
        // For now, use array-contains for simple cases
      } else {
        query = query.where(field, '==', value);
      }
    }
  });

  // Apply ordering
  if (orderBy) {
    query = query.orderBy(orderBy, orderDirection);
  }

  const snapshot = await query.get();
  return docsToArray(snapshot.docs);
};

/**
 * Create document
 */
export const createDoc = async (collection, data) => {
  const docRef = db.collection(collection).doc();
  const docData = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await docRef.set(docData);
  return docToObject(await docRef.get());
};

/**
 * Update document
 */
export const updateDoc = async (collection, id, data) => {
  const docRef = db.collection(collection).doc(id);
  const updateData = {
    ...data,
    updatedAt: new Date()
  };
  await docRef.update(updateData);
  return docToObject(await docRef.get());
};

/**
 * Delete document
 */
export const deleteDoc = async (collection, id) => {
  await db.collection(collection).doc(id).delete();
  return true;
};

/**
 * Populate references (Firestore doesn't have populate, so we manually fetch)
 */
export const populateRefs = async (doc, fields = []) => {
  const populated = { ...doc };

  for (const field of fields) {
    if (doc[field] && typeof doc[field] === 'string') {
      try {
        const refDoc = await getDocById(field === 'user' ? 'users' : `${field}s`, doc[field]);
        if (refDoc) {
          populated[field] = refDoc;
        }
      } catch (error) {
        console.error(`Error populating ${field}:`, error);
      }
    }
  }

  return populated;
};

/**
 * Count documents with filters
 */
export const countDocs = async (collection, filters = {}) => {
  let query = db.collection(collection);

  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      query = query.where(field, '==', value);
    }
  });

  const snapshot = await query.count().get();
  return snapshot.data().count;
};

