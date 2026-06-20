// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxluQlapqhYg5-H7Qk0oQZS6dhD-Z7aUk",
  authDomain: "doman-mahjong.firebaseapp.com",
  projectId: "doman-mahjong",
  storageBucket: "doman-mahjong.firebasestorage.app",
  messagingSenderId: "944598759319",
  appId: "1:944598759319:web:d109be28b3999edcf3b6d2",
  measurementId: "G-TQS7J5THQ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);