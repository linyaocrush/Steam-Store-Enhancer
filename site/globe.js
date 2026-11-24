import * as THREE from 'three';
import { mesh } from 'topojson-client';
import world from 'world-atlas/land-110m.json';

const radians = Math.PI / 180;

function onSphere(longitude, latitude, radius = 1) {
  const theta = (longitude - 166) * radians;
  const phi = latitude * radians;
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.cos(theta),
  );
}

function addSegments(group, paths, color, opacity) {
  const vertices = [];
  for (const points of paths) {
    for (let index = 1; index < points.length; index++) {
      vertices.push(...points[index - 1].toArray(), ...points[index].toArray());
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity })));
}

function addEarth(earth) {
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(1, 72, 48), new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 surfaceNormal;
      void main() {
        surfaceNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 surfaceNormal;
      void main() {
        vec3 n = normalize(surfaceNormal);
        float light = max(dot(n, normalize(vec3(-0.5, 0.65, 0.6))), 0.0);
        float rim = pow(1.0 - max(n.z, 0.0), 2.8);
        vec3 color = mix(vec3(0.025, 0.065, 0.125), vec3(0.055, 0.23, 0.39), light);
        gl_FragColor = vec4(color + rim * vec3(0.16, 0.54, 0.78), 1.0);
      }
    `,
  })));

  const latitudes = Array.from({ length: 11 }, (_, row) =>
    Array.from({ length: 121 }, (_, step) => onSphere(step * 3, row * 15 - 75, 1.003)));
  const longitudes = Array.from({ length: 24 }, (_, column) =>
    Array.from({ length: 61 }, (_, step) => onSphere(column * 15, step * 3 - 90, 1.003)));
  addSegments(earth, [...latitudes, ...longitudes], 0x61bdf5, 0.29);

  const coastlines = mesh(world, world.objects.land).coordinates;
  addSegments(earth, coastlines.map(path => path.map(([lon, lat]) => onSphere(lon, lat, 1.01))), 0x9bdfff, 0.89);

  const beijing = onSphere(116.4, 39.9);
  const seattle = onSphere(-122.3, 47.6);
  const route = Array.from({ length: 100 }, (_, index) => {
    const t = index / 99;
    return beijing.clone().lerp(seattle, t).normalize().multiplyScalar(1.02 + Math.sin(Math.PI * t) * 0.26);
  });
  addSegments(earth, [route], 0x81e5ff, 0.9);

  for (const city of [beijing, seattle]) {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.023, 12, 8), new THREE.MeshBasicMaterial({ color: 0xc8f6ff }));
    pin.position.copy(city).multiplyScalar(1.025);
    earth.add(pin);
  }

  const traveler = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), new THREE.MeshBasicMaterial({ color: 0xd2faff }));
  earth.add(traveler);
  return { route, traveler };
}

function addOrbit(scene) {
  const orbit = new THREE.Group();
  orbit.rotation.set(0.22, -0.25, 0.36);
  const rings = [1.29, 1.38, 1.56].map((radius, index) => {
    return Array.from({ length: 193 }, (_, step) => {
      const angle = step * Math.PI / 96;
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * (0.4 + index * 0.025), Math.sin(angle) * 1.13);
    });
  });
  addSegments(orbit, rings.slice(0, 2), 0x74d4ff, 0.65);
  addSegments(orbit, rings.slice(2), 0x6ba5dc, 0.28);
  scene.add(orbit);
  return orbit;
}

function addStars(scene) {
  const positions = [];
  for (let index = 1; index <= 120; index++) {
    positions.push(
      ((index * 0.6180339) % 1 - 0.5) * 6.3,
      ((index * 0.7548777) % 1 - 0.5) * 4.8,
      -1.25 - (index % 12) * 0.14,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0x8ac7f4, size: 0.012, opacity: 0.58, transparent: true, depthWrite: false,
  })));
}

export function mountGlobe(container, motionPreference, canvas, context, createScene) {
  const renderer = new THREE.WebGLRenderer({ canvas, context });
  const figure = container.closest('figure');
  const toggle = figure.querySelector('.motion-toggle');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
  const earth = new THREE.Group();
  scene.add(earth);
  const updateScene = createScene ? createScene(earth) : (() => {
    const { route, traveler } = addEarth(earth);
    const orbit = addOrbit(scene);
    return time => {
      orbit.rotation.z = 0.36 + Math.sin(time * 0.55) * 0.07;
      traveler.position.copy(route[Math.floor((time * 21 + 40) % route.length)]);
    };
  })();
  addStars(scene);
  const pointer = new THREE.Vector2();
  const view = new THREE.Vector2();
  let paused = motionPreference.matches;
  let visible = false;
  let contextLost = false;
  let frame = 0;
  let start = 0;
  let elapsed = 0;

  function render(time) {
    earth.rotation.x = 0.17 + view.y;
    earth.rotation.y = Math.sin(time * 0.45) * 0.21 + view.x;
    earth.rotation.z = -0.12;
    updateScene(time);
    renderer.render(scene, camera);
  }

  function tick(timestamp) {
    if (!start) start = timestamp;
    view.lerp(pointer, 0.08);
    render(elapsed + (timestamp - start) / 1000);
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    toggle.textContent = paused ? '播放动画' : '暂停动画';
    if (!paused && visible && !document.hidden && !contextLost) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else if (frame) {
      cancelAnimationFrame(frame);
      if (start) elapsed += (performance.now() - start) / 1000;
      start = 0;
      frame = 0;
    }
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height || contextLost) return;
    camera.aspect = width / height;
    camera.position.z = Math.max(4.85, 4.55 / camera.aspect);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height, false);
    render(elapsed);
  }

  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    toggle.hidden = true;
    figure.classList.remove('webgl-ready');
    syncPlayback();
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    resize();
    toggle.hidden = false;
    figure.classList.add('webgl-ready');
    syncPlayback();
  });

  container.append(renderer.domElement);
  resize();
  figure.classList.add('webgl-ready');
  toggle.hidden = false;
  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  }).observe(container);

  toggle.addEventListener('click', () => {
    paused = !paused;
    syncPlayback();
  });
  motionPreference.addEventListener('change', event => {
    paused = event.matches;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  figure.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || paused) return;
    const rect = figure.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width - 0.5) * 0.46, ((event.clientY - rect.top) / rect.height - 0.5) * 0.33);
  });
  figure.addEventListener('pointerleave', () => pointer.set(0, 0));
  syncPlayback();
}
