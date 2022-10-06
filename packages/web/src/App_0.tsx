import React, { useEffect, useRef, useState } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import { Container, Engine } from 'tsparticles-engine';
import { TextInput } from '@mantine/core';
import * as THREE from 'three';

import './styles/App.css';
import { ThemeContext } from '@emotion/react';
import {
  AmbientLight,
  AnimationMixer,
  Clock,
  Mesh,
  Object3D,
  PerspectiveCamera,
  PointLight,
  WebGLRenderer,
} from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

let camera: PerspectiveCamera;
let renderer: WebGLRenderer;

function App_0() {
  // FontAwesome 아이콘을 불러옴
  library.add(fab, far, fas);

  useEffect(() => {
    // 컨테이너의 크기
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 카메라의 시야각(수치가 커지면 시야각이 넓어짐)
    const fieldOfView = 70;

    // 시야의 가로세로 비율(컨테이너의 가로세로 비율을 주로 사용함)
    const aspect = width / height;

    // 렌더링할 개체 거리의 최소값(너무 가까이 있는 개체는 그리지 않음. 0~far 사이의 값을 사용함)
    const near = 0.01;

    // 렌더링할 개체 거리의 최대값(너무 멀리 있는 개체는 그리지 않음)
    const far = 10000;

    // 카메라를 생성함
    camera = new PerspectiveCamera(fieldOfView, aspect, near, far);
    camera.position.z = 1;

    // 공간을 생성함
    const scene = new THREE.Scene();

    //
    const animation = () => {
      const speed = Math.random() / 20;
      mesh.rotation.x += speed;
      mesh.rotation.y += speed;
      mesh.rotation.z += speed;

      // 마우스 컨트롤을 갱신함
      controls.update();

      renderer.render(scene, camera);
    };

    // 렌더러를 생성함
    renderer = new THREE.WebGLRenderer({
      alpha: true, // 투명한 배경
      antialias: true, // 안티얼라이어싱
    });
    renderer.setSize(width, height);
    renderer.setAnimationLoop(animation);

    // 마우스 컨트롤을 생성함
    const controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    // controls.maxPolarAngle = Math.PI * 0.5;
    // controls.screenSpacePanning = false;
    // controls.rotateSpeed = 0.04;
    // controls.maxPolarAngle = Math.PI * 0.5;
    // controls.minDistance = 100;
    // controls.maxDistance = 500;

    // 조명을 생성함
    const pointLight = new PointLight(0xffffff, 0.5);
    pointLight.position.x = 100;
    pointLight.position.y = 100;
    pointLight.position.z = 30;

    // 공간에 조명을 추가함
    scene.add(pointLight);

    // const ambientLight = new AmbientLight(0xffffff, 0.5);
    // scene.add(ambientLight);

    // 개체의 뼈대를 생성함
    const radius = 40;
    const geometry = new THREE.OctahedronGeometry(radius, 0);

    // 개체의 표면을 생성함
    // const material = new THREE.MeshBasicMaterial({ color: '#FF3030' });
    const material = new THREE.MeshLambertMaterial({ color: 0xff3030 });
    // const material = new THREE.MeshNormalMaterial();

    // 개체를 생성함
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -radius * 10;

    // 공간에 개체를 추가함
    scene.add(mesh);

    //
    const loader = new GLTFLoader();

    //
    loader.load(
      '/gltf/multipolar_neuron/scene.gltf',
      (gltf: GLTF) => {
        console.log('> gltf:', gltf);

        const neuron = gltf.scene;

        neuron.traverse((child: any) => {
          // console.log('> child:', child);

          // child.material.opacity = 0.9;

          if ((child as Mesh).isMesh) {
            // child.material.opacity = 0.5;
            console.log('> 1');
            // child.material.color = 'red';
            // child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 2;
            child.castShadow = true;
            child.receiveShadow = true;
          }

          if (child instanceof Mesh) {
            console.log('> 2');
            // child.material.color = 'blue';
            // child.material.emissive = new THREE.Color(0x000000);
          }
        });

        neuron.position.set(0, 0, 0);
        // neuron.scale.set(1, 1, 1);

        // const object = new THREE.Mesh(gltf.asset, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));

        // (neuron.children[0] as Mesh).material.color.set('rgb(100,200,100)');

        // scene.add(neuron.children[0]);
        scene.add(neuron);

        const neuron2 = neuron.clone();
        neuron2.position.set(0.5, 0, 0);
        scene.add(neuron2);
      },
      (xhr: ProgressEvent) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error: ErrorEvent) => {
        console.log('> error:', error);
      },
    );

    const light = new THREE.HemisphereLight(0x0065fc, 0x427acf);
    light.position.set(0, 200, 100);
    scene.add(light);

    // const light = new THREE.AmbientLight(0x404040, 100);
    // scene.add(light);

    // const light = new THREE.DirectionalLight(0xffffff);
    // light.position.set(0, 200, 100);
    // light.castShadow = true;
    // light.shadow.camera.top = 180;
    // scene.add(light);

    // 컨테이너에 렌더러를 추가함
    const container = document.querySelector('#three-area');
    container?.appendChild(renderer.domElement);

    // const update = () => {
    //   const speed = Math.random() / 20;
    //   mesh.rotation.x += speed;
    //   mesh.rotation.y += speed;
    //   mesh.rotation.z += speed;
    //   renderer.render(scene, camera);
    //   requestAnimationFrame(update);
    // };
    // requestAnimationFrame(update);

    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('resize', onWindowResize);
    };
  }, []);

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  return (
    <div className="w-screen h-screen bg-gray-500">
      {/* 제목 */}
      <div className="absolute left-7 top-5 z-30">
        <span className="text-2xl font-bold text-white">LINA's System</span>
      </div>

      {/* 검색 */}
      <div className="absolute left-7 top-16 z-30">
        <TextInput placeholder="Search" label="" />
      </div>

      {/* 파티클 */}
      <div
        id="three-area"
        className="absolute left-0 top-0 w-full h-full z-20"
      ></div>

      {/* 배경이미지 */}
      {/*<div className="absolute left-0 top-0 w-full h-full z-10">*/}
      {/*  <div className="absolute left-0 top-0 w-full h-full bg-black/30 z-10" />*/}
      {/*  <div*/}
      {/*    className="w-full h-full blur"*/}
      {/*    style={{*/}
      {/*      backgroundImage: `url(/images/neuron_3.jpg)`,*/}
      {/*      backgroundSize: 'cover',*/}
      {/*      backgroundRepeat: 'no-repeat',*/}
      {/*      backgroundPosition: 'center center',*/}
      {/*    }}*/}
      {/*  />*/}
      {/*</div>*/}
    </div>
  );
}

export default App_0;
