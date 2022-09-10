import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import LocalWebCam from "./components/localwebcam/localwebcam.view";
import RemoteWebCam from "./components/remotewebcam/remotewebcam.view";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, addDoc } from "firebase/firestore"; 

function App() {
  const [count, setCount] = useState(0);
  
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpws75GMK2DHdTxba4KLOcNNvEvrmGK1I",
  authDomain: "krafto-4e237.firebaseapp.com",
  databaseURL: "https://krafto-4e237.firebaseio.com",
  projectId: "krafto-4e237",
  storageBucket: "krafto-4e237.appspot.com",
  messagingSenderId: "1069042045582",
  appId: "1:1069042045582:web:79485f119437532bccefdf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const servers = {

  iceServers: [
  {
      urls: ['turn:10.0.2.15:3478'],
      username: 'test',
      credential: 'test123'
  }
  ],
  iceCandidatePoolSize: 10

}
  let pc = new RTCPeerConnection(servers)
  let localStream = null
  let remoteStream = null
  

  return (
    <div className="App">
      <LocalWebCam peerConnection={pc} firestore={db} localStream={ localStream} remoteStream={remoteStream} />
    </div>
  );
}



export default App;
