import { AnnotatedPrediction } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh';
import { Coords3D } from '@tensorflow-models/facemesh/dist/util';
import { FacePaint } from 'FacePaint/FacePaint';

import { TRIANGULATION } from './constants';

const drawPath = (ctx: CanvasRenderingContext2D, points: number[][], closePath: boolean) => {
  const region = new Path2D();
  region.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    region.lineTo(point[0], point[1]);
  }

  if (closePath) {
    region.closePath();
  }
  ctx.strokeStyle = 'grey';
  ctx.stroke(region);
};

const drawDots = (mesh: Coords3D, ctx: CanvasRenderingContext2D) => {
  for (let i = 0; i < TRIANGULATION.length / 3; i++) {
    const points = [TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1], TRIANGULATION[i * 3 + 2]].map(
      (index) => mesh[index],
    );
    //  Draw triangle
    drawPath(ctx, points, true);
  }

  // Draw Dots
  for (let i = 0; i < mesh.length; i++) {
    const x = mesh[i][0];
    const y = mesh[i][1];

    ctx.beginPath();
    ctx.arc(x, y, 1 /* radius */, 0, 3 * Math.PI);
    ctx.fillStyle = 'aqua';
    ctx.fill();
  }
};

type DrawMeshOptions = {
  predictions: AnnotatedPrediction[];
  faceCanvas?: FacePaint;
  showDots?: boolean;
  ctx?: CanvasRenderingContext2D | null;
};

type RightPredictions = AnnotatedPrediction & {
  annotations: {
    [key: string]: number[][];
  };
};

const getAngle = (v1: number[], v2: number[]) => {
  const scal = v1[0] * v2[0] + v1[1] * v2[1];
  const len = Math.sqrt((v1[0] ** 2 + v1[1] ** 2) * (v2[0] ** 2 + v2[1] ** 2));

  return Math.acos(scal / len);
};

const getRotatinos = (left: number[], right: number[], top: number[], bottom: number[], a: number[], b: number[]): number[] => {
  const x = getAngle([top[1] - bottom[1], top[2] - bottom[2]], [0, 1]);
  const y = getAngle([left[0] - right[0], left[1] - right[1]], [0, 1]);
  const z = getAngle([left[0] - right[0], left[2] - right[2]], [0, 1]);

  return [x, y, z];
};

const normalize = (pos: number[]) => {
  return [pos[0] + 2, pos[1] + 10, pos[2] - 600];
};
// Drawing Mesh
export const drawMesh = ({ predictions, faceCanvas, showDots, ctx }: DrawMeshOptions) => {
  if (predictions.length > 0) {
    predictions.forEach((prediction) => {
      const keypoints = prediction.scaledMesh as number[][];
      const top = keypoints[9];
      const bottom = keypoints[8];
      const left = keypoints[69];
      const right = keypoints[299];
      const rotations = getRotatinos(left, right, top, bottom, keypoints[226], keypoints[97]);

      if (showDots && ctx) {
        drawDots(prediction.scaledMesh as Coords3D, ctx);
      } else if (faceCanvas) {
        const points = keypoints.reduce<number[]>((acc, pos, i) => acc.concat(normalize(pos)), []);
        const nose = [keypoints[6], keypoints[168]];
        faceCanvas.render(points, nose, rotations);
      }
    });
  }
};
