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
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Read a document by ID from a specific collection
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

// Create a new document with auto-generated ID
const createDocument = async (collectionName, docId, data, addTimestamp = true) => {
    try {
        const documentReference = getDocumentReference(collectionName, docId);
        const documentData = addTimestamp 
            ? { ...data, 
                createdAt: serverTimestamp(), 
                updatedAt: serverTimestamp() } 
            : data;

        return await setDocument(documentReference, documentData);
    } catch (error) {
        console.error(`Error creating document in ${collectionName}:`, error);
        return null;
    }
}

// Create or replace a document with specific ID
const setDocument = async (documentReference, documentData, merge = true) => {
    try {
        await setDoc(documentReference, documentData, { merge });
        return documentReference;
    } catch (error) {
        console.error(`Error setting document in ${collectionName}:`, error);
        return null;
    }
}

// Update parts of an existing document
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

// Delete a document
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

// Query documents by field value
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

// Get all documents from a collection
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

// Get document reference
const getDocumentReference = (collectionName, docId) => {
    try {
        return doc(db, collectionName, docId);
    } catch (error) {
        console.error(`Error creating reference to document in ${collectionName}:`, error);
        return null;
    }
}

const FirestoreManager = {
    getDocumentReference,
    createDocument,
    readDocument,
    updateDocument,
    deleteDocument,
    queryDocumentsByFieldValue,
    getAllDocuments
};

export default FirestoreManager;