import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
    apiKey: "AIzaSyDy_GIE1tTJIpQbupFoaDKIwxUHZmFHTRk",
    authDomain: "krishna-emitra-ead25.firebaseapp.com",
    projectId: "krishna-emitra-ead25",
    storageBucket: "krishna-emitra-ead25.firebasestorage.app",
    messagingSenderId: "450237489731",
    appId: "1:450237489731:web:7d3ed78e17596703f2eaf6",
    measurementId: "G-36Q7HZ13S0"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export default app
