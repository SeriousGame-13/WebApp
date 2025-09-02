/**
 * @fileoverview Firestore Manager Module
 * 
 * This module provides comprehensive Firestore database management functionality for the fitness application.
 * It handles all CRUD operations for Firestore documents including creation, retrieval, updating, and deletion.
 * Additionally, it provides query functionality, timestamp management, and document reference utilities.
 * 
 * The module encapsulates all Firestore operations and provides a clean API with proper error handling
 * for database interactions throughout the application.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import {
    addDoc,
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';

import { firebaseApp } from './FirebaseAppConfiguration';

const db = getFirestore(firebaseApp);

/**
 * Retrieves a document by its ID from a specific Firestore collection.
 * Returns the document data if found, or null if the document doesn't exist.
 * @param {string} collectionName - The name of the Firestore collection to query
 * @param {string} docId - The unique document ID to retrieve
 * @returns {Promise<Object|null>} The document data object if found, null if not found or on error
 */
const readDocument = async (collectionName, docId) => {
    try {
        const docSnap = await getDoc(getDocumentReference(collectionName, docId));
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.warn(`Document with ID ${docId} not found in collection ${collectionName}`);
            return null;
        }
    } catch (error) {
        console.error(`Error getting document from ${collectionName}:`, error);
        return null;
    }
}

/**
 * Creates a new document in a Firestore collection with optional auto-generated or specific ID.
 * Automatically adds creation and update timestamps unless specified otherwise.
 * @param {string} collectionName - The name of the Firestore collection to create the document in
 * @param {Object} data - The data object to store in the document
 * @param {string|null} [docId=null] - Specific document ID to use, or null for auto-generated ID
 * @param {boolean} [addTimestamp=true] - Whether to automatically add createdAt and updatedAt timestamps
 * @returns {Promise<DocumentReference|null>} The document reference if successful, null on error
 */
const createDocument = async (collectionName, data, docId = null, addTimestamp = true) => {
    try {
        const documentReference = getDocumentReference(collectionName, docId);
        const documentData = addTimestamp
            ? {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
            : data;

        if (docId) {
            return await setDocument(documentReference, documentData);
        } else {
            return await createDocumentWithAutoId(collectionName, documentData);
        }
    }
    catch (error) {
        console.error(`Error creating document in ${collectionName}:`, error);
        return null;
    }
}

/**
 * Creates or replaces a document at a specific document reference.
 * Supports merging with existing document data or complete replacement.
 * @param {DocumentReference} documentReference - The Firestore document reference to write to
 * @param {Object} documentData - The data object to store in the document
 * @param {boolean} [merge=true] - Whether to merge with existing document data (true) or replace completely (false)
 * @returns {Promise<DocumentReference|null>} The document reference if successful, null on error
 */
const setDocument = async (documentReference, documentData, merge = true) => {
    try {
        await setDoc(documentReference, documentData, { merge });
        return documentReference;
    } catch (error) {
        console.error(`Error setting document:`, error);
        return null;
    }
}

/**
 * Updates specific fields of an existing document in a Firestore collection.
 * Automatically adds an update timestamp unless specified otherwise.
 * @param {string} collectionName - The name of the Firestore collection containing the document
 * @param {string} docId - The unique document ID to update
 * @param {Object} data - The data fields to update (createdAt will be automatically removed if present)
 * @param {boolean} [addTimestamp=true] - Whether to automatically add an updatedAt timestamp
 * @returns {Promise<DocumentReference|null>} The document reference if successful, null on error
 */
const updateDocument = async (collectionName, docId, data, addTimestamp = true) => {
    try {
        const docRef = getDocumentReference(collectionName, docId);
        delete data.createdAt;
        // Add timestamp if requested
        const documentData = addTimestamp
            ? {
                ...data,
                updatedAt: serverTimestamp()
            }
            : data;

        return await setDocument(docRef, documentData);
    } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        return null;
    }
}

/**
 * Deletes a document from a Firestore collection.
 * Permanently removes the document and all its data from the collection.
 * @param {string} collectionName - The name of the Firestore collection containing the document
 * @param {string} docId - The unique document ID to delete
 * @returns {Promise<DocumentReference|null>} The document reference of the deleted document if successful, null on error
 */
const deleteDocument = async (collectionName, docId) => {
    try {
        const docRef = getDocumentReference(collectionName, docId);
        await deleteDoc(docRef);
        return docRef;
    } catch (error) {
        console.error(`Error deleting document in ${collectionName}:`, error);
        return null;
    }
}

/**
 * Queries documents from a collection where a specific field equals a given value.
 * Returns all documents that match the field-value criteria.
 * @param {string} collectionName - The name of the Firestore collection to query
 * @param {string} field - The field name to filter on
 * @param {any} value - The value that the field must equal for documents to be included
 * @returns {Promise<QuerySnapshot|Array>} QuerySnapshot containing matching documents, or empty array on error
 */
