import { createContext, useContext, useEffect, useState } from 'react'
import { 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    reauthenticateWithCredential,
    updatePassword,
    updateProfile,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    EmailAuthProvider

} from 'firebase/auth'
import { auth, app, db } from '../config/firebase'
import { getDoc, doc } from "firebase/firestore";

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthContextProvider = ({children}) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const ref = await getDoc(doc(db, "locations", "Texas"))
                const localId = ref.data()['Austin']
                setUser({
                    uid: localId,
                    accountId: user.uid,
                    displayName: user.displayName,
                    email: user.email
                })
                localStorage.setItem("userId", localId)
            } else {
                setUser(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const signup = (teamName, email, password) => {
        createUserWithEmailAndPassword(auth, email, password).then((userCredential)=> {
          
          return verifyEmail(userCredential.user)
        }).catch((error) => {
          return error
        })
    }

    const verifyEmail = (user) => {
  
      sendEmailVerification(user).then((task)=> {
        if (task.isSuccessful()) {
          return true;
        } else {
          return false;
        }
    }).catch((error) => {
      return error
      })
    }
    const login = (email, password) => {
      return signInWithEmailAndPassword(auth, email, password);
    }

    const logout = async () => {
        setUser(null)
        await signOut(auth)
    }

    const resetPassword = (email) => {
        return sendPasswordResetEmail(auth, email)
    }

    const updatePassword = (auth, currentPassword, newPassword) => {
        reauthenticateWithCredential(auth, user.email, currentPassword).then(() => {
            return updatePassword(auth, newPassword)
        }).catch((error) => {
            return error
        })
    }
 
    return (
        <AuthContext.Provider value={{ user, login, signup, logout, resetPassword, updatePassword, verifyEmail }}>
            {loading ? null : children}
        </AuthContext.Provider>
    )
}