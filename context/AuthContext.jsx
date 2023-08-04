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
    getUserByEmail,
    sendSignInLinkToEmail
} from 'firebase/auth'


import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";
import { auth, app, db, functions } from '../config/firebase'
import { getDoc, doc } from "firebase/firestore";



const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthContextProvider = ({children}) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          let customClaims = { admin: false, agency: false}
            if (user) {
                const ref = await getDoc(doc(db, "locations", "Texas"))
                const localId = ref.data()['Austin']

                setUser({
                    uid: localId, // not sure what this is used for
                    accountId: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    admin: customClaims.admin,
                    agency: customClaims.agency
                })
                localStorage.setItem("userId", localId)
              
            } else {
              setUser(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])


    // add admin cloud function
    const addAdminRole = httpsCallable(functions, 'addAdminRole')

    const addAgencyRole = httpsCallable(functions, 'addAgencyRole')

    const viewRole = httpsCallable(functions, 'viewRole')

    const addUserRole = httpsCallable(functions, 'addUserRole')

    const signup = (teamName, email, password) => {
        return createUserWithEmailAndPassword(auth, email, password)
    }

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password)
    }

    const logout = async () => {
        setUser(null)
        await signOut(auth)
    }

    const verifyRole = () => {
      return auth.currentUser.getIdTokenResult()
      .then((idTokenResult) => {
         // Confirm the user is an Admin.
          return idTokenResult.claims;        
      }).catch((error) => {
        console.log(error);
      });
      
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
    
    const sendSignIn = async (email) => {
        var actionCodeSettings = {
            // URL you want to redirect back to. The domain (www.example.com) for this URL
            // must be whitelisted in the Firebase Console.
            'url': 'https://misinfo-dashboard.netlify.app/signup', // Here we redirect back to this same page.
            'handleCodeInApp': true // This must be true.
        };
        try
        {
            await sendSignInLinkToEmail(auth,email, actionCodeSettings)
            // The link was successfully sent. Inform the user.
            // Save the email locally so you don't need to ask the user for it again
            // if they open the link on the same device.
            window.localStorage.setItem('emailForSignIn',email)
        } catch (error)
        {
            const errorCode = error.code
            const errorMessage = error.message
        }
    }
 
    return (
        <AuthContext.Provider value={{ user, login, signup, logout, resetPassword, updatePassword, sendSignIn, addAdminRole, addAgencyRole, viewRole, addUserRole }}>
            {loading ? null : children}
        </AuthContext.Provider>
    )
}