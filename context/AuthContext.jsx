import { createContext, useContext, useEffect, useState } from 'react'
import { 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    reauthenticateWithCredential,
    updatePassword,
    signOut,
    sendPasswordResetEmail,
    deleteUser,
    sendSignInLinkToEmail,
    sendEmailVerification,
} from 'firebase/auth'


import {
  httpsCallable,
} from "firebase/functions";
import { auth, app, db, functions } from '../config/firebase'
import { getDoc, doc } from "firebase/firestore";



const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthContextProvider = ({children}) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState('user')
    const [customClaims, setCustomClaims] = useState({agency: false, admin: false})
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          // let customClaims = { admin: false, agency: false}
            if (user) {
                const ref = await getDoc(doc(db, "locations", "Texas"))
                const localId = ref.data()['Austin']
                setUser({
                    uid: localId, // not sure what this is used for
                    accountId: user.uid,
                    displayName: user.displayName,
                    email: user.email
                })
                localStorage.setItem("userId", localId)
                user.getIdTokenResult(true)

                .then((idTokenResult) => {
                  // console.log("getting custom claims")
                  // console.log(idTokenResult)
                  // Confirm the user is an Admin.
                  if (!!idTokenResult.claims.admin) {
                    // Show admin UI.
                    setCustomClaims({admin: true})
                  } else if (!!idTokenResult.claims.agency) {
                    // Show regular user UI.
                    setCustomClaims({agency: true})
                  } else {
                    setCustomClaims({agency: false, admin: false})
                  }
                })
                .catch((error) => {
                  console.log(error);
                });
              
            } else {
              setUser(null)
              setCustomClaims({agency: false, admin: false})

            }
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])


    // add admin cloud function
  const addAdminRole = httpsCallable(functions,'addAdminRole')
  
    const changeUserRole = httpsCallable(functions, 'changeUserRole')

    const addAgencyRole = httpsCallable(functions, 'addAgencyRole')

    const viewRole = httpsCallable(functions, 'viewRole')

    const addUserRole = httpsCallable(functions, 'addUserRole')
    
  const getUserByEmail = httpsCallable(functions,'getUserByEmail')
  
  const verifyEmail = (user) => {
    return new Promise((resolve, reject) => {
      var actionCodeSettings = {
        'url': 'https://misinfo-dashboard.netlify.app/login',
        'handleCodeInApp': true,
      };

      sendEmailVerification(user, actionCodeSettings)
        .then(() => {
          resolve(true); // Email sent successfully
        })
        .catch((error) => {
          reject(error); // Email sending failed
        });
    });
  }

  const signup = (teamName, email, password) => {
    return new Promise((resolve, reject) => {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Perform email verification after user creation
          verifyEmail(userCredential.user)
            .then((verified) => {
              // If email is verified, resolve with user credential
              if (verified) {
                resolve(userCredential);
              } else {
                reject(new Error('Email verification failed'));
              }
            })
            .catch((error) => {
              reject(error); // Forward any verification errors
            });
        })
        .catch((error) => {
          reject(error); // Forward any errors from user creation
        });
    });
  }

    const login = (email, password) => {
      return signInWithEmailAndPassword(auth, email, password);
    }

    const logout = async () => {
        setUser(null)
        return signOut(auth);
    }

    const verifyRole = async () => {
        try {
            const idTokenResult = await auth.currentUser.getIdTokenResult()
            return idTokenResult.claims
        } catch (error) {
            console.log(error)
        }
    }
    
    const resetPassword = (email) => {
        return sendPasswordResetEmail(auth, email)
    }

    const deleteAdminUser = (user) => {
        return deleteUser(user)
    }

    const updateUserPassword = (auth, currentPassword, newPassword) => {
        reauthenticateWithCredential(auth, user.email, currentPassword).then(() => {
            return updatePassword(auth, newPassword)
        }).catch((error) => {
            return error
        })
    }

    const setPassword = async (newPassword) => {
      console.log(newPassword)
      console.log(user?.email)
      console.log("in set password " + auth.currentUser.email)
      try {
        await updatePassword(auth.currentUser, newPassword);
        auth.currentUser.getIdToken(true)
        console.log("success")
      } catch (err) {
        console.log(err)

      }
      
    }
    
    const sendSignIn = async (email) => {
        var actionCodeSettings = {
            // URL you want to redirect back to. The domain (www.example.com) for this URL
            // must be whitelisted in the Firebase Console.
            // 'url': 'http://localhost:3000/signup',

            'url': 'https://misinfo-dashboard.netlify.app/signup',
            // 'url': 'https://misinfo-dashboard.netlify.app/signup', // Here we redirect back to this same page.
            'handleCodeInApp': true, // This must be true.
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings)
        .then(() => {
            // The link was successfully sent. Inform the user.
            // Save the email locally so you don't need to ask the user for it again
            // if they open the link on the same device.
            window.localStorage.setItem('emailForSignIn', email);
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorMessage)
        });
    }
 
    return (
        <AuthContext.Provider value={{ user, customClaims, setCustomClaims, login, signup, logout, resetPassword, deleteAdminUser, updateUserPassword, setPassword, verifyEmail, sendSignIn, addAdminRole, changeUserRole, addAgencyRole, verifyRole, viewRole, addUserRole, getUserByEmail }}>
            {loading ? null : children}
        </AuthContext.Provider>
    )
}