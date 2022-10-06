import { useRecoilState } from 'recoil';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IMenu } from '../../interfaces/system.interface';
import { selectedMenuAtom } from '../../recoils/system/selectedMenu.atom';

/**
 * 선택한 메뉴 경로
 * @param props
 * @constructor
 */
const SelectedMenuPath: React.FC<any> = (props: any) => {
  // 선택한 메뉴를 정의함
  const [selectedMenu, setSelectedMenu] =
    useRecoilState<IMenu>(selectedMenuAtom);

  useEffect(() => {}, []);

  return (
    <div className="pb-2.5 border-b border-gray-200 border-dashed">
      <span className="text-base font-bold text-gray-700">
        {selectedMenu.path}
      </span>
    </div>
  );
};

export default SelectedMenuPath;
