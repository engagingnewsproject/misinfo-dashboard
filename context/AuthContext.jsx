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
    getUserByEmail
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


    const verifyPrivilege = async (uid) => {
      auth
      .getUserByEmail(uid)
        .then((userRecord) => {
        // The claims can be accessed on the user record.
        console.log(userRecord.customClaims['admin']);

        let customClaims = {
          admin: false,
          agency: false
        }
        if (userRecord.customClaims['admin'] || userRecord.customClaims['agency']) {
          if (userRecord.customClaims['admin'] || userRecord.customClaims['agency']) {
            customClaims = {
              admin: true,
              agency: true
            }
          } else if (userRecord.customClaims['admin']) {
            customClaims = {
              admin: true,
              agency: false
            }
          } else if (userRecord.customClaims['agency']) {
            customClaims = {
              admin: false,
              agency: true
            }
          } 
        } else {
          return customClaims;
        }
        
      });
    }
     const changeRole = async function (uid, role) {
      let customClaims = {
        admin: false,
        agency: false
      }

      if (uid && uid === "juliaelias@utexas.edu") {
        customClaims = {
          admin: true,
          agency: false
        };
      } else {
        customClaims = {
          admin: false,
          agency: false
        }
        console.log("i am in here")
      }

      try {
        // Set custom user claims on this newly created user.
        await auth.setCustomUserClaims(user.uid, customClaims);
  
        // Update real-time database to notify client to force refresh.
        const metadataRef = getDatabase().ref('metadata/' + user.uid);
  
        // Set the refresh time to the current UTC timestamp.
        // This will be captured on the client to force a token refresh.
        await  metadataRef.set({refreshTime: new Date().getTime()});

        
      } catch (error) {
        console.log(error);
      }

      return auth.getUserByEmail(uid)
      .then((userRecord) => {
        // The claims can be accessed on the user record.
        return userRecord.customClaims['admin'];
      });

    }


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
        <AuthContext.Provider value={{ user, login, signup, logout, resetPassword, updatePassword, addAdminRole, changeRole, verifyPrivilege }}>
            {loading ? null : children}
        </AuthContext.Provider>
    )
}