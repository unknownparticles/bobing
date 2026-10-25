import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createBowlTexture, createDieTextures, createShadowTexture } from './textures.js';
import { dicePose } from './dice-pose.js';

/** 创建固定镜头的红釉金纹场景。只接收展示状态，不投骰、不发游戏事件。 */
export function createBowlScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2.7, 2.7, 2.3, -2.3, .1, 30);
  camera.position.set(0, 10.2, 8.8);
  camera.lookAt(0, 1.4, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new THREE.Scene();
  room.background = new THREE.Color('#9b9382');
  const softbox = new THREE.Mesh(new THREE.PlaneGeometry(4, 7), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.5) }));
  softbox.position.set(-4, 5, 2); softbox.lookAt(0, 0, 0); room.add(softbox);
  const environment = pmrem.fromScene(room, .12);
  scene.environment = environment.texture;
  softbox.geometry.dispose(); softbox.material.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#fff1d7', '#70473a', 1.4));
  const light = new THREE.DirectionalLight('#fff3df', 2.4);
  light.position.set(-3, 7, 4);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: .1, far: 15 });
  light.shadow.bias = -.0003;
  light.shadow.normalBias = .015;
  light.shadow.radius = 3;
  scene.add(light);
  const fill = new THREE.DirectionalLight('#ffe7bc', 1.2);
  fill.position.set(4, 3, -4);
  scene.add(fill);

  const bowl = new THREE.Group();
  scene.add(bowl);
  const textures = [createBowlTexture(), createBowlTexture(true), ...createDieTextures(), createShadowTexture()];
  const gold = new THREE.MeshStandardMaterial({ color: '#eac16d', metalness: .8, roughness: .25 });
  const glaze = map => new THREE.MeshPhysicalMaterial({ map, roughness: .34, metalness: 0, clearcoat: .65, clearcoatRoughness: .25, envMapIntensity: .45 });
  const lathe = (profile, material) => {
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(profile.map(point => new THREE.Vector2(...point)), 128), material);
    mesh.receiveShadow = true; mesh.castShadow = true; bowl.add(mesh);
    return mesh;
  };
  // 内外壁分开建模，开口保留真实深度；前壁可以自然遮挡骰子的下半部。
  lathe([[0, .08], [.72, .08], [1, .13], [1.4, .3], [1.68, .75], [1.88, 1.23], [2, 1.6]], glaze(textures[0]));
  lathe([[2, 1.6], [1.93, 1.62], [1.82, 1.23], [1.63, .85], [1.47, .52], [1.35, .405], [0, .405]], glaze(textures[1]));
  const ring = (radius, tube, y) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 128), gold);
    mesh.rotation.x = Math.PI / 2; mesh.position.y = y; bowl.add(mesh);
  };
  ring(1.974, .041, 1.61);
  ring(1.9, .012, 1.565);
  ring(.76, .032, .08);
  lathe([[.7, .015], [.77, .015], [.79, .09], [.72, .13]], gold);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.6), new THREE.MeshBasicMaterial({ map: textures[8], transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.01; scene.add(shadow);

  const geometry = new RoundedBoxGeometry(.46, .46, .46, 3, .055);
  // BoxGeometry 面顺序为 +X、-X、+Y、-Y、+Z、-Z；相对面点数之和为七。
  const materials = [3, 4, 1, 6, 2, 5].map(value => new THREE.MeshPhysicalMaterial({
    map: textures[value + 1], roughness: .42, clearcoat: .25, clearcoatRoughness: .25, envMapIntensity: .35,
  }));
  const dice = [];
  const halos = [];
  const target = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  let previousCount = 0;
  let lastTime = 0;
  let settlingUntil = 0;
  let previousState = null;

  function syncCount(count) {
    if (previousCount === count) return;
    dice.forEach(mesh => bowl.remove(mesh));
    halos.forEach(mesh => { bowl.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); });
    dice.length = 0; halos.length = 0;
    for (let index = 0; index < count; index++) {
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.castShadow = true; mesh.receiveShadow = true;
      bowl.add(mesh); dice.push(mesh);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(.31, .018, 8, 40), new THREE.MeshBasicMaterial({ color: '#ffd074', transparent: true, opacity: .9, depthTest: false }));
      halo.rotation.x = Math.PI / 2; halo.visible = false; bowl.add(halo); halos.push(halo);
    }
    previousCount = count;
  }

  return {
    resize(width, height) {
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.left = -2.55; camera.right = 2.55;
      camera.top = 2.55 / aspect; camera.bottom = -2.55 / aspect;
      camera.updateProjectionMatrix();
    },
    /** 返回是否需要继续逐帧绘制；静态结果不占用持续动画循环。 */
    render(state, now, reducedMotion) {
      const seconds = now / 1000;
      const delta = Math.min((now - lastTime) / 1000, .05);
      lastTime = now;
      const countChanged = previousCount !== state.dice.length;
      syncCount(state.dice.length);
      const stateKey = JSON.stringify([state.dice, state.rolling, state.rollingIndices, state.changing, state.revealing]);
      if (previousState !== stateKey) {
        settlingUntil = seconds + .22;
        previousState = stateKey;
      }
      const isMoving = state.rolling && !reducedMotion;
      const allRolling = isMoving && (!state.rollingIndices || state.rollingIndices.length === state.dice.length);
      bowl.rotation.z = allRolling ? Math.sin(seconds * 15) * .018 : 0;
      state.dice.forEach((value, index) => {
        const rolling = isMoving && (!state.rollingIndices || state.rollingIndices.includes(index));
        const changing = state.changing && state.changedIndices.includes(index) && !reducedMotion;
        const pose = dicePose({ value, index, count: state.dice.length, rolling, time: seconds, reducedMotion });
        const mesh = dice[index];
        euler.set(...pose.rotation, 'YXZ'); target.setFromEuler(euler);
        if (rolling || reducedMotion || countChanged) {
          mesh.position.set(...pose.position); mesh.quaternion.copy(target);
        } else {
          // 落定只对齐已确定的结果，不用物理模拟二次决定点数。
          const blend = seconds >= settlingUntil ? 1 : 1 - Math.exp(-delta * 30);
          mesh.position.lerp(new THREE.Vector3(...pose.position), blend);
          mesh.quaternion.slerp(target, blend);
        }
        mesh.scale.setScalar(changing ? .78 : 1);
        const halo = halos[index];
        halo.position.set(pose.position[0], .42, pose.position[2]);
        halo.visible = state.changedIndices.includes(index);
      });
      renderer.render(scene, camera);
      return isMoving || (!reducedMotion && seconds < settlingUntil);
    },
    /** 页面切换时释放纹理、几何、阴影图与 WebGL 上下文。 */
    dispose() {
      const geometries = new Set();
      const usedMaterials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => usedMaterials.add(material));
      });
      geometries.forEach(item => item.dispose()); usedMaterials.forEach(item => item.dispose());
      textures.forEach(texture => texture.dispose()); environment.dispose(); light.shadow.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
