const createGroup = async (nickname, id) => {
    const userCredential = await createUserWithEmailAndPassword(auth, id, password);
    const user = userCredential.user;

    await updateProfile(userCredential.user, {
        displayName: nickname
    });

    await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: id,
        displayName: nickname,
        createdAt: serverTimestamp(),
        isActive: true,
        level: 1,
        points: 0,
        longestStreak: 0
    });

    return user;
};
