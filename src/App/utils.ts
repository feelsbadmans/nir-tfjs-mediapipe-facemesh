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

const normalize = (pos: number[]) => {
  return [pos[0] - 8, pos[1] + 220, pos[2] - 500];
};

const normalizePos = (pos: number[], canvas: HTMLCanvasElement) => {
  return [pos[0] - canvas.offsetLeft / 2, pos[1] + canvas.offsetTop, pos[2]];
};

// Drawing Mesh
export const drawMesh = ({ predictions, faceCanvas, showDots, ctx }: DrawMeshOptions) => {
  if (predictions.length > 0) {
    predictions.forEach((prediction) => {
      const keypoints = prediction.scaledMesh as number[][];

      if (showDots && ctx) {
        drawDots(prediction.scaledMesh as Coords3D, ctx);
      } else if (faceCanvas) {
        const points = keypoints.reduce<number[]>((acc, pos, i) => acc.concat(pos), []);
        faceCanvas.render(points);
      }
    });
  }
};