const queryDocumentsByFieldValue = async (collectionName, field, value) => {
    try {
        const q = query(collection(db, collectionName), where(field, '==', value));
        return await getDocs(q);
    } catch (error) {
        console.error(`Error querying ${collectionName}:`, error);
        return [];
    }
}

/**
 * Retrieves all documents from a specified Firestore collection.
 * Returns a QuerySnapshot containing all documents in the collection.
 * @param {string} collectionName - The name of the Firestore collection to retrieve all documents from
 * @returns {Promise<QuerySnapshot|Array>} QuerySnapshot containing all documents in the collection, or empty array on error
 */
const getAllDocuments = async (collectionName) => {
    try {
        const q = query(collection(db, collectionName));
        return await getDocs(q);
    } catch (error) {
        console.error(`Error getting all documents from ${collectionName}:`, error);
        return [];
    }
}

/**
 * Creates a reference to a document in a Firestore collection.
 * Returns a DocumentReference that can be used for document operations.
 * @param {string} collectionName - The name of the Firestore collection
 * @param {string} docId - The unique document ID to create a reference for
 * @returns {DocumentReference|null} Firestore document reference, or null on error
 */
const getDocumentReference = (collectionName, docId) => {
    try {
        return doc(db, collectionName, docId);
    } catch (error) {
        console.error(`Error creating reference to document in ${collectionName}:`, error);
        return null;
    }
}

/**
 * Retrieves a server timestamp from Firebase Firestore.
 * Returns a FieldValue that represents the current server time when the document is written.
 * @returns {FieldValue|null} A Firebase server timestamp FieldValue for use in document operations, or null on error
 */
const getServerTimestamp = () => {
    try {
        return serverTimestamp()
    } catch (error) {
        console.error(`Error getting server Timestamp:`, error);
        return null;
    }
}

/**
 * Creates a new document with an auto-generated ID in a Firestore collection.
 * Uses Firestore's automatic ID generation for the new document.
 * @param {string} collectionName - The name of the Firestore collection to add the document to
 * @param {Object} data - The data object to store in the new document
 * @returns {Promise<DocumentReference|null>} The document reference of the created document if successful, null on error
 */
const createDocumentWithAutoId = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collectionGroup(db, collectionName), data);
        return docRef;
    } catch (error) {
        try {
            const docRef = await addDoc(collection(db, collectionName), data);
            return docRef;
        } catch (error) {
            console.error(`Error creating document in ${collectionName}:`, error);
            return null;
        }
    }
}

/**
 * Finds and returns the first document in a collection where a specific field matches a given value.
 * Uses a limit of 1 to return only the first matching document for efficiency.
 * @param {string} collectionName - The name of the Firestore collection to search in
 * @param {string} field - The field name to search on
 * @param {any} value - The value that the field must match
 * @returns {Promise<Object|null>} The document data with ID if found, null if not found or on error
 */
const findDocumentByField = async (collectionName, field, value) => {
    try {
        const q = query(collection(db, collectionName), where(field, '==', value), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error(`Error finding document in ${collectionName}:`, error);
        return null;
    }
};

/**
 * Frägt Dokumente aus einer Sammlung basierend auf mehreren Bedingungen ab.
 * @param {string} collectionName - Der Name der Firestore-Sammlung, die abgefragt werden soll.
 * @param {Array<Object>} [conditions=[]] - Ein Array von Bedingungsobjekten, z.B. [{ field: 'userId', operator: '==', value: 'someId' }].
 * @returns {Promise<QuerySnapshot|null>} QuerySnapshot mit den passenden Dokumenten oder null bei einem Fehler.
 */
const queryDocuments = async (collectionName, conditions = []) => {
    try {
        const collRef = collectionGroup(db, collectionName);
        const queryConstraints = conditions.map(cond => where(cond.field, cond.operator, cond.value));
        const q = query(collRef, ...queryConstraints);
        return await getDocs(q);
    } catch (error) {
        console.error(`Fehler beim Abfragen von ${collectionName} mit Bedingungen:`, error);
        return null;
    }
};


/**
 * Firestore Manager
 * 
 * Provides comprehensive Firestore database management functionality including:
 * - Document CRUD operations (create, read, update, delete)
 * - Collection querying with field-based filters
 * - Complex multi-condition queries
 * - Document reference management
 * - Server timestamp utilities
 * - Auto-ID document creation
 * - Field-based document searching
 * 
 * All methods include proper error handling and logging for debugging purposes.
 * The module provides a clean abstraction layer over Firestore operations
 * with consistent return patterns and error management.
 * 
 * @namespace FirestoreManager
 */
const FirestoreManager = {
    getDocumentReference,
    createDocument,
    readDocument,
    updateDocument,
    deleteDocument,
    queryDocumentsByFieldValue,
    getAllDocuments,
    getServerTimestamp,
    findDocumentByField,
    queryDocuments
};

export default FirestoreManager;