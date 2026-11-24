import * as THREE from 'three';

function solid(group, geometry, color, options = {}) {
  const object = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, ...options }));
  group.add(object);
  return object;
}

function outline(group, geometry, color, opacity = 0.65) {
  const object = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 26), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  group.add(object);
}

function ring(group, radius, color) {
  const object = solid(group, new THREE.TorusGeometry(radius, 0.006, 6, 100), color);
  object.rotation.x = 1.15;
  object.rotation.y = -0.25;
  return object;
}

function prices(group) {
  const board = new THREE.Group();
  group.add(board);
  const platform = new THREE.BoxGeometry(2.65, 0.09, 1.22);
  solid(board, platform, 0x142d40).position.y = -0.66;
  const border = new THREE.Group();
  border.position.y = -0.66;
  board.add(border);
  outline(border, platform, 0x549dc4);
  const grid = new THREE.GridHelper(2.55, 10, 0x376984, 0x264a61);
  grid.scale.z = 0.45;
  grid.position.y = -0.61;
  board.add(grid);

  const heights = [0.72, 1.19, 0.9, 1.41, 0.54];
  const points = heights.map((height, index) => {
    const x = (index - 2) * 0.51;
    const bar = new THREE.Group();
    bar.position.set(x, height / 2 - 0.61, 0);
    board.add(bar);
    const shape = new THREE.BoxGeometry(0.31, height, 0.42);
    const discount = index === heights.length - 1;
    const edge = discount ? 0xc4ed85 : 0x80d9ff;
    solid(bar, shape, discount ? 0x4e773d : 0x225574);
    outline(bar, shape, edge, 0.9);
    solid(bar, new THREE.BoxGeometry(0.30, 0.023, 0.41), edge).position.y = height / 2;
    return new THREE.Vector3(x, height - 0.42, 0.07);
  });
  board.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x9fddfa })));
  for (const point of points) {
    solid(board, new THREE.OctahedronGeometry(0.037), 0xb9edff).position.copy(point);
  }
  const marker = solid(board, new THREE.OctahedronGeometry(0.07), 0xe0ffac);
  return time => {
    board.rotation.x = 0.26;
    board.rotation.y = -0.23 + Math.sin(time * 0.8) * 0.09;
    const position = (1 - Math.abs((time * 0.55 % 2) - 1)) * (points.length - 1);
    const segment = Math.min(Math.floor(position), points.length - 2);
    marker.position.lerpVectors(points[segment], points[segment + 1], position - segment);
    marker.rotation.y = time * 2;
  };
}

function cart(group) {
  const stack = [-1, 0, 1].map((offset, index) => {
    const item = new THREE.Group();
    group.add(item);
    const cover = new THREE.BoxGeometry(0.88, 1.23, 0.09);
    const color = [0xf0ba76, 0x8fe8ff, 0xa3afd9][index];
    solid(item, cover, [0x513d49, 0x164763, 0x303853][index]);
    outline(item, cover, color);
    const art = solid(item, new THREE.IcosahedronGeometry(0.24, index === 1 ? 1 : 0), color, { wireframe: true });
    art.position.set(0, 0.14, 0.10);
    for (let line = 0; line < 3; line++) {
      const label = solid(item, new THREE.BoxGeometry(0.53 - line * 0.1, 0.018, 0.018), color);
      label.position.set(-line * 0.05, -0.29 - line * 0.07, 0.055);
    }
    item.position.set(offset * 0.71, -offset * 0.21, offset === 0 ? 0.42 : -0.13);
    item.rotation.set(0, offset * 0.35, -offset * 0.16);
    return { item, art, offset };
  });
  const orbit = ring(group, 1.49, 0xa17b55);
  return time => {
    for (const { item, art, offset } of stack) {
      item.position.y = -offset * 0.21 + Math.sin(time * 1.5 + offset * 1.2) * 0.09;
      art.rotation.y = time * 0.72;
    }
    orbit.rotation.y = Math.sin(time * 0.8) * 0.25;
  };
}

