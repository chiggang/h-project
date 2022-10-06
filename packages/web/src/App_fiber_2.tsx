import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import { TextInput } from '@mantine/core';
import * as THREE from 'three';
import {
  Canvas,
  useFrame,
  useLoader,
  useThree,
  Vector3,
} from '@react-three/fiber';
import {
  CameraShake,
  Center,
  Cloud,
  CubeCamera,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  PresentationControls,
  Sky,
  Sparkles,
  Stars,
  useGLTF,
} from '@react-three/drei';

import './styles/App.css';
import { CubeTextureLoader } from 'three';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import MultiPolarNeuron from './components/MultiPolarNeuron';

interface INeuron {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  data: {
    title: string;
    date: string;
  };
}

function App_fiber_2() {
  // FontAwesome 아이콘을 불러옴
  library.add(fab, far, fas);

  // 뉴런 개체를 정의함
  const [neuronData, setNeuronData] = useState<INeuron[]>([]);

  useEffect(() => {
    const tmpNeuronData: INeuron[] = [
      {
        id: 'object-1',
        position: { x: -1, y: -0.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        data: {
          title: 'Lina Essay Vol.13',
          date: '2022.07.01',
        },
      },
      {
        id: 'object-2',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        data: {
          title: 'Lina Paint #103',
          date: '2022.07.10',
        },
      },
      {
        id: 'object-3',
        position: { x: 1, y: -0.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        data: {
          title: 'He wishes for the cloths of heaven',
          date: '2022.08.01',
        },
      },
    ];

    setNeuronData(tmpNeuronData);

    return () => {};
  }, []);

  // useEffect(() => {
  //   if (controlMutate === undefined) {
  //     return;
  //   }
  //
  //   let tmpX = -controlMutate.rotationCenter.x;
  //   let tmpY = -controlMutate.rotationCenter.y;
  //   let tmpZ = -controlMutate.rotationCenter.z;
  //
  //   let tmpNeuronData = _.cloneDeep(neuronData);
  //
  //   tmpNeuronData.map((object: INeuron) => {
  //     object.position.x += tmpX;
  //     object.position.y += tmpY;
  //     object.position.z += tmpZ;
  //   });
  //
  //   setNeuronData(tmpNeuronData);
  // }, [controlMutate?.selectedObjectId]);

  return (
    <div className="w-screen h-screen bg-gray-900 select-none">
      {/* 제목 */}
      <div className="absolute left-7 top-5 z-40">
        <span className="text-2xl font-bold text-white">LINA's System</span>
      </div>

      {/* 검색 */}
      <div className="absolute left-7 top-16 z-40">
        <TextInput placeholder="Search" label="" />
      </div>

      {/* hover */}
      {/*{controlMutate?.hoverPosition.visible === true && (*/}
      {/*  <div*/}
      {/*    style={{*/}
      {/*      left: `${controlMutate?.hoverPosition.x}px`,*/}
      {/*      top: `${controlMutate?.hoverPosition.y}px`,*/}
      {/*    }}*/}
      {/*    className="absolute left-0 top-0 px-3 py-3 bg-gray-600/30 backdrop-filter backdrop-blur-sm rounded shadow-md z-30"*/}
      {/*  >*/}
      {/*    <div className="leading-none">*/}
      {/*      <span className="text-lg font-bold text-white">*/}
      {/*        {*/}
      {/*          neuronData.filter(*/}
      {/*            (data: INeuron) =>*/}
      {/*              data.id === controlMutate?.hoverPosition.id,*/}
      {/*          )[0]?.data.title*/}
      {/*        }*/}
      {/*      </span>*/}
      {/*    </div>*/}
      {/*    <div className="pt-1 leading-none">*/}
      {/*      <span className="text-xs text-gray-400">*/}
      {/*        {*/}
      {/*          neuronData.filter(*/}
      {/*            (data: INeuron) =>*/}
      {/*              data.id === controlMutate?.hoverPosition.id,*/}
      {/*          )[0]?.data.date*/}
      {/*        }*/}
      {/*      </span>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*)}*/}

      {/* 3D */}
      <div className="absolute left-0 top-0 w-full h-full z-20">
        <Canvas>
          <Suspense fallback={null}>
            {/*<PerspectiveCamera*/}
            {/*  aspect={window.innerWidth / window.innerHeight}*/}
            {/*  onUpdate={(c) => c.updateProjectionMatrix()}*/}
            {/*  scale={2}*/}
            {/*  position={[0, 0, 0]}*/}
            {/*/>*/}
            <OrbitControls />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 15, 10]} angle={0.3} />
            <pointLight position={[10, 10, 10]} />

            <PerspectiveCamera
              fov={75}
              aspect={window.innerWidth / window.innerHeight}
              scale={4}
              position={[0, 0, 0]}
            >
              <Center position={[0, 0, 0]}>
                {neuronData.map((object: INeuron) => (
                  <MultiPolarNeuron
                    key={object.id}
                    position={[
                      object.position.x,
                      object.position.y,
                      object.position.z,
                    ]}
                    rotation={[
                      object.rotation.x,
                      object.rotation.y,
                      object.rotation.z,
                    ]}
                    // tag={object}
                  />
                  // <Neuron
                  //   key={object.id}
                  //   position={[
                  //     object.position.x,
                  //     object.position.y,
                  //     object.position.z,
                  //   ]}
                  //   rotation={[
                  //     object.rotation.x,
                  //     object.rotation.y,
                  //     object.rotation.z,
                  //   ]}
                  //   tag={object}
                  // />
                ))}
              </Center>
            </PerspectiveCamera>
            {/*<Swarm count={20000} />*/}
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

const Neuron = (props: any) => {
  const mesh = useRef<THREE.Mesh>(null!);

  const gltf = useGLTF('/gltf/multipolar_neuron/scene.gltf');
  // const gltf = useGLTF('/gltf/neuron/scene.gltf');

  // const { nodes } = useGLTF('/gltf/multipolar_neuron/scene.gltf');

  const handleMesh_onClick = (event: any) => {
    console.log('> handleMesh_onClick:', event);

    console.log('> props:', props);

    // (async () => {
    //   await modifyRotationCenterMutate(props.tag.position);
    //   await modifySelectedObjectIdMutate(props.tag.id);
    // })();

    // (async () => {
    //   await modifyZoomMutate(!controlMutate?.zoom);
    //   // await modifyFocusMutate(event.object.position);
    //   await modifyFocusMutate(event.unprojectedPoint);
    // })();
  };

  const handleMesh_onPointerOver = (event: MouseEvent) => {
    // console.log('> handleMesh_onPointerOver:', event);
    // (async () => {
    //   await modifyHoverPositionMutate({
    //     visible: true,
    //     id: props.tag.id,
    //     x: event.offsetX + 15,
    //     y: event.offsetY,
    //   });
    // })();
  };

  const handleMesh_onPointerLeave = (event: MouseEvent) => {
    // console.log('> handleMesh_onPointerLeave:', event);
    // (async () => {
    //   await modifyHoverPositionMutate({
    //     visible: false,
    //     id: '',
    //     x: 0,
    //     y: 0,
    //   });
    // })();
  };

  useFrame((state, delta) => {
    // mesh.current.rotation.z += 0.01;
  });

  useEffect(() => {
    console.log('> props:', props);

    console.log('> mesh.current.material:', mesh.current);
    // (
    //   (mesh.current as THREE.Mesh).material as THREE.MeshBasicMaterial
    // ).wireframe = true;

    (mesh.current.material as THREE.MeshStandardMaterial).color.set(
      'rgb(200,0,0)',
    );
  }, []);

  return (
    <mesh
      {...props}
      ref={mesh}
      castShadow={true}
      receiveShadow={true}
      scale={1}
      onClick={handleMesh_onClick}
      onPointerOver={handleMesh_onPointerOver}
      onPointerLeave={handleMesh_onPointerLeave}
    >
      <primitive object={gltf.scene.clone()}></primitive>
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
      <Html distanceFactor={7}>
        <div className="px-3 py-2 flex justify-center items-center bg-black rounded leading-none">
          <span className="text-xs text-gray-300 whitespace-nowrap">
            {props.tag.id}
          </span>
        </div>
      </Html>
      {/*<meshStandardMaterial opacity={0.5} />*/}
      {/*<meshLambertMaterial attach="material" color="hotpink" />*/}
    </mesh>
  );
};

const Swarm = (count: any) => {
  const mesh: any = useRef();
  const light: any = useRef();
  const { viewport, mouse } = useThree();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Generate some random positions, speed factors and timings
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.0001 + Math.random() / 2000;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);
  // The innards of this hook will run every frame
  useFrame((state) => {
    // Makes the light follow the mouse
    light.current.position.set(
      (mouse.x * viewport.width) / 2,
      (mouse.y * viewport.height) / 2,
      0,
    );
    // Run through the randomized data to calculate some movement
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      // There is no sense or reason to any of this, just messing around with trigonometric functions
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      particle.mx += mouse.x * viewport.width * particle.mx * 0.01;
      particle.my += mouse.y * viewport.height * particle.my * 0.01;
      // Update the dummy object
      dummy.position.set(
        (particle.mx / 10) * a +
          xFactor +
          Math.cos((t / 10) * factor) +
          (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b +
          yFactor +
          Math.sin((t / 10) * factor) +
          (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b +
          zFactor +
          Math.cos((t / 10) * factor) +
          (Math.sin(t * 3) * factor) / 10,
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      // And apply the matrix to the instanced item
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <pointLight ref={light} distance={60} intensity={20} color="red">
        {/*<mesh scale={[4, 4, 40]}>*/}
        {/*  <dodecahedronGeometry />*/}
        {/*</mesh>*/}
      </pointLight>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="black" />
      </instancedMesh>
    </>
  );
};

export default App_fiber_2;
