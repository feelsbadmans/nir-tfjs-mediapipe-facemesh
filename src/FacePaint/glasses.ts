import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export const START_SCALE = 75;

export const buildGlasses = () => {
  const glasses = new THREE.Mesh();

  const loader = new OBJLoader();

  loader.load(require('assets/Glasses.obj'), (glassesObj) => {
    glassesObj.scale.set(1, 1, 1);
    glassesObj.rotation.set(0, 1.35 + Math.PI, 2 * Math.PI - 0.04);
    glassesObj.position.set(-45, 63, 6);
    glassesObj.renderOrder = 1;
    glasses.add(glassesObj);
    const material = new THREE.MeshBasicMaterial();
    material.color.setHex(0x000000);

    (glasses.children[0].children[0] as THREE.Mesh).material = material;

    const glass = new THREE.MeshPhysicalMaterial({
      roughness: 0.58,
      transmission: 0.9,
      ior: 1.37,
      envMapIntensity: 0.7,
    });

    glass.color.setHex(0xaf0e0e);

    (glasses.children[0].children[1] as THREE.Mesh).material = glass;
    (glasses.children[0].children[2] as THREE.Mesh).material = glass;
  });

  return glasses;
};
