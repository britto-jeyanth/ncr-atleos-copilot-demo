import React, { useState, useContext } from 'react';
import { Container } from 'reactstrap';
import { CommandBarButton, IconButton, Dialog, DialogType, Stack } from "@fluentui/react";
//import { getTokenOrRefresh } from './token_util';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import { AppStateContext } from "../../state/AppProvider";

import axios from 'axios';
import Cookie from 'universal-cookie';
import {
    ChatMessage,
    Conversation
} from "../../api";
import uuid from 'react-uuid';


export async function getTokenOrRefresh() {
    const cookie = new Cookie();
    const speechToken = cookie.get('speech-token');

    if (speechToken === undefined) {
        try {
            const res = await axios.get('/api/get-speech-token');
            const token = res.data.token;
            const region = res.data.region;
            cookie.set('speech-token', region + ':' + token, {maxAge: 540, path: '/'});

            console.log('Token fetched from back-end: ' + token);
            return { authToken: token, region: region };
        } catch (err) {
         //   console.log(err.response.data);
            return { authToken: null, error: err }; //.response.data };
        }
    } else {
        console.log('Token fetched from cookie: ' + speechToken);
        const idx = speechToken.indexOf(':');
        return { authToken: speechToken.slice(idx + 1), region: speechToken.slice(0, idx) };
    }
}

interface Props {handleMessage: (value: string) => void; }

interface State {}


const App: React.FC<Props> = ({handleMessage}) => {
    const [displayText, setDisplayText] = useState('.');
    const [player, updatePlayer] = useState({p: undefined, muted: false});

    const appStateContext = useContext(AppStateContext);

    async function sttFromMic() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';
        
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        //setDisplayText('speak into your microphone...');

        recognizer.recognizeOnceAsync(result => {
            if (result.reason === ResultReason.RecognizedSpeech) {
                //setDisplayText(`RECOGNIZED: Text=${result.text}`);
                handleMessage(result.text);
                //const conversation = appStateContext?.state?.currentChat;
                //const userMessage: ChatMessage = {
                //    id: uuid(),
                //    role: "user",
                //    content: result.text,
                //    date: new Date().toISOString(),
                //};
        
                //conversation?.messages.push(userMessage);

               // appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: conversation });

            } else {
                alert('ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.');
            }
        });
    }

    return (
    
        <img
        className="container"
    
        onClick={() => sttFromMic()}
        aria-label="clear chat button"
    />
     
    );
}


export default App;