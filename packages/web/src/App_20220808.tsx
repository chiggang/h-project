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

import './styles/App.css';

function App() {
  // FontAwesome 아이콘을 불러옴
  library.add(fab, far, fas);

  const particlesInit = async (main: Engine) => {
    console.log(main);

    // you can initialize the tsParticles instance (main) here, adding custom shapes or presets
    // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
    // starting from v2 you can add only the features you need reducing the bundle size
    await loadFull(main);
  };

  const particlesLoaded = async (container: Container | undefined) => {
    console.log(container);
  };

  const handleButton_onClick = () => {
    // _.range(1, 100).map((number: number) => {
    //   // 순서도의 노드를 생성함
    //   const node3: RCFNSample = new RCFNSample();
    //   node3.setGroupId('abc');
    //   node3.setHeaderTitle('Node.3');
    //   node3.setSizeChangeable(false);
    //   node3.setPosition(10 + number * 2, 10 + number * 2);
    //
    //   // 생성한 노드를 순서도에 추가함
    //   flowchartRef.current?.addNode(node3);
    // });
  };

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div className="w-screen h-screen bg-black">
      {/* 제목 */}
      <div className="absolute left-7 top-5 z-30">
        <span className="text-2xl font-bold text-white">LINA's System</span>
      </div>

      {/* 검색 */}
      <div className="absolute left-7 top-16 z-30">
        <TextInput placeholder="Search" label="" />
      </div>

      {/* 파티클 */}
      <div className="absolute left-0 top-0 w-full h-full z-20">
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            background: {
              color: {
                value: '',
              },
              opacity: 0,
            },
            fpsLimit: 60,
            interactivity: {
              events: {
                onClick: {
                  enable: false,
                  mode: 'push',
                },
                onHover: {
                  enable: true,
                  mode: 'bubble',
                },
                resize: true,
              },
              modes: {
                push: {
                  quantity: 4,
                },
                repulse: {
                  distance: 200,
                  duration: 0.4,
                },
              },
            },
            particles: {
              color: {
                value: 'rgb(144,187,224)',
              },
              links: {
                color: 'rgb(189,189,189)',
                distance: 150,
                enable: true,
                opacity: 0.5,
                width: 1,
              },
              collisions: {
                enable: true,
              },
              move: {
                direction: 'none',
                enable: true,
                outModes: {
                  default: 'bounce',
                },
                random: false,
                speed: 0.2,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 80,
              },
              opacity: {
                value: 0.5,
              },
              shadow: {
                enable: true,
                color: { value: 'rgb(0,0,0)' },
                offset: {
                  x: 0,
                  y: 0,
                },
                blur: 5,
              },
              shape: {
                type: 'circle',
              },
              size: {
                value: { min: 5, max: 10 },
              },
            },
            detectRetina: true,
          }}
        />
      </div>

      {/* 배경이미지 */}
      <div className="absolute left-0 top-0 w-full h-full z-10">
        <div className="absolute left-0 top-0 w-full h-full bg-black/30 z-10" />
        <div
          className="w-full h-full blur"
          style={{
            backgroundImage: `url(/images/neuron_3.jpg)`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
          }}
        />
      </div>
    </div>
  );
}

export default App;
