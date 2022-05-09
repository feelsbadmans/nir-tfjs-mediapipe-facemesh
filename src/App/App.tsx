// 1. Install dependencies DONE
// 2. Import dependencies DONE
// 3. Setup webcam and canvas DONE
// 4. Define references to those DONE
// 5. Load posenet DONE
// 6. Detect function DONE
// 7. Drawing utilities from tensorflow DONE
// 8. Draw functions DONE

// Face Mesh - https://github.com/tensorflow/tfjs-models/tree/master/facemesh

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as facemesh from '@tensorflow-models/face-landmarks-detection';
import { MediaPipeFaceMesh } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh';
import { entries } from 'FacePaint/entries';
import { FacePaint } from 'FacePaint/FacePaint';

import '@tensorflow/tfjs-backend-webgl';

import { drawMesh, Rect } from './utils';

import './App.css';

const width = 640;
const height = 480;

export const App = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceCanvasRef = useRef<FacePaint | null>(null);

  const interval = useRef<NodeJS.Timeout | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [indexMask, setIndexMask] = useState(0);

  //  Load posenet
  const runFacemesh = useCallback(
    async (fl: boolean) => {
      if (fl) {
        const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh, {});
        if (!faceCanvasRef.current) {
          faceCanvasRef.current = new FacePaint({
            ctx: canvasRef.current,
            textureFilePath: entries[indexMask].entry,
            w: width,
            h: height,
          });
        }

        setIsRunning(true);

        interval.current = setInterval(() => {
          detect(net);
        }, 0);
      } else {
        if (interval.current) {
          clearInterval(interval.current);
          setTimeout(() => {
            setIsRunning(false);
          }, 100);
        }
      }
    },
    [indexMask],
  );

  const rect = useRef<Rect>({
    top: [320, 0],
    bottom: [320, 480],
    right: [0, 240],
    left: [640, 240],
  });

  const handleSetRect = (newRect: Rect) => {
    // console.log({rect});
    rect.current = newRect;
  };

  const detect = useCallback(
    async (net: MediaPipeFaceMesh) => {
      if (webcamRef.current && webcamRef.current.video && canvasRef.current) {
        // Get Video Properties
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // Set video width
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // Set canvas width
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        // Make Detections
        const face = await net.estimateFaces({ input: video });
        // Get canvas context
        requestAnimationFrame(() => {
          if (faceCanvasRef.current) {
            drawMesh(face, faceCanvasRef.current, rect.current, handleSetRect);
          }
        });
      }
    },
    [faceCanvasRef.current],
  );

  const [flag, setFlag] = useState(false);

  useEffect(() => {
    runFacemesh(flag);
  }, [flag, runFacemesh]);

  useEffect(() => {
    faceCanvasRef.current?.updateTexture(entries[indexMask].entry);
  }, [indexMask]);

  return (
    <div className="App">
      <article className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 9,
            width,
            height,
          }}
        />

        <canvas
          id="FaceMask"
          ref={canvasRef}
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 9,
            width,
            height,
            visibility: isRunning ? 'visible' : 'hidden',
          }}
        />
      </article>

      <button
        onClick={() => {
          setFlag((prev) => !prev);
        }}
        className={'button'}
      >
        {flag ? 'STOP' : 'RUN'}
      </button>
      <select onChange={(e) => setIndexMask(Number(e.target.value))}>
        {entries.map((v, i) => (
          <option value={i} key={v.handle}>{v.handle}</option>
        ))}
      </select>
    </div>
  );
};
