import { 
    doc, 
    setDoc, 
    getDoc,
    deleteDoc,
    query,
    where,
    collection,
    getDocs,
    serverTimestamp,
    getFirestore, 
    addDoc,
    limit,
} from 'firebase/firestore';

import { firebaseApp } from './FirebaseAppConfiguration';

const db = getFirestore(firebaseApp);

/**
 * Retrieves a document by ID from a specific collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID to retrieve
 * @returns {Promise<object|null>} Document data object or null if not found
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
 * Creates a new document with an Auto-generated ID or with a specific ID
 * @param {string} collectionName - Name of the Firestore collection
 * @param {object} data - Data to store in the document
 * @param {string} [docId=null] - Specific Document ID to create
 * @param {boolean} [addTimestamp=true] - Whether to add creation and update timestamps
 * @returns {Promise<DocumentReference|null>} Document reference or null on error
 */
const createDocument = async (collectionName, data, docId=null, addTimestamp = true) => {
    try {
        const documentReference = getDocumentReference(collectionName, docId);
        const documentData = addTimestamp 
            ? { ...data, 
                createdAt: serverTimestamp(), 
                updatedAt: serverTimestamp() } 
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
 * Creates or replaces a document with specific reference
 * @param {DocumentReference} documentReference - Firestore document reference
 * @param {object} documentData - Data to store in the document
 * @param {boolean} [merge=true] - Whether to merge with existing document data
 * @returns {Promise<DocumentReference|null>} Document reference or null on error
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
 * Updates parts of an existing document
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID to update
 * @param {object} data - Data fields to update
 * @param {boolean} [addTimestamp=true] - Whether to add an update timestamp
 * @returns {Promise<DocumentReference|null>} Document reference or null on error
 */
const updateDocument = async (collectionName, docId, data, addTimestamp = true) => {
    try {
        const docRef = getDocumentReference(collectionName, docId);
        
        // Add timestamp if requested
        const documentData = addTimestamp 
            ? { ...data, 
                updatedAt: serverTimestamp() } 
            : data;
            
        return await setDocument(docRef, documentData);
    } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        return null;
    }
}

/**
 * Deletes a document from a collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID to delete
 * @returns {Promise<DocumentReference|null>} Document reference or null on error
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
 * Queries documents where field equals a specific value
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} field - Field name to query on
 * @param {any} value - Value to match against the field
 * @returns {Promise<QuerySnapshot|Array>} QuerySnapshot containing matching documents or empty array on error
 */
const queryDocumentsByFieldValue = async (collectionName, field, value) => {
    try {
        const q = query(collection(db, collectionName), where(field, '==', value));
        return await getDocs(q);
        // Dunno if this is correct! #TODO revisit
    } catch (error) {
        console.error(`Error querying ${collectionName}:`, error);
        return [];
    }
}

/**
 * Retrieves all documents from a collection
 * @param {string} collectionName - Name of the Firestore collection
 * @returns {Promise<QuerySnapshot|Array>} QuerySnapshot containing all documents or empty array on error
 */
const getAllDocuments = async (collectionName) => {
    try {
        const q = query(collection(db, collectionName));
        return await getDocs(q);
        // Dunno if this is correct! #TODO revisit
    } catch (error) {
        console.error(`Error getting all documents from ${collectionName}:`, error);
        return [];
    }
}

/**
 * Creates a reference to a document in a collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID to reference
 * @returns {DocumentReference|null} Firestore document reference or null on error
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
 * 
 * This function attempts to get a server timestamp using Firebase's serverTimestamp()
 * function. It handles any errors that might occur during the process.
 * 
 * @returns {firebase.firestore.FieldValue|null} A Firebase server timestamp FieldValue 
 * that can be used in document operations, or null if an error occurs.
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
 * Creates a new document with an auto-generated ID in the specified Firestore collection.
 * 
 * @param {string} collectionName - The name of the Firestore collection to add the document to
 * @param {object} data - The data to be stored in the document
 * @returns {Promise<import('firebase/firestore').DocumentReference|null>} A Promise that resolves to the document reference if successful, or null if an error occurs
 */
const createDocumentWithAutoId = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        return docRef;
    } catch (error) {
        console.error(`Error creating document in ${collectionName}:`, error);
        return null;
    }
}

/**
 * find one Doc containts given value
 * @param {string} collectionName - Collection name
 * @param {string} field - Doc name
 * @param {any} value - Value
 * @returns {Promise<object|null>} Data found
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
};

export default FirestoreManager;