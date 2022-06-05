// 1. Install dependencies DONE
// 2. Import dependencies DONE
// 3. Setup webcam and canvas DONE
// 4. Define references to those DONE
// 5. Load posenet DONE
// 6. Detect function DONE
// 7. Drawing utilities from tensorflow DONE
// 8. Draw functions DONE

// Face Mesh - https://github.com/tensorflow/tfjs-models/tree/master/facemesh

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as facemesh from '@tensorflow-models/face-landmarks-detection';
import { MediaPipeFaceMesh } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh';
import { FacePaint } from 'FacePaint/FacePaint';

import '@tensorflow/tfjs-backend-webgl';

import { entries } from './entries';
import { drawMesh } from './utils';

import './App.css';

const width = 640;
const height = 480;

export const App = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasDotsRef = useRef<HTMLCanvasElement>(null);
  const faceCanvasRef = useRef<FacePaint | null>(null);

  const interval = useRef<NodeJS.Timeout | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [indexMask, setIndexMask] = useState(0);
  const [showDots, setShowDots] = useState(false);

  const detect = useCallback(
    async (net: MediaPipeFaceMesh) => {
      if (webcamRef.current && webcamRef.current.video && canvasRef.current && canvasDotsRef.current) {
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

        canvasDotsRef.current.width = videoWidth;
        canvasDotsRef.current.height = videoHeight;
        const ctx = canvasDotsRef.current.getContext('2d');
        // Make Detections
        const face = await net.estimateFaces({ input: video });
        // Get canvas context
        requestAnimationFrame(() => {
          if (showDots) {
            drawMesh({ predictions: face, showDots, ctx });
          } else if (faceCanvasRef.current) {
            drawMesh({ predictions: face, faceCanvas: faceCanvasRef.current });
          }
        });
      }
    },
    [showDots],
  );

  const runFacemesh = useCallback(
    async (fl: boolean) => {
      if (fl) {
        const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh, {});
        if (!faceCanvasRef.current && canvasRef.current) {
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
        }, 0.0001);
      } else {
        if (interval.current) {
          clearInterval(interval.current);
          setTimeout(() => {
            setIsRunning(false);
          }, 100);
        }
      }
    },
    [indexMask, detect],
  );

  const [flag, setFlag] = useState(false);

  useEffect(() => {
    runFacemesh(flag);
  }, [flag, runFacemesh]);

  useEffect(() => {
    if (interval.current) {
      clearInterval(interval.current);
    }
  }, [showDots]);

  useEffect(() => {
    faceCanvasRef.current?.updateTexture(entries[indexMask].entry);
  }, [indexMask]);

  const visibilityFaceMask = useMemo(() => (isRunning && !showDots ? 'visible' : 'hidden'), [isRunning, showDots]);

  const visibilityDots = useMemo(() => (isRunning && showDots ? 'visible' : 'hidden'), [isRunning, showDots]);

  return (
    <div className="App">
      <article className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: 'absolute',
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
            textAlign: 'center',
            zIndex: 9,
            width,
            height,
            visibility: visibilityFaceMask,
          }}
        />
        <canvas
          id="FaceDots"
          ref={canvasDotsRef}
          style={{
            position: 'absolute',
            textAlign: 'center',
            zIndex: 20,
            width,
            height,
            visibility: visibilityDots,
          }}
        />
      </article>

      <div className="options-container">
        <button
          onClick={() => {
            setFlag((prev) => !prev);
          }}
          className="button"
        >
          {flag ? 'Остановить' : 'Запустить'}
        </button>
        <button
          onClick={() => {
            setShowDots((prev) => !prev);
          }}
          className="button"
        >
          Скрыть/показать точки
        </button>
        <select onChange={(e) => setIndexMask(Number(e.target.value))} className="select">
          {entries.map((v, i) => (
            <option value={i} key={v.handle}>
              {v.handle}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
