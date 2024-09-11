import { createContext, useContext, useEffect, useState } from 'react'
import { 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    reauthenticateWithCredential,
    updatePassword,
    updateEmail,
    signOut,
    sendPasswordResetEmail,
    deleteUser,
    sendSignInLinkToEmail,
    sendEmailVerification,
    EmailAuthProvider
} from 'firebase/auth'


import {
  httpsCallable,
} from "firebase/functions";
import { auth, app, db, functions } from '../config/firebase'
import { getDoc, doc, setDoc } from "firebase/firestore";
import moment from 'moment'


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

  const addAgencyRole = httpsCallable(functions, 'addAgencyRole')

  const viewRole = httpsCallable(functions, 'viewRole')

  const addUserRole = httpsCallable(functions, 'addUserRole')
  
  const getUserByEmail = httpsCallable(functions,'getUserByEmail')
    
  const deleteUser = httpsCallable(functions,'deleteUser')
  
  const disableUser = httpsCallable(functions,'disableUser')
  
  const getUserRecord = httpsCallable(functions, 'getUserRecord');
  
  const authGetUserList = httpsCallable(functions, 'authGetUserList')
  
  const fetchUserRecord = async (uid) => {
    try {
      // Get user data by passing the UID
      const result = await getUserRecord({ uid });
      return result.data;
    } catch (error) {
      console.log(`Error fetching Auth user record uid: ${uid}`, error);
      // User not found or deleted, treat as disabled
      if (error.code === 'functions/not-found') {
        return { disabled: true };
      } else {
        throw error;
      }
    }
  }
  
  const verifyEmail = (user) => {
    return new Promise((resolve, reject) => {
      var actionCodeSettings = {
        'url': 'https://truthsleuthlocal.netlify.app/login',
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

  const signup = (name, email, password, state, city) => {
		return new Promise((resolve, reject) => {
			// Create a new Promise that wraps the asynchronous user creation process
			createUserWithEmailAndPassword(auth, email, password) // Attempt to create a new user with the provided email and password
				.then((userCredential) => {
					// If user creation is successful, execute the following callback function with the userCredential object
					// Perform email verification after user creation
					verifyEmail(userCredential.user) // Verify the user's email address
						.then((verified) => {
							// If email verification is successful, execute the following callback function with the 'verified' boolean value
							if (verified) {
                console.log("verified")
								// If the email is verified, proceed with the following actions
								// const uid = userCredential.user.uid // Extract the UID (unique identifier) of the newly created user
								// const mobileUserDocRef = doc(db, "mobileUsers", uid) // Create a reference to the document in the 'mobileUsers' collection with the user's UID
								// const userData = {
								// 	// Define the data to be stored in the user document
                //   name: data.name,
                //   email: data.email,
                //   phone: (data.phone ? data.phone : ""),
                //   joiningDate: moment().utc().unix(),
                //   state: data.state,
                //   city: data.city,
                //   isBanned: false,
                //   userRole: privilege,
                //   contact: data.contact
								// }
								// Create a new document in the 'mobileUsers' collection with the provided user data
								// setDoc(mobileUserDocRef, userData)
								// 	.then(() => {
										resolve(userCredential) // If document creation is successful, resolve the Promise with the userCredential object
									// })
									// .catch((error) => {
                  //   console.log("doc error")
									// 	reject(error) // If there's an error creating the document, reject the Promise with the error
									// })
							} else {
								reject(new Error("Email verification failed")) // If email verification fails, reject the Promise with an error
							}
						})
						.catch((error) => {
							reject(error) // Forward any errors from email verification
						})
				})
				.catch((error) => {
					reject(error) // Forward any errors from user creation
				})
		})
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

    const disableUserFunction = async (userId) => {
        try {
            const result = await disableUser({ uid: userId });
            console.log('User disabled:', result.data.message);
            return result.data;
        } catch (error) {
            console.error('Error disabling user:', error);
            throw error;
        }
    }

  
    const updateUserPassword = (auth, currentPassword, newPassword) => {
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        return new Promise((resolve, reject) => {
          reauthenticateWithCredential(auth.currentUser, credential).then(() => {
            resolve(updatePassword(auth.currentUser, newPassword))
          }).catch((error) => {
            reject(error)
          })
        })
        
    }

    const updateUserEmail = (auth, currentPassword, newEmail) => {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      return new Promise((resolve, reject) => {
        reauthenticateWithCredential(auth.currentUser, credential).then(() => {
          resolve(updateEmail(auth.currentUser, newEmail))
        }).catch((error) => {
          reject(error)
        })
      })
  }

    const setPassword = async (newPassword) => {
      // console.log(newPassword)
      // console.log(user?.email)
      // console.log("in set password " + auth.currentUser.email)
      try {
        await updatePassword(auth.currentUser, newPassword);
        auth.currentUser.getIdToken(true)
        console.log("success")
      } catch (err) {
        console.log(err)

      }
      
    }
    
  const sendSignIn = async (email) => {
		// Determine the base URL based on the environment
		const isLocalhost = window.location.hostname === 'localhost'
		const baseUrl = isLocalhost
			? 'http://localhost:3000/signup'
			: 'https://truthsleuthlocal.netlify.app/signup'

		var actionCodeSettings = {
			// URL you want to redirect back to. The domain for this URL must be whitelisted in the Firebase Console.
			url: baseUrl,
			handleCodeInApp: true, // This must be true.
		}
    try {
      await sendSignInLinkToEmail(auth,email,actionCodeSettings)
      // The link was successfully sent. Inform the user.
      // Save the email locally so you don't need to ask the user for it again
      // if they open the link on the same device.
      window.localStorage.setItem('emailForSignIn',email)
      console.log("Sign-in link sent to:", email);
    } catch (error) {
      const errorMessage = error.message
      console.error("Error sending sign-in link:",errorMessage);
      throw error; // Throw the error so it can be caught by the calling function
    }
	}
 
    return (
        <AuthContext.Provider value={{ user, customClaims, setCustomClaims, login, signup, logout, resetPassword, deleteAdminUser, updateUserPassword, updateUserEmail, setPassword, verifyEmail, sendSignIn, addAdminRole, addAgencyRole, verifyRole, viewRole, addUserRole, getUserByEmail, deleteUser, disableUser: disableUserFunction, fetchUserRecord, getUserRecord, authGetUserList }}>
            {loading ? null : children}
        </AuthContext.Provider>
    )
}