/**
 * @fileoverview Test suite for FirestoreManager
 * 
 * This test suite provides comprehensive testing for the Firestore Manager,
 * including document CRUD operations, querying, timestamp management, and error handling.
 * All Firestore dependencies are mocked to enable isolated unit testing.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

// Mock Firebase configuration first
vi.mock('../services/firebase/FirebaseAppConfiguration', () => ({
    firebaseApp: {}
}));

// Define mockDocId and mockDocData inside factory function to avoid hoisting issues
vi.mock('firebase/firestore', () => {
    // Mock data for testing defined inside the factory
    const mockDocData = {
        name: 'Test Document',
        value: 123,
        isActive: true
    };
    
    const mockDocId = 'test-doc-123';
    
    // Create mock document snapshot
    const mockDocSnapshot = {
        exists: vi.fn(() => true),
        data: vi.fn(() => mockDocData),
        id: mockDocId
    };

    // Create mock query snapshot
    const mockQuerySnapshot = {
        empty: false,
        docs: [mockDocSnapshot],
        forEach: vi.fn(callback => {
            callback(mockDocSnapshot);
            return mockQuerySnapshot;
        })
    };

    // Mock timestamp
    const mockTimestamp = { type: 'timestamp' };

    return {
        getFirestore: vi.fn(() => ({})),
        doc: vi.fn(() => 'mock-doc-reference'),
        setDoc: vi.fn(),
        getDoc: vi.fn(() => Promise.resolve(mockDocSnapshot)),
        deleteDoc: vi.fn(),
        query: vi.fn(() => 'mock-query'),
        where: vi.fn(() => 'mock-where-clause'),
        collection: vi.fn(() => 'mock-collection'),
        getDocs: vi.fn(() => Promise.resolve(mockQuerySnapshot)),
        serverTimestamp: vi.fn(() => mockTimestamp),
        addDoc: vi.fn(() => Promise.resolve({
            id: 'auto-generated-id',
            path: 'collection/auto-generated-id'
        })),
        limit: vi.fn(() => 'mock-limit'),
        // Export mock data for tests
        __mockData: mockDocData,
        __mockDocId: mockDocId,
        __docSnapshot: mockDocSnapshot,
        __querySnapshot: mockQuerySnapshot,
        __mockTimestamp: mockTimestamp
    };
});

// Import after mocks are set up
import FirestoreManager from '../services/firebase/FirestoreManager';

describe('FirestoreManager', () => {
    // Test-local mock data that we'll use for assertions
    const mockDocData = {
        name: 'Test Document',
        value: 123,
        isActive: true
    };
    
    const mockDocId = 'test-doc-123';
    
    // Access to mocked Firestore functions
    let mockFirestore;

    beforeEach(async () => {
        // Reset all mocks before each test
        vi.clearAllMocks();
        
        // Get reference to mock Firestore functions
        mockFirestore = await import('firebase/firestore');
        
        // Mock console methods to suppress logs in tests
        console.error = vi.fn();
        console.warn = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('readDocument', () => {
        test('should successfully read an existing document', async () => {
            // Configure mock to return a document that exists
            const { getDoc, __docSnapshot } = mockFirestore;
            __docSnapshot.exists.mockReturnValue(true);
            __docSnapshot.data.mockReturnValue(mockDocData);
            
            const result = await FirestoreManager.readDocument('testCollection', mockDocId);
            
            expect(getDoc).toHaveBeenCalled();
            expect(result).toEqual(mockDocData);
        });

        test('should return null for non-existent document', async () => {
            // Configure mock to return a document that doesn't exist
            const { getDoc, __docSnapshot } = mockFirestore;
            __docSnapshot.exists.mockReturnValue(false);
            
            const result = await FirestoreManager.readDocument('testCollection', 'non-existent-id');
            
            expect(getDoc).toHaveBeenCalled();
            expect(result).toBeNull();
            expect(console.warn).toHaveBeenCalled();
        });

        test('should handle errors during document read', async () => {
            // Configure mock to throw an error
            const { getDoc } = mockFirestore;
            const error = new Error('Read error');
            getDoc.mockRejectedValue(error);
            
            const result = await FirestoreManager.readDocument('testCollection', mockDocId);
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('createDocument', () => {
        test('should create document with provided ID and timestamps', async () => {
            const { setDoc, serverTimestamp } = mockFirestore;
            
            const result = await FirestoreManager.createDocument('testCollection', mockDocData, mockDocId);
            
            expect(setDoc).toHaveBeenCalled();
            // Verify timestamps were added
            expect(serverTimestamp).toHaveBeenCalled();
            expect(result).toBe('mock-doc-reference');
        });

        test('should create document with auto-generated ID', async () => {
            const { addDoc } = mockFirestore;
            
            const result = await FirestoreManager.createDocument('testCollection', mockDocData);
            
            expect(addDoc).toHaveBeenCalled();
            expect(result).toEqual({
                id: 'auto-generated-id',
                path: 'collection/auto-generated-id'
            });
        });

        test('should create document without timestamps when specified', async () => {
            const { setDoc, serverTimestamp } = mockFirestore;
            
            await FirestoreManager.createDocument('testCollection', mockDocData, mockDocId, false);
            
            expect(setDoc).toHaveBeenCalled();
            // Verify timestamps were not added
            expect(serverTimestamp).not.toHaveBeenCalled();
        });

        test('should handle errors during document creation', async () => {
            const { setDoc } = mockFirestore;
            const error = new Error('Creation error');
            setDoc.mockRejectedValue(error);
            
            const result = await FirestoreManager.createDocument('testCollection', mockDocData, mockDocId);
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('updateDocument', () => {
        test('should update document with timestamp', async () => {
            const { setDoc, serverTimestamp } = mockFirestore;
            
            const result = await FirestoreManager.updateDocument('testCollection', mockDocId, { value: 456 });
            
            expect(setDoc).toHaveBeenCalled();
            expect(serverTimestamp).toHaveBeenCalled();
            expect(result).toBe('mock-doc-reference');
        });

        test('should remove createdAt field from update data', async () => {
            const { setDoc } = mockFirestore;
            const updateData = { value: 789, createdAt: 'should-be-removed' };
            
            await FirestoreManager.updateDocument('testCollection', mockDocId, updateData);
            
            // Verify createdAt was removed from the data passed to setDoc
            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.not.objectContaining({ createdAt: 'should-be-removed' }),
                expect.anything()
            );
        });

        test('should handle errors during document update', async () => {
            const { setDoc } = mockFirestore;
            const error = new Error('Update error');
            setDoc.mockRejectedValue(error);
            
            const result = await FirestoreManager.updateDocument('testCollection', mockDocId, { value: 456 });
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('deleteDocument', () => {
        test('should delete document successfully', async () => {
            const { deleteDoc } = mockFirestore;
            
            const result = await FirestoreManager.deleteDocument('testCollection', mockDocId);
            
            expect(deleteDoc).toHaveBeenCalled();
            expect(result).toBe('mock-doc-reference');
        });

        test('should handle errors during document deletion', async () => {
            const { deleteDoc } = mockFirestore;
            const error = new Error('Delete error');
            deleteDoc.mockRejectedValue(error);
            
            const result = await FirestoreManager.deleteDocument('testCollection', mockDocId);
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('queryDocumentsByFieldValue', () => {
        test('should query documents by field value successfully', async () => {
            const { query, where, getDocs } = mockFirestore;
            
            const result = await FirestoreManager.queryDocumentsByFieldValue('testCollection', 'name', 'Test Document');
            
            expect(query).toHaveBeenCalled();
            expect(where).toHaveBeenCalledWith('name', '==', 'Test Document');
            expect(getDocs).toHaveBeenCalled();
            expect(result).toEqual(mockFirestore.__querySnapshot);
        });

        test('should handle errors during query', async () => {
            const { getDocs } = mockFirestore;
            const error = new Error('Query error');
            getDocs.mockRejectedValue(error);
            
            const result = await FirestoreManager.queryDocumentsByFieldValue('testCollection', 'name', 'Test Document');
            
            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('getAllDocuments', () => {
        test('should get all documents from collection successfully', async () => {
            const { query, getDocs } = mockFirestore;
            
            const result = await FirestoreManager.getAllDocuments('testCollection');
            
            expect(query).toHaveBeenCalled();
            expect(getDocs).toHaveBeenCalled();
            expect(result).toEqual(mockFirestore.__querySnapshot);
        });

        test('should handle errors during retrieval of all documents', async () => {
            const { getDocs } = mockFirestore;
            const error = new Error('Get all error');
            getDocs.mockRejectedValue(error);
            
            const result = await FirestoreManager.getAllDocuments('testCollection');
            
            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('getDocumentReference', () => {
        test('should get document reference successfully', () => {
            const { doc } = mockFirestore;
            
            const result = FirestoreManager.getDocumentReference('testCollection', mockDocId);
            
            expect(doc).toHaveBeenCalled();
            expect(result).toBe('mock-doc-reference');
        });

        test('should handle errors when getting document reference', () => {
            const { doc } = mockFirestore;
            const error = new Error('Reference error');
            doc.mockImplementation(() => {
                throw error;
            });
            
            const result = FirestoreManager.getDocumentReference('testCollection', mockDocId);
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('getServerTimestamp', () => {
        test('should get server timestamp successfully', () => {
            const { serverTimestamp } = mockFirestore;
            
            const result = FirestoreManager.getServerTimestamp();
            
            expect(serverTimestamp).toHaveBeenCalled();
            expect(result).toEqual(mockFirestore.__mockTimestamp);
        });

        test('should handle errors when getting server timestamp', () => {
            const { serverTimestamp } = mockFirestore;
            const error = new Error('Timestamp error');
            serverTimestamp.mockImplementation(() => {
                throw error;
            });
            
            const result = FirestoreManager.getServerTimestamp();
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('findDocumentByField', () => {
        test('should find document by field successfully', async () => {
            const { query, where, limit, getDocs, __querySnapshot, __docSnapshot } = mockFirestore;
            __querySnapshot.empty = false;
            
            const result = await FirestoreManager.findDocumentByField('testCollection', 'name', 'Test Document');
            
            expect(query).toHaveBeenCalled();
            expect(where).toHaveBeenCalledWith('name', '==', 'Test Document');
            expect(limit).toHaveBeenCalledWith(1);
            expect(getDocs).toHaveBeenCalled();
            expect(result).toEqual({
                id: mockDocId,
                ...mockDocData
            });
        });

        test('should return null when no document matches the field value', async () => {
            const { getDocs, __querySnapshot } = mockFirestore;
            // Simulate empty query result
            __querySnapshot.empty = true;
            
            const result = await FirestoreManager.findDocumentByField('testCollection', 'name', 'Non-existent');
            
            expect(result).toBeNull();
        });

        test('should handle errors during find operation', async () => {
            const { getDocs } = mockFirestore;
            const error = new Error('Find error');
            getDocs.mockRejectedValue(error);
            
            const result = await FirestoreManager.findDocumentByField('testCollection', 'name', 'Test Document');
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should properly log and handle errors', async () => {
            const { getDoc } = mockFirestore;
            const error = new Error('Database error');
            getDoc.mockRejectedValue(error);
            
            const result = await FirestoreManager.readDocument('testCollection', mockDocId);
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Error getting document'), 
                error
            );
        });
    });

    describe('Integration Tests', () => {
        test('should handle complete CRUD flow', async () => {
            const { 
                doc, 
                setDoc, 
                getDoc, 
                deleteDoc, 
                serverTimestamp
            } = mockFirestore;
            
            // Test document creation
            const createResult = await FirestoreManager.createDocument('testCollection', mockDocData, mockDocId);
            expect(setDoc).toHaveBeenCalled();
            expect(createResult).toBe('mock-doc-reference');
            
            // Test document read
            const readResult = await FirestoreManager.readDocument('testCollection', mockDocId);
            expect(getDoc).toHaveBeenCalled();
            expect(readResult).toEqual(mockDocData);
            
            // Test document update
            const updateResult = await FirestoreManager.updateDocument('testCollection', mockDocId, { value: 789 });
            expect(setDoc).toHaveBeenCalled();
            expect(updateResult).toBe('mock-doc-reference');
            
            // Test document deletion
            const deleteResult = await FirestoreManager.deleteDocument('testCollection', mockDocId);
            expect(deleteDoc).toHaveBeenCalled();
            expect(deleteResult).toBe('mock-doc-reference');
        });
    });
});
