import { TRIANGULATION } from 'App/constants';
import * as THREE from 'three';

import { buildGlasses } from './glasses';
import { positionBufferData } from './positionBufferData';
import { uvs } from './uvs';

type FacePaintConstructorOptions = {
  ctx: HTMLCanvasElement;
  textureFilePath: string;
  w: number;
  h: number;
};

export class FacePaint {
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  textureFilePath: string;
  halfW: number;
  halfH: number;
  camera: THREE.OrthographicCamera;
  scene: THREE.Scene;
  geometry: THREE.BufferGeometry;
  textureLoader: THREE.TextureLoader;
  material: THREE.MeshPhongMaterial;
  mesh: THREE.Mesh;
  glasses: THREE.Object3D;
  showGlasses: boolean;
  nose: THREE.Mesh;
  prevC: number;
  initScale: number;

  constructor({ ctx, textureFilePath, w, h }: FacePaintConstructorOptions) {
    this.canvas = ctx;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: ctx,
    });
    // this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(w, h);
    // this.renderer.setViewport(this.canvas.offsetLeft, this.canvas.offsetTop, w, h);

    this.halfW = w * 0.5;
    this.halfH = h * 0.5;

    this.textureFilePath = textureFilePath;

    this.camera = new THREE.OrthographicCamera(this.halfW - 5, -this.halfW + 5, -this.halfH, this.halfH, 1, 1000);
    this.geometry = new THREE.BufferGeometry();
    this.textureLoader = new THREE.TextureLoader();
    this.material = new THREE.MeshPhongMaterial();
    this.mesh = new THREE.Mesh();
    this.mesh.renderOrder = 2;

    this.scene = new THREE.Scene();
    this.setupScene();

    this.glasses = buildGlasses();
    this.nose = new THREE.Mesh();
    this.nose.attach(this.glasses);
    this.showGlasses = false;
    this.prevC = 0;
    this.initScale = 0;
  }

  addCamera() {
    const x = this.halfW;
    const y = this.halfH;
    this.camera.position.x = x;
    this.camera.position.y = y;
    this.camera.position.z = -1000;
    this.camera.zoom = 2;
    this.camera.lookAt(x, y, 0);
  }

  addLights() {
    const light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
    this.scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(this.halfW, this.halfH, -1000).normalize();
    this.scene.add(directionalLight);
  }

  addGeometry() {
    this.geometry.setIndex(TRIANGULATION);
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBufferData, 3));
    this.geometry.center();
    this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    this.geometry.computeVertexNormals();
  }

  addMaterial() {
    const texture = this.textureLoader.load(this.textureFilePath);
    // set the "color space" of the texture
    texture.encoding = THREE.sRGBEncoding;
    // reduce blurring at glancing angles
    texture.anisotropy = 16;
    const alpha = 0.4;
    const beta = 0.5;
    this.material.setValues({
      map: texture,
      specular: new THREE.Color(beta * 0.2, beta * 0.2, beta * 0.2),
      transparent: true,
      reflectivity: beta,
      shininess: Math.pow(2, alpha * 10),
      depthWrite: false,
      wireframeLinewidth: 0.05,
      polygonOffsetUnits: -1,
    });
  }

  toggleGlasses() {
    if (!this.showGlasses) {
      this.mesh.add(this.nose);
    } else {
      this.mesh.remove(this.nose);
    }
    this.showGlasses = !this.showGlasses;
  }

  setupScene() {
    this.addCamera();
    this.addLights();
    this.addGeometry();
    this.addMaterial();
    this.mesh.geometry = this.geometry;
    this.mesh.material = this.material;
    this.scene.add(this.mesh);
  }

  async updateTexture(url: string) {
    let texture;

    texture = await this.textureLoader.loadAsync(url);
    texture.encoding = THREE.sRGBEncoding;

    this.material.map = texture;
  }

  rotate(rot: number[]) {
    const euler = new THREE.Euler(rot[0], rot[1], rot[2]);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(euler);
    this.nose.setRotationFromQuaternion(quaternion);

    // const x = new THREE.Vector3(1, 0, 0);
    // const y = new THREE.Vector3(0, 1, 0);
    // const z = new THREE.Vector3(0, 0, 1);

    // const quatX = new THREE.Quaternion();
    // const quatY = new THREE.Quaternion();
    // const quatZ = new THREE.Quaternion();

    // quatX.setFromAxisAngle(x, rot[0]);
    // quatY.setFromAxisAngle(y, rot[1]);
    // quatZ.setFromAxisAngle(z, rot[2]);

    // quatY.multiply(quatX);
    // quatZ.multiply(quatY);

    // this.nose.setRotationFromQuaternion(quatZ);
  }

  public render(positions: number[], nose: number[][], rotation: number[]) {
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.attributes.position.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    if (this.showGlasses) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          nose.reduce((acc, p) => acc.concat(p), []),
          3,
        ),
      );
      geometry.center();
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.computeVertexNormals();
      this.nose.position.set(nose[0][0], nose[0][1], nose[0][2]);

      if (this.prevC === 0) {
        this.prevC = Math.abs(nose[0][1] - nose[1][1]);
        this.initScale = Math.pow(this.prevC, 0.75) * 18.6;
        this.glasses.children[0].scale.set(this.initScale, this.initScale, this.initScale);
      } else {
        const c = Math.sqrt(Math.abs(nose[0][1] - nose[1][1]) / this.prevC) * this.initScale;

        this.glasses.children[0].scale.set(c, c, c);
      }

      this.rotate(rotation);
    }
  }
}
