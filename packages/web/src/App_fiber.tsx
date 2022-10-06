import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import { TextInput } from '@mantine/core';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, Vector3 } from '@react-three/fiber';
import {
  CameraShake,
  Environment,
  OrbitControls,
  Stars,
  useGLTF,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Outline,
  Selection,
  Select,
} from '@react-three/postprocessing';

import './styles/App.css';
import CameraControls from 'camera-controls';

CameraControls.install({ THREE });

function App_fiber() {
  // FontAwesome 아이콘을 불러옴
  library.add(fab, far, fas);

  const [zoom, setZoom] = useState<boolean>(false);
  const [focus, setFocus] = useState({ x: 0, y: 0, z: 0 });

  //
  // const { camera } = useThree();

  //
  const [cameraPosition, setCameraPosition] = useState<Vector3>([0, 0, 10]);

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-800">
      {/* 제목 */}
      <div className="absolute left-7 top-5 z-30">
        <span className="text-2xl font-bold text-white">LINA's System</span>
      </div>

      {/* 검색 */}
      <div className="absolute left-7 top-16 z-30">
        <TextInput placeholder="Search" label="" />
      </div>

      {/* ? */}
      <div id="three-area" className="absolute left-0 top-0 w-full h-full z-20">
        {/*<Canvas camera={{ fov: 10, position: cameraPosition }}>*/}
        <Canvas>
          <Suspense fallback={null}>
            <OrbitControls />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 15, 10]} angle={0.3} />
            <pointLight position={[10, 10, 10]} />
            {/*<Box position={[1, 0, 0]} />*/}
            <Neuron position={[0, 0, 0]} />
            <Neuron position={[1, 0, 0]} rotation={[0, 0, 0]} />
            {/*<Stars />*/}
            {/*<pointLight distance={100} intensity={4} color="white" />*/}
            {/*<Environment preset="warehouse" />*/}
            {/*<mesh>*/}
            {/*  <sphereGeometry args={[0.2, 64, 64]} />*/}
            {/*  <meshPhysicalMaterial*/}
            {/*    depthWrite={false}*/}
            {/*    transmission={1}*/}
            {/*    thickness={10}*/}
            {/*    roughness={0.65}*/}
            {/*  />*/}
            {/*</mesh>*/}
            {/*<Dolly />*/}
            {/*<Controls zoom={zoom} focus={focus} />*/}
            {/*<Controls zoom={controlMutate?.zoom} focus={controlMutate?.focus} />*/}
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

const Dolly = () => {
  useFrame((state) => {
    // state.camera.position.z = 50 + Math.sin(state.clock.getElapsedTime()) * 30;
    // state.camera.updateProjectionMatrix();
  });

  return null;
};

const Controls = ({
  zoom = false,
  focus = new THREE.Vector3(),
  pos = new THREE.Vector3(),
  look = new THREE.Vector3(),
}) => {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const controls = useMemo(() => new CameraControls(camera, gl.domElement), []);
  return useFrame((state, delta) => {
    zoom ? pos.set(focus.x, focus.y, focus.z + 0.2) : pos.set(0, 0, 5);
    zoom ? look.set(focus.x, focus.y, focus.z - 0.2) : look.set(0, 0, 4);

    state.camera.position.lerp(pos, 0.5);
    state.camera.updateProjectionMatrix();

    controls.setLookAt(
      state.camera.position.x,
      state.camera.position.y,
      state.camera.position.z,
      look.x,
      look.y,
      look.z,
      true,
    );
    return controls.update(delta);
  });
};

const Neuron = (props: any) => {
  // 컨트롤 SWR을 정의함
  // const { controlMutate, modifyZoomMutate, modifyFocusMutate } =
  //   useControlSWR();

  const gltf = useGLTF('/gltf/multipolar_neuron/scene.gltf');
  // const gltf = useGLTF('/gltf/neuron/scene.gltf');

  const handleMesh_onClick = (event: any) => {
    console.log('> handleMesh_onClick:', event);

    // setZoom(!zoom);
    // setFocus(event.object.position);

    // (async () => {
    //   await modifyZoomMutate(!controlMutate?.zoom);
    //   // await modifyFocusMutate(event.object.position);
    //   await modifyFocusMutate(event.unprojectedPoint);
    // })();
  };

  const handleMesh_onPointerOver = (event: MouseEvent) => {
    // console.log('> handleMesh_onPointerOver:', event);
  };

  const handleMesh_onPointerLeave = (event: MouseEvent) => {
    // console.log('> handleMesh_onPointerLeave:', event);
  };

  useEffect(() => {}, []);

  // useEffect(() => {
  //   gltf.scene.traverse((object: Object3D) => {
  //     if (object instanceof Mesh) {
  //       object.castShadow = true;
  //       object.receiveShadow = true;
  //       object.material.envMapIntensity = 10;
  //
  //       console.log('> ok');
  //     }
  //   });
  // }, [gltf]);

  return (
    // <Selection enabled>
    //   <EffectComposer>
    //     <Bloom
    //       kernelSize={3}
    //       luminanceThreshold={0}
    //       luminanceSmoothing={0.1}
    //       intensity={0.2}
    //     />
    //     {/*<Outline blur edgeStrength={100} />*/}
    //   </EffectComposer>

    // <CameraShake
    //   yawFrequency={0.2}
    //   pitchFrequency={0.2}
    //   rollFrequency={0.2}
    // />

    // <Select enabled>
    <mesh
      {...props}
      onClick={handleMesh_onClick}
      onPointerOver={handleMesh_onPointerOver}
      onPointerLeave={handleMesh_onPointerLeave}
    >
      <primitive object={gltf.scene.clone()}>
        {/*<spotLight position={[10, 15, 10]} angle={0.3} />*/}
      </primitive>
      {/*<directionalLight intensity={1} />*/}
      {/*<directionalLight intensity={1} />*/}
      {/*<ambientLight intensity={1.2} />*/}
      {/*<spotLight*/}
      {/*  color={[0, 0.5, 1]}*/}
      {/*  intensity={2}*/}
      {/*  angle={0.1}*/}
      {/*  penumbra={0.5}*/}
      {/*  position={[0, 0, 10]}*/}
      {/*  castShadow*/}
      {/*/>*/}
      {/*<meshStandardMaterial emissive={[0.5, 0.5, 0.5]} color={[0, 0, 0]} />*/}
    </mesh>
    //   </Select>
    // </Selection>
  );
};

function Box(props: any) {
  return (
    <mesh {...props} scale={1}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default App_fiber;
