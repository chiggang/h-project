import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _ from 'lodash';
import {
  BackgroundImage,
  Badge,
  Button,
  Checkbox,
  Drawer,
  FileInput,
  Image,
  ScrollArea,
  Select,
  TextInput,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import 'dayjs/locale/ko';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useRecoilState } from 'recoil';
import { IConfig } from '../interfaces/app.interface';
import { IMenu } from '../interfaces/system.interface';
import { useResizeObserver } from '@mantine/hooks';
import Home from '../components/system/Home';
import ManageNeuron from '../components/system/ManageNeuron';
import { configAtom } from '../recoils/config.atom';
import { selectedMenuAtom } from '../recoils/system/selectedMenu.atom';
import SelectedMenuPath from '../components/system/SelectedMenuPath';

const System = () => {
  // 환경 설정을 정의함
  const [config, setConfig] = useRecoilState<IConfig>(configAtom);

  // 선택한 메뉴를 정의함
  const [selectedMenu, setSelectedMenu] =
    useRecoilState<IMenu>(selectedMenuAtom);

  // 메뉴별 페이지 영역을 정의함
  const [contentRef, contentRect] = useResizeObserver();

  /**
   * 버튼 처리
   */

  // 메뉴 버튼을 클릭함
  const handleMenuButton_onClick = (menu: string) => {
    switch (menu) {
      // HOME
      case 'home':
        // 선택한 메뉴를 기억함
        setSelectedMenu({
          id: menu,
          path: 'HOME',
        });
        break;

      // NEURON > 뉴런 그룹 관리
      case 'neuron.manageNeuronGroup':
        // 선택한 메뉴를 기억함
        setSelectedMenu({
          id: menu,
          path: 'NEURON > 뉴런 그룹 관리',
        });
        break;

      // NEURON > 뉴런 정보 관리
      case 'neuron.manageNeuron':
        // 선택한 메뉴를 기억함
        setSelectedMenu({
          id: menu,
          path: 'NEURON > 뉴런 정보 관리',
        });
        break;

      // SYSTEM > 관리자 비밀번호 변경
      case 'system.changePassword':
        // 선택한 메뉴를 기억함
        setSelectedMenu({
          id: menu,
          path: 'SYSTEM > 관리자 비밀번호 변경',
        });
        break;

      // SYSTEM > 로그아웃
      case 'system.logout':
        break;

      default:
        break;
    }
  };

  /**
   * useEffect 처리
   */

  useEffect(() => {
    // 선택한 메뉴 버튼를 초기화함
    handleMenuButton_onClick('home');
  }, []);

  useEffect(() => {
    // console.log('> contentRect:', contentRect);
  }, [contentRect]);

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 상단 영역 */}
      <div className="w-full h-12 px-3 flex justify-between items-center border-b border-gray-200">
        {/* 로고 */}
        <div
          onClick={() => handleMenuButton_onClick('home')}
          className="button-event px-2 flex justify-center items-center space-x-2"
        >
          <span className="text-sm font-bold text-gray-700">H.Project</span>
          <Badge
            size="xs"
            variant="gradient"
            gradient={{ from: 'teal', to: 'indigo' }}
          >
            System
          </Badge>
        </div>

        {/* 버튼 */}
        <div className="px-2 flex justify-center items-center space-x-2">
          {/* 홈 */}
          <Button
            onClick={() => handleMenuButton_onClick('home')}
            leftIcon={
              <FontAwesomeIcon
                icon={['fas', 'house']}
                className="w-3.5 h-3.5"
              />
            }
            variant="subtle"
            color="dark"
            radius="md"
            size="xs"
            compact={true}
          >
            HOME
          </Button>

          {/* 로그아웃 */}
          <Button
            leftIcon={
              <FontAwesomeIcon
                icon={['fas', 'arrow-right-from-bracket']}
                className="w-3.5 h-3.5"
              />
            }
            variant="subtle"
            color="dark"
            radius="md"
            size="xs"
            compact={true}
          >
            LOGOUT
          </Button>
        </div>
      </div>

      {/* 중단 영역 */}
      <div className="w-full h-full flex">
        {/* 좌측 메뉴 */}
        <div className="w-60 h-full p-3 border-r border-gray-200 space-y-5">
          {/* 메뉴 제목 */}
          <div className="h-14 px-3 py-2 flex justify-end items-end bg-gray-700 rounded">
            <div className="flex justify-center items-center space-x-1">
              <div className="flex justify-center items-center">
                <FontAwesomeIcon
                  icon={['fas', 'bars']}
                  className="w-3 h-3 text-white"
                />
              </div>

              <div className="flex justify-center items-center">
                <span className="text-base font-bold text-white">Menu</span>
              </div>
            </div>
          </div>

          {/* 메뉴 */}
          <div className="space-y-7">
            {/* 섹션: NEURON */}
            <div className="space-y-2">
              {/* 섹션 제목 */}
              <div className="px-2 flex justify-start items-center">
                <span className="text-xs font-bold text-gray-500">NEURON</span>
              </div>

              {/* 메뉴 */}
              <div className="space-y-0.5">
                {/* 메뉴: 뉴런 그룹 관리 */}
                {/*<div>*/}
                {/*  <Button*/}
                {/*    onClick={() =>*/}
                {/*      handleMenuButton_onClick('neuron.manageNeuronGroup')*/}
                {/*    }*/}
                {/*    leftIcon={*/}
                {/*      <FontAwesomeIcon*/}
                {/*        icon={['fas', 'circle-nodes']}*/}
                {/*        className="w-3.5 h-3.5"*/}
                {/*      />*/}
                {/*    }*/}
                {/*    variant="subtle"*/}
                {/*    color="dark"*/}
                {/*    radius="md"*/}
                {/*    size="sm"*/}
                {/*    compact={true}*/}
                {/*  >*/}
                {/*    뉴런 그룹 관리*/}
                {/*  </Button>*/}
                {/*</div>*/}

                {/* 메뉴: 뉴런 정보 관리 */}
                <div>
                  <Button
                    onClick={() =>
                      handleMenuButton_onClick('neuron.manageNeuron')
                    }
                    leftIcon={
                      <FontAwesomeIcon
                        icon={['fas', 'pen-to-square']}
                        className="w-3.5 h-3.5"
                      />
                    }
                    variant="subtle"
                    color="dark"
                    radius="md"
                    size="sm"
                    compact={true}
                  >
                    뉴런 정보 관리
                  </Button>
                </div>
              </div>
            </div>

            {/* 섹션: SYSTEM */}
            <div className="space-y-2">
              {/* 섹션 제목 */}
              <div className="px-2 flex justify-start items-center">
                <span className="text-xs font-bold text-gray-500">SYSTEM</span>
              </div>

              {/* 메뉴 */}
              <div className="space-y-0.5">
                {/* 메뉴: 관리자 비밀번호 변경 */}
                <div>
                  <Button
                    onClick={() =>
                      handleMenuButton_onClick('system.changePassword')
                    }
                    leftIcon={
                      <FontAwesomeIcon
                        icon={['fas', 'unlock']}
                        className="w-3.5 h-3.5"
                      />
                    }
                    variant="subtle"
                    color="dark"
                    radius="md"
                    size="sm"
                    compact={true}
                  >
                    관리자 비밀번호 변경
                  </Button>
                </div>

                {/* 메뉴: 로그아웃 */}
                <div>
                  <Button
                    onClick={() => handleMenuButton_onClick('system.logout')}
                    leftIcon={
                      <FontAwesomeIcon
                        icon={['fas', 'arrow-right-from-bracket']}
                        className="w-3.5 h-3.5"
                      />
                    }
                    variant="subtle"
                    color="dark"
                    radius="md"
                    size="sm"
                    compact={true}
                  >
                    로그아웃
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 페이지 */}
        <div className="relative flex-grow flex h-full overflow-hidden">
          {/* 메뉴별 페이지 */}
          <div className="absolute left-0 top-0 w-full z-20">
            <ScrollArea
              style={{
                height: contentRect.top + contentRect.y + contentRect.height,
              }}
            >
              <div className="px-5 pt-3 pb-7 mb-32 bg-white drop-shadow space-y-6">
                {/* 선택한 메뉴 */}
                <SelectedMenuPath />

                {/* HOME */}
                {selectedMenu.id === 'home' && <Home />}

                {/* NEURON > 뉴런 정보 관리 */}
                {selectedMenu.id === 'neuron.manageNeuron' && <ManageNeuron />}
              </div>
            </ScrollArea>
          </div>

          {/* 저작권 */}
          <div
            ref={contentRef}
            className="absolute left-0 top-0 w-full h-full py-7 flex justify-center items-end bg-gray-200 z-10"
          >
            <div>
              <div className="py-1 flex justify-center items-center bg-gradient-to-r from-cyan-600 to-indigo-400 rounded">
                <span className="text-sm font-bold text-white">
                  H.Project . 2022
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-500">
                  Powered by SYSNOVA
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default System;