function social(group) {
  const positions = [[0, 0, 0], [-1.05, 0.62, 0.1], [1.04, 0.45, -0.2], [-0.78, -0.66, 0.2], [0.86, -0.68, 0.15], [0.1, 0.82, -0.64]].map(pos => new THREE.Vector3(...pos));
  const hub = solid(group, new THREE.IcosahedronGeometry(0.31, 1), 0x90e6fd, { wireframe: true });
  const packets = positions.slice(1).map((position, index) => {
    const color = [0x96ebff, 0xb2d994, 0x8ed4ff, 0xe9be84, 0xa6d2fa][index];
    const node = solid(group, new THREE.IcosahedronGeometry(0.14, 0), color, { wireframe: true });
    node.position.copy(position);
    const geometry = new THREE.BufferGeometry().setFromPoints([positions[0], position]);
    group.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 })));
    return { node, position, packet: solid(group, new THREE.SphereGeometry(0.035, 10, 6), color) };
  });
  ring(group, 1.32, 0x37758e);
  return time => {
    hub.rotation.y = time * 0.54;
    packets.forEach(({ node, position, packet }, index) => {
      node.rotation.y = time * 0.85 + index;
      packet.position.copy(position).multiplyScalar((time * 0.63 + index * 0.23) % 1);
    });
  };
}

function family(group) {
  const geometry = new THREE.IcosahedronGeometry(0.65, 2);
  const planet = solid(group, geometry, 0x164a62);
  const shell = solid(group, geometry, 0x65c4c7, { wireframe: true, transparent: true, opacity: 0.3 });
  const satellites = [0x83ead3, 0x8ed0ff, 0xf1c784].map((color, index) => {
    const orbital = new THREE.Group();
    group.add(orbital);
    orbital.rotation.set(0.8 + index * 0.24, 0, -0.25 + index * 0.3);
    const radius = 0.91 + index * 0.25;
    const orbit = ring(orbital, radius, color);
    orbit.rotation.set(0, 0, 0);
    return { radius, satellite: solid(orbital, new THREE.SphereGeometry(0.08, 16, 10), color) };
  });
  return time => {
    planet.rotation.y = shell.rotation.y = time * 0.24;
    satellites.forEach(({ radius, satellite }, index) => {
      const angle = time * (0.9 - index * 0.16) + index * 2;
      satellite.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    });
  };
}

function install(group) {
  const core = new THREE.Group();
  group.add(core);
  const cube = new THREE.BoxGeometry(0.68, 0.68, 0.68);
  solid(core, cube, 0x245a6e);
  outline(core, cube, 0x99f4f5, 1);
  const boards = [-1, 0, 1].map((offset, index) => {
    const board = new THREE.Group();
    group.add(board);
    const geometry = new THREE.BoxGeometry(1.64, 0.048, 1.31);
    solid(board, geometry, [0x245269, 0x104660, 0x276276][index], { transparent: true, opacity: 0.68 });
    outline(board, geometry, 0x90d7e6);
    for (let trace = 0; trace < 5; trace++) {
      const line = solid(board, new THREE.BoxGeometry(0.91 - trace * 0.11, 0.008, 0.013), trace % 2 ? 0x75b7cc : 0xa3e9b7);
      line.position.set(0.15, 0.028, -0.38 + trace * 0.18);
    }
    return { board, offset };
  });
  group.rotation.x = 0.22;
  return time => {
    core.rotation.set(0.19, time * 0.7, 0.17);
    boards.forEach(({ board, offset }) => {
      board.position.y = offset * (0.50 + Math.sin(time * 1.4) * 0.13);
      board.rotation.y = 0.32 + Math.sin(time + offset * 1.5) * 0.13;
    });
  };
}

export const topicScenes = { prices, cart, social, family, install };
