import { useState, createRef } from "react";
import { collection, addDoc, getDoc, getDocs, doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore"; 

const RemoteWebCam = ({ peerConnection, firestore, remoteStream, referenceRemote }) => {
  const callInputRef = createRef();

  const onAnswer =async () => { 
    
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

  return (
    <div className="RemoteVideo">
      <span>
        <h3>Remote Stream</h3>
        <video id="webcamVideoRemote" ref={referenceRemote} autoPlay playsInline></video>
      </span>
      <h2>3. Join a Call</h2>
      <p>Answer the call from a different browser window or device</p>

      <input id="callInput" ref={callInputRef} />
      <button id="answerButton" onClick={onAnswer}>Answer</button>
      <h2>4. Hangup</h2>
      <button id="hangupButton">Hangup</button>
    </div>
  );
};
export default RemoteWebCam;
