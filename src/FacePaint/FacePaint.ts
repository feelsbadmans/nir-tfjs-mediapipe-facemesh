import { TRIANGULATION } from 'App/constants';
import * as THREE from 'three';

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

  constructor({ ctx, textureFilePath, w, h }: FacePaintConstructorOptions) {
    this.canvas = ctx;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: ctx,
    });
    // this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(w, h)
    // this.renderer.setViewport(this.canvas.offsetLeft, this.canvas.offsetTop, w, h);

    this.halfW = w * 0.5;
    this.halfH = h * 0.5;

    this.textureFilePath = textureFilePath;

    this.camera = new THREE.OrthographicCamera(this.halfW, -this.halfW, -this.halfH, this.halfH , 1, 1000);
    this.geometry = new THREE.BufferGeometry();
    this.textureLoader = new THREE.TextureLoader();
    this.material = new THREE.MeshPhongMaterial();
    this.mesh = new THREE.Mesh();

    this.scene = new THREE.Scene();
    this.setupScene();
  }

  addCamera() {;
    const x = this.halfW;
    const y = this.halfH;
    this.camera.position.x = x;
    this.camera.position.y = y;
    this.camera.position.z = -600;
    this.camera.lookAt(x, y, 0);
  }

  set blendMode(value: string) {
    this.renderer.domElement.style.mixBlendMode = value;
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

  public render(positions: number[]) {
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.attributes.position.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }
}
