import * as THREE from 'three';
import { FrameBudget, boundedDpr } from './frame-budget.js';
import { flowerVertices, bloomPose } from './garden-motion.js';

window.AfterglowFrameBudget = FrameBudget;
window.afterglowDpr = boundedDpr;

// The application owns time, input and collection. This renderer only presents
// that state, so a lost GPU context can return to Canvas without losing a sky.
const TAU = Math.PI * 2;
const MAX_THOUGHTS = 80;
const MAX_MOTES = 512;

function flowerGeometry(petals, contours, steps = 48) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(flowerVertices(petals, contours, steps), 3));
  return geometry;
}

function ringGeometry(segments = 96) {
  const vertices = [];
  for (let i = 0; i < segments; i++) vertices.push(Math.cos(i / segments * TAU), Math.sin(i / segments * TAU), 0);
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
}

function pointCloud(capacity) {
  const geometry = new THREE.BufferGeometry();
  const attributes = { position: 3, tint: 3, size: 1, opacity: 1 };
  for (const [name, size] of Object.entries(attributes)) {
    geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(capacity * size), size).setUsage(THREE.DynamicDrawUsage));
  }
  geometry.setDrawRange(0, 0);
  const material = new THREE.ShaderMaterial({
    uniforms: { pixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexShader: `
      attribute vec3 tint;
      attribute float size;
      attribute float opacity;
      uniform float pixelRatio;
      varying vec3 vTint;
      varying float vOpacity;
      void main() {
        vTint = tint;
        vOpacity = opacity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.0, size * pixelRatio);
      }
    `,
    fragmentShader: `
      varying vec3 vTint;
      varying float vOpacity;
      void main() {
        float radius = length(gl_PointCoord - .5) * 2.;
        if (radius > 1.) discard;
        float core = 1. - smoothstep(.02, .22, radius);
        float halo = pow(1. - radius, 3.) * .34;
        gl_FragColor = vec4(vTint, (core + halo) * vOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  const color = new THREE.Color();
  return {
    points,
    set(index, x, y, z, size, tint, opacity) {
      if (index >= capacity) return;
      color.set(tint);
      geometry.attributes.position.setXYZ(index, x, y, z);
      geometry.attributes.tint.setXYZ(index, color.r, color.g, color.b);
      geometry.attributes.size.setX(index, size);
      geometry.attributes.opacity.setX(index, opacity);
    },
    commit(count, dpr) {
      points.visible = count > 0;
      for (const attr of Object.values(geometry.attributes)) attr.needsUpdate = true;
      geometry.setDrawRange(0, Math.min(count, capacity));
      material.uniforms.pixelRatio.value = dpr;
    }
  };
}

window.createAfterglowRenderer = ({ host, anchor, mobile, reducedMotion, onFailure }) => {
  const surface = document.createElement('canvas');
  surface.id = 'skyCanvas';
  surface.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({
    canvas: surface,
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false
  });
  renderer.setClearColor(0, 0);
  renderer.autoClear = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const gl = renderer.getContext();
  const timerExtension = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const queries = [];
  let gpuMs = null;
  let gpuSampleAt = 0;
  let renderCount = 0;

  function beginGpuSample() {
    if (!timerExtension) return null;
    const disjoint = gl.getParameter(timerExtension.GPU_DISJOINT_EXT);
    while (queries.length && (disjoint || gl.getQueryParameter(queries[0], gl.QUERY_RESULT_AVAILABLE))) {
      const query = queries.shift();
      if (!disjoint) {
        gpuMs = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1000000;
        gpuSampleAt = performance.now();
      }
      gl.deleteQuery(query);
    }
    if (disjoint) gpuMs = null;
    if (disjoint || ++renderCount % 15 || queries.length >= 4) return null;
    const query = gl.createQuery();
    gl.beginQuery(timerExtension.TIME_ELAPSED_EXT, query);
    return query;
  }
  // No fullscreen passes, render targets, textures, shadows or second RAF loop.
  const scene = new THREE.Scene();
  const studyScene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 3000);
  camera.position.z = 1000;
  const resources = new Set();
  const own = resource => { resources.add(resource); return resource; };
  const ring = own(ringGeometry());
  const seed = own(new THREE.IcosahedronGeometry(1, 1));
  const flowerGeometries = new Map();
  const blooms = new Map();
  const linkGeometry = own(new THREE.BufferGeometry());
  const linkPositions = new THREE.BufferAttribute(new Float32Array(MAX_THOUGHTS * 6), 3).setUsage(THREE.DynamicDrawUsage);
  linkGeometry.setAttribute('position', linkPositions);
  const linkMaterial = own(new THREE.LineBasicMaterial({ color: '#f4f4ef', transparent: true, opacity: .2, depthTest: false }));
  const links = new THREE.LineSegments(linkGeometry, linkMaterial);
  links.frustumCulled = false;
  scene.add(links);
  const starCloud = pointCloud(400);
  const thoughtCloud = pointCloud(MAX_THOUGHTS);
  const moteCloud = pointCloud(MAX_MOTES);
  const focusCloud = pointCloud(3);
  for (const cloud of [starCloud, thoughtCloud, moteCloud, focusCloud]) {
    own(cloud.points.geometry);
    own(cloud.points.material);
    scene.add(cloud.points);
  }

  const crystalMaterial = own(new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: .58, depthTest: false }));
  const crystals = new THREE.InstancedMesh(own(new THREE.OctahedronGeometry(1)), crystalMaterial, MAX_THOUGHTS);
  crystals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crystals.frustumCulled = false;
  crystals.count = 0;
  const crystalColor = new THREE.Color();
  crystals.setColorAt(0, crystalColor);
  crystals.instanceColor.setUsage(THREE.DynamicDrawUsage);
  scene.add(crystals);
  const transform = new THREE.Object3D();

  const focus = new THREE.Group();
  const focusMaterial = own(new THREE.LineBasicMaterial({ color: '#f4f4ef', transparent: true, opacity: .65, depthTest: false }));
  const focusInner = new THREE.LineLoop(ring, focusMaterial);
  const focusOuter = new THREE.LineLoop(ring, focusMaterial);
  focusInner.scale.setScalar(17);
  focusOuter.scale.setScalar(25);
  focus.add(focusInner, focusOuter);
  scene.add(focus);
  const focusGlint = new THREE.Vector3();

  const study = new THREE.Group();
  const studyMaterial = own(new THREE.LineBasicMaterial({ color: '#f4f4ef', transparent: true, opacity: .29, depthTest: false }));
  const studyFlower = new THREE.LineSegments(own(flowerGeometry(11, mobile ? 5 : 8, 72)), studyMaterial);
  study.add(studyFlower);
  const innerStudyMaterial = own(studyMaterial.clone());
  const innerStudy = new THREE.LineSegments(own(flowerGeometry(7, mobile ? 3 : 4, 64)), innerStudyMaterial);
  innerStudy.rotation.z = Math.PI / 7;
  innerStudy.scale.setScalar(.64);
  innerStudy.position.z = .28;
  study.add(innerStudy);
  const orbitMaterial = own(new THREE.LineBasicMaterial({ color: '#f4f4ef', transparent: true, opacity: .19, depthTest: false }));
  const orbit = new THREE.LineLoop(ring, orbitMaterial);
  orbit.scale.setScalar(2.3);
  orbit.rotation.set(1.1, .25, .25);
  study.add(orbit);
  const secondOrbit = new THREE.LineLoop(ring, orbitMaterial);
  secondOrbit.scale.setScalar(2.55);
  secondOrbit.rotation.set(.85, -.5, -.3);
  study.add(secondOrbit);
  const seedMaterial = own(new THREE.MeshBasicMaterial({ color: '#10a37f', wireframe: true, transparent: true, opacity: .85, depthTest: false }));
  const studySeed = new THREE.Mesh(seed, seedMaterial);
  studySeed.scale.setScalar(.13);
  study.add(studySeed);
  studyScene.add(study);

  let width = 1;
  let height = 1;
  let dpr = 1;
  let disposed = false;
  let failed = false;
  let resultTime = null;
  let light = null;

  function setTheme(isLight) {
    if (isLight === light) return;
    light = isLight;
    const ink = light ? '#0d0d0d' : '#f4f4ef';
    [studyMaterial, innerStudyMaterial, orbitMaterial, linkMaterial].forEach(material => material.color.set(ink));
    focusMaterial.color.set(light ? '#6f6f69' : ink);
    crystalMaterial.opacity = light ? .48 : .58;
    studyMaterial.opacity = light ? .27 : .33;
    orbitMaterial.opacity = light ? .17 : .22;
  }

  function resize(nextWidth, nextHeight, nextDpr) {
    if (disposed || (width === nextWidth && height === nextHeight && dpr === nextDpr)) return;
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    // setDrawingBufferSize performs one allocation for size + DPR together.
    renderer.setDrawingBufferSize(width, height, dpr);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
  }

  function place(object, x, y, z = 0) {
    object.position.set(x - width / 2, height / 2 - y, z);
  }

  function bloomPosition(bloom, state) {
    const age = reducedMotion || state.mode === 'result' ? 1 : Math.min(1, Math.max(0, (state.now - bloom.born) / 900));
    const settle = 1 - (1 - age) ** 3;
    return {
      x: (bloom.fromX ?? bloom.x) + (bloom.x - (bloom.fromX ?? bloom.x)) * settle,
      y: (bloom.fromY ?? bloom.y) + (bloom.y - (bloom.fromY ?? bloom.y)) * settle
    };
  }

  function syncBlooms(state, time) {
    const current = new Set(state.blooms.map(bloom => bloom.source ?? bloom));
    for (const [bloom, object] of blooms) {
      if (current.has(bloom)) continue;
      scene.remove(object);
      object.children.forEach(child => { child.material.dispose(); resources.delete(child.material); });
      blooms.delete(bloom);
    }
    state.blooms.forEach((bloom, index) => {
      const key = bloom.source ?? bloom;
      let object = blooms.get(key);
      if (!object) {
        if (!flowerGeometries.has(bloom.petals)) flowerGeometries.set(bloom.petals, own(flowerGeometry(bloom.petals, mobile ? 2 : 3)));
        object = new THREE.Group();
        const material = own(new THREE.LineBasicMaterial({ color: bloom.color, transparent: true, opacity: .65, depthTest: false }));
        const flower = new THREE.LineSegments(flowerGeometries.get(bloom.petals), material);
        const ripple = new THREE.LineLoop(ring, own(material.clone()));
        const center = new THREE.Mesh(seed, own(new THREE.MeshBasicMaterial({ color: bloom.color, transparent: true, depthTest: false })));
        object.add(flower, ripple, center);
        scene.add(object);
        blooms.set(key, object);
      }
      const age = reducedMotion || state.mode === 'result' ? 1 : Math.min(1, Math.max(0, (state.now - bloom.born) / 1000));
      const open = 1 - (1 - age) ** 3;
      const size = bloom.size * 1.35;
      const point = bloomPosition(bloom, state);
      place(object, point.x, point.y);
      const [flower, ripple, center] = object.children;
      const pose = bloomPose(bloom, index, state.now, reducedMotion, state.mode === 'result');
      flower.scale.set(pose.sx, pose.sy, pose.sz);
      flower.rotation.set(pose.rx, pose.ry, pose.rz);
      flower.material.opacity = (light ? .65 : .72) * open;
      ripple.visible = !reducedMotion && age < 1;
      ripple.scale.setScalar(size * (1 + age * 3));
      ripple.rotation.x = .6;
      ripple.material.opacity = (1 - age) * .6;
      center.scale.setScalar(2.5 * open);
      center.rotation.set(time * .2, index, time * .3);
    });
  }

  function render(state) {
    if (disposed || failed) return false;
    const gpuQuery = beginGpuSample();
    setTheme(state.light);
    if (state.mode !== 'result') resultTime = null;
    else if (resultTime === null) resultTime = state.now;
    const time = reducedMotion ? 0 : (resultTime ?? state.now) * .001;
    const ink = light ? '#0d0d0d' : '#f4f4ef';
    state.stars.forEach((star, index) => {
      const twinkle = .8 + Math.sin(time * .45 + star.phase) * .2;
      starCloud.set(index, star.x - width / 2, height / 2 - star.y, -100 - index % 7 * 20, star.r * 6 + 2, ink, star.a * twinkle);
    });
    starCloud.commit(state.stars.length, dpr);
    syncBlooms(state, time);
    const connections = (state.connections ?? []).slice(0, MAX_THOUGHTS);
    connections.forEach((connection, index) => {
      const from = bloomPosition(connection.from, state);
      const to = bloomPosition(connection.to, state);
      const age = reducedMotion || state.mode === 'result' ? 1 : Math.min(1, Math.max(0, (state.now - connection.to.born - 220) / 900));
      linkPositions.setXYZ(index * 2, from.x - width / 2, height / 2 - from.y, -2);
      linkPositions.setXYZ(index * 2 + 1, from.x + (to.x - from.x) * age - width / 2, height / 2 - from.y - (to.y - from.y) * age, -2);
    });
    linkPositions.needsUpdate = true;
    linkGeometry.setDrawRange(0, connections.length * 2);
    links.visible = connections.length > 0;

    const count = Math.min(MAX_THOUGHTS, state.particles.length);
    crystals.count = count;
    for (let index = 0; index < count; index++) {
      const p = state.particles[index];
      const pulse = reducedMotion ? 1 : 1 + Math.sin(p.phase) * .12;
      place(transform, p.x, p.y);
      transform.rotation.set(time * .35 + index, time * .2 + index, index);
      transform.scale.setScalar(p.r * pulse);
      transform.updateMatrix();
      crystals.setMatrixAt(index, transform.matrix);
      crystals.setColorAt(index, crystalColor.set(light ? p.color : ink));
      thoughtCloud.set(index, p.x - width / 2, height / 2 - p.y, 1, p.r * (light ? 5 : 8), light ? p.color : ink, light ? .22 : .65);
    }
    crystals.instanceMatrix.needsUpdate = true;
    crystals.instanceColor.needsUpdate = true;
    thoughtCloud.commit(count, dpr);
    state.trails.forEach((trail, index) => {
      moteCloud.set(index, trail.x - width / 2, height / 2 - trail.y, 3, trail.r * 6, trail.color, reducedMotion ? 0 : Math.max(0, trail.life));
    });
    moteCloud.commit(state.trails.length, dpr);

    focus.visible = state.mode === 'play';
    if (focus.visible) {
      place(focus, state.player.x, state.player.y, 4);
      // Input lag gives the orbit a small directional lean without depending on FPS.
      const leanX = reducedMotion ? 0 : THREE.MathUtils.clamp((state.player.ty - state.player.y) / 180, -.45, .45);
      const leanY = reducedMotion ? 0 : THREE.MathUtils.clamp((state.player.tx - state.player.x) / 180, -.45, .45);
      const motion = Math.hypot(leanX, leanY);
      focusInner.scale.setScalar(17 + Math.sin(time * 1.4) * 1.1);
      focusOuter.scale.setScalar(26 + Math.sin(time * 1.1) * 1.4 + motion * 3);
      focusInner.rotation.set(.32 + leanX, Math.sin(time * .65) * .35 + leanY, time * .4);
      focusOuter.rotation.set(.95 + Math.sin(time * .5) * .25 - leanX, .3 - leanY, -time * .32);
      const focusTint = light ? '#10a37f' : ink;
      focusCloud.set(0, focus.position.x, focus.position.y, 4, 70, focusTint, light ? .24 : .5);
      for (let index = 0; index < 2; index++) {
        const orbit = index ? focusOuter : focusInner;
        const angle = time * (index ? -.85 : 1.1) + index * Math.PI;
        focusGlint.set(Math.cos(angle), Math.sin(angle), 0).multiply(orbit.scale).applyEuler(orbit.rotation).add(focus.position);
        focusCloud.set(index + 1, focusGlint.x, focusGlint.y, focusGlint.z, 18, focusTint, .9);
      }
    }
    focusCloud.commit(focus.visible ? 3 : 0, dpr);

    renderer.setScissorTest(false);
    renderer.clear();
    renderer.render(scene, camera);
    const reveal = state.mode === 'intro' ? 1 : state.mode === 'play' && !reducedMotion ? Math.max(0, 1 - (state.now - state.startedAt) / 320) : 0;
    if (reveal > 0) {
      const rect = anchor.getBoundingClientRect();
      const top = Math.max(66, rect.top);
      const bottom = Math.min(height, rect.bottom);
      if (bottom > top) {
        place(study, rect.left + rect.width / 2, rect.top + rect.height * .46);
        study.scale.setScalar(Math.min(rect.width / 4.9, rect.height / 3.8));
        study.rotation.set(.65 + (state.studyRotation?.x ?? 0) + Math.sin(time * .13) * .12, -.18 + (state.studyRotation?.y ?? 0) + Math.sin(time * .09) * .15, time * .025);
        studyMaterial.opacity = (light ? .27 : .33) * reveal;
        innerStudyMaterial.opacity = (light ? .25 : .3) * reveal;
        orbitMaterial.opacity = (light ? .15 : .2) * reveal;
        seedMaterial.opacity = .85 * reveal;
        studySeed.rotation.set(time * .3, time * .2, 0);
        renderer.setScissor(rect.left, height - bottom, rect.width, bottom - top);
        renderer.setScissorTest(true);
        renderer.render(studyScene, camera);
        renderer.setScissorTest(false);
      }
    }
    if (gpuQuery) {
      gl.endQuery(timerExtension.TIME_ELAPSED_EXT);
      queries.push(gpuQuery);
    }
    return true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    surface.removeEventListener('webglcontextlost', contextLost);
    queries.forEach(query => gl.deleteQuery(query));
    resources.forEach(resource => resource.dispose());
    resources.clear();
    blooms.clear();
    crystals.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    surface.width = surface.height = 1;
    surface.remove();
  }

  function contextLost(event) {
    event.preventDefault();
    if (disposed || failed) return;
    failed = true;
    onFailure();
  }
  surface.addEventListener('webglcontextlost', contextLost);
  host.prepend(surface);
  return {
    resize,
    render,
    dispose,
    capture(target, state) {
      if (disposed || failed) return false;
      const original = { width, height, dpr };
      const exportWidth = target.canvas.width;
      const exportHeight = target.canvas.height;
      const sx = exportWidth / width;
      const sy = exportHeight / height;
      const scale = Math.min(sx, sy);
      const copies = new Map(state.blooms.map(bloom => [bloom, {
        ...bloom, source: bloom, x: bloom.x * sx, y: bloom.y * sy,
        fromX: (bloom.fromX ?? bloom.x) * sx, fromY: (bloom.fromY ?? bloom.y) * sy,
        size: bloom.size * scale
      }]));
      const exportState = {
        ...state,
        stars: state.stars.map(star => ({ ...star, x: star.x * sx, y: star.y * sy, r: star.r * scale })),
        blooms: [...copies.values()],
        connections: (state.connections ?? []).map(link => ({ from: copies.get(link.from), to: copies.get(link.to) }))
      };
      try {
        // One bounded drawing surface, reused briefly for the export. Reproject
        // positions, but scale flower geometry uniformly so portrait skies never stretch.
        resize(exportWidth, exportHeight, 1);
        if (!render(exportState)) return false;
        target.drawImage(surface, 0, 0);
        return true;
      } finally {
        // Same task: the intermediate export buffer is never presented onscreen.
        resize(original.width, original.height, original.dpr);
        render(state);
      }
    },
    get diagnostics() {
      return { calls: renderer.info.render.calls, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
        gpuMs: performance.now() - gpuSampleAt < 2000 ? gpuMs : null };
    }
  };
};
