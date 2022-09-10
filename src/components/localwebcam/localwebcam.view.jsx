import { useState, createRef } from "react";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
  updateDoc
} from "firebase/firestore";
import RemoteWebCam from "../remotewebcam/remotewebcam.view";
const LocalWebCam = ({
  peerConnection,
  firestore,
  localStream,
  remoteStream,
}) => {
  const [remoteIn, setRemote] = useState(false);
  const webCamRef = createRef();
  const remoteCamRef = createRef();
  const callInputRef = createRef();
  const onAnswer = async () => { 
    
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    remoteStream = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to video stream
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    webCamRef.current.srcObject = localStream;
    remoteCamRef.current.srcObject = remoteStream;
    
    const callId = callInputRef.current.value
    const callDoc = doc(collection(firestore,'calls'),callId);
    const answerCandidates = collection(callDoc,'answerCandidates');
    const offerCandidates = collection(callDoc, 'offerCandidates');

    peerConnection.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidates,event.candidate.toJSON());
    };
  
    const callDataDoc = await getDoc(callDoc)
    console.log(callDataDoc)
    const callData = callDataDoc.data();
  
    const offerDescription = callData.offer;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));
  
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);
  
    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };
  
    await updateDoc(callDoc,{ answer });
  
    onSnapshot(offerCandidates,(snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log(change);
        if (change.type === 'added') {
          let data = change.doc.data();
          peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  

  }
  const callClick = async (e) => {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    remoteStream = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to video stream
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    webCamRef.current.srcObject = localStream;
    remoteCamRef.current.srcObject = remoteStream;

    const callDoc = doc(collection(firestore, "calls"));
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    // Get candidates for caller, save to db
    peerConnection.onicecandidate = (event) => {
      event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDoc, { offer });

    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!peerConnection.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        peerConnection.setRemoteDescription(answerDescription);
      }
    });

    // When answered, add candidate to peer connection
    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnection.addIceCandidate(candidate);
        }
      });
    });
  };
  return (
    <div className='calls'>
      <div className="LocalVideo">
        <span>
          <h3>Local Stream</h3>
          <video id="webcamVideo" autoPlay playsInline ref={webCamRef}></video>
        </span>
        <h2>2. Create a new Call</h2>
        <button id="callButton" onClick={callClick}>
          Create Call (offer)
        </button>
      </div>
      <div className="RemoteVideo">
        <span>
          <h3>Remote Stream</h3>
          <video
            id="webcamVideoRemote"
            ref={remoteCamRef}
            autoPlay
            playsInline
          ></video>
        </span>
        <h2>3. Join a Call</h2>
        <p>Answer the call from a different browser window or device</p>

        <input id="callInput" ref={callInputRef} />
        <button id="answerButton" onClick={onAnswer}>
          Answer
        </button>
        <h2>4. Hangup</h2>
        <button id="hangupButton">Hangup</button>
      </div>
    </div>
  );
};

export default LocalWebCam;
