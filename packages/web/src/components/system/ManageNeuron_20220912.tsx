import { useRecoilState } from 'recoil';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IMenu } from '../../interfaces/system.interface';
import { selectedMenuAtom } from '../../recoils/system/selectedMenu.atom';
import {
  Badge,
  Button,
  Checkbox,
  CloseButton,
  Drawer,
  FileInput,
  Image,
  Modal,
  Popover,
  Select,
  Switch,
  Table,
  Textarea,
  TextInput,
} from '@mantine/core';
import { neuronCategoryAtom } from '../../recoils/neuronCategory.atom';
import {
  IConfig,
  IMessageModal,
  INeuron,
  INeuronCategory,
  INeuronFile,
  INeuronGroup,
  ISortNeuron,
} from '../../interfaces/app.interface';
import axios, { AxiosResponse } from 'axios';
import { nanoid } from 'nanoid';
import { ENeuron } from '../../enums/app.enum';
import _ from 'lodash';
import { DatePicker } from '@mantine/dates';
import { useResizeObserver, useTimeout } from '@mantine/hooks';
import { openConfirmModal, openContextModal, openModal } from '@mantine/modals';
import * as yup from 'yup';
import dateFormat from 'dateformat';
import { configAtom } from '../../recoils/config.atom';
import urlJoin from 'url-join';
import { motion } from 'framer-motion';
import { ReactSortable } from 'react-sortablejs';

/**
 * NEURON > 뉴런 정보 관리
 * @param props
 * @constructor
 */
const ManageNeuron_20220913: React.FC<any> = (props: any) => {
  // 환경 설정을 정의함
  const [config, setConfig] = useRecoilState<IConfig>(configAtom);

  // 뉴런 분류를 정의함
  const [neuronCategory, setNeuronCategory] =
    useRecoilState<INeuronCategory[]>(neuronCategoryAtom);

  // 뉴런 그룹을 정의함
  const [neuronGroup, setNeuronGroup] = useState<INeuronGroup[]>([]);

  // 뉴런 그룹의 편집 상태를 정의함
  // true(편집 상태), false(보기 상태)
  const [isNeuronGroupEditMode, setIsNeuronGroupEditMode] =
    useState<boolean>(false);

  // 뉴런 그룹의 입력폼을 정의함
  const [neuronGroupForm, setNeuronGroupForm] = useState<INeuronGroup | null>(
    null,
  );

  // 선택한 뉴런 그룹을 정의함
  const [selectedNeuronGroup, setSelectedNeuronGroup] =
    useState<INeuronGroup | null>(null);

  // 뉴런 데이터를 정의함
  const [neurons, setNeurons] = useState<INeuron[]>([]);

  // 정렬용 뉴런 데이터를 정의함
  const [sortNeurons, setSortNeurons] = useState<ISortNeuron[]>([]);

  // 뉴런 데이터의 편집 상태를 정의함
  // true(편집 상태), false(보기 상태)
  const [isNeuronEditMode, setIsNeuronEditMode] = useState<boolean>(false);

  // 선택한 뉴런 데이터를 정의함
  const [selectedNeuron, setSelectedNeuron] = useState<INeuron | null>(null);

  // 파일 입력폼에서 선택한 이미지 파일을 정의함
  const [fileInputImage, setFileInputImage] = useState<File[]>([]);

  // 파일 입력폼에서 선택한 PDF 파일을 정의함
  const [fileInputPdf, setFileInputPdf] = useState<File[]>([]);

  // 저장하기 버튼 클릭 시, 저장 중인 상태를 정의함
  // true(저장 중), false(일반 대기)
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 저장하기 버튼 클릭 시, 저장 순서를 정의함
  // form(입력폼 확인), image(이미지 파일 업로드), pdf(PDF 파일 업로드), save(완성된 데이터 저장)
  const [saveStep, setSaveStep] = useState<string>('');

  // 메시지 모달을 정의함
  const [openMessageModal, setOpenMessageModal] = useState<IMessageModal>({
    visible: false,
    title: '',
    content: '',
  });

  /**
   * JSON 데이터 읽음
   */

  // 뉴런 분류를 불러옴
  const getNeuronCategory = () => {
    axios
      .get('/json/neuron-category.json')
      .then((response) => {
        let tmpResponse: INeuronCategory[] = response.data;

        if (tmpResponse.length > 0) {
          // 배열을 정렬함
          tmpResponse = _.sortBy(tmpResponse, ['index']);

          // 뉴런 분류를 기억함
          setNeuronCategory(tmpResponse);

          // // 뉴런 분류를 기억함
          // (async () => {
          //   await setNeuronCategoryMutate(tmpResponse);
          // })();
        }
      })
      .catch((error) => {
        console.log('> JSON error: 뉴런 분류를 불러올 수 없습니다.');
        console.log('> JSON error:', error);
      });
  };

  /**
   * DB 데이터 읽음
   */

  // 뉴런 그룹을 불러옴
  const getNeuronGroup = () => {
    axios({
      method: 'GET',
      url: `${config.api.commonUrl.host}:${config.api.commonUrl.port}/neuron/neuron_group`,
      headers: {
        // Authorization: userMutate?.authorization,
      },
      params: {
        // userId: userMutate?.userId,
      },
    })
      .then((response: AxiosResponse<any>) => {
        if (response.headers.authorization !== undefined) {
          // 불러온 데이터를 정의함
          let tmpData: any = response.data.rowData;

          // 뉴런 그룹을 기억함
          setNeuronGroup(JSON.parse(tmpData[0].n_group || '[]'));
        } else {
          // // 경고창을 출력함
          // Dialog.alert({
          //   content: '정보를 불러올 수 없습니다.',
          //   confirmText: '확인',
          //   onConfirm: () => {},
          // });
        }
      })
      .catch((error) => {
        console.log('> axios get neuron group error:', error.response);
      });
  };

  // 뉴런 그룹을 저장함
  const saveNeuronGroup = () => {
    // 뉴런 그룹을 저장함
    axios({
      method: 'PATCH',
      url: `${config.api.commonUrl.host}:${config.api.commonUrl.port}/neuron/neuron_group`,
      headers: {
        // Authorization: userMutate?.authorization || '',
      },
      data: neuronGroup,
    })
      .then((response: AxiosResponse<any>) => {
        if (response.headers.authorization !== undefined) {
        } else {
          console.log('> modify neuron group error');
        }
      })
      .catch((error) => {
        console.log('> axios error:', error.response);
      });
  };

  // 뉴런 데이터를 불러옴
  const getNeuronData = () => {
    // axios
    //   .get('/json/temp-neuron-data.json')
    //   .then((response) => {
    //     let tmpResponse: INeuron[] = response.data;
    //
    //     // 뉴런 데이터를 기억함
    //     setNeurons(tmpResponse);
    //   })
    //   .catch((error) => {
    //     console.log('> Error: 뉴런 데이터를 불러올 수 없습니다.');
    //     console.log('> Error:', error);
    //   });

    // 전체 뉴런을 불러옴
    axios({
      method: 'GET',
      url: `${config.api.commonUrl.host}:${config.api.commonUrl.port}/neuron/neurons`,
      headers: {
        // Authorization: userMutate?.authorization,
      },
      params: {
        // userId: userMutate?.userId,
      },
    })
      .then((response: AxiosResponse<any>) => {
        if (response.headers.authorization !== undefined) {
          // 불러온 데이터를 정의함
          let tmpData: any = response.data.rowData;

          // 임시로 기억할 뉴런 데이터를 정의함
          let tmpNeurons: INeuron[] = [];

          tmpData.map((data: any) => {
            // 뉴런 데이터를 보정함
            tmpNeurons.push({
              id: data.id,
              group: data.group,
              category: data.category,
              subCategory: data.sub_category,
              title: data.title,
              content: data.content,
              date: data.date,
              image: JSON.parse(data.image || '[]'),
              pdf: JSON.parse(data.pdf || '[]'),
              linkUrl: data.link_url,
              sortNoInGroup: data.sort_no_in_group,
            });
          });

          // 뉴런 데이터를 기억함
          setNeurons(tmpNeurons);
        } else {
          // // 경고창을 출력함
          // Dialog.alert({
          //   content: '정보를 불러올 수 없습니다.',
          //   confirmText: '확인',
          //   onConfirm: () => {},
          // });
        }
      })
      .catch((error) => {
        console.log('> axios error:', error.response);
      });
  };

  // 뉴런 목록의 순서를 저장함
  const saveNeuronSort = () => {
    let newSort: { id: number; sortNo: number }[] = [];

    neuronGroup.map((group: INeuronGroup) => {
      neurons
        .filter((filterData: INeuron) => filterData.group === group.id)
        .map((neuron: INeuron, index: number) => {
          newSort.push({
            id: neuron.id,
            sortNo: index + 1,
          });
        });
    });

    console.log(newSort);

    // // 뉴런 그룹을 저장함
    // axios({
    //   method: 'PATCH',
    //   url: `${config.api.commonUrl.host}:${config.api.commonUrl.port}/neuron/neuron_group`,
    //   headers: {
    //     // Authorization: userMutate?.authorization || '',
    //   },
    //   data: neuronGroup,
    // })
    //   .then((response: AxiosResponse<any>) => {
    //     if (response.headers.authorization !== undefined) {
    //     } else {
    //       console.log('> modify neuron group error');
    //     }
    //   })
    //   .catch((error) => {
    //     console.log('> axios error:', error.response);
    //   });
  };

  // 뉴런 그룹에 속하는 뉴런의 개수를 불러옴
  const getNeuronCountInGroup = (group: string): number => {
    return _.filter(neurons, {
      group: group,
    }).length;
  };

  // 뉴런 그룹의 이름을 불러옴
  const getNeuronGroupName = (group: string): string => {
    return (
      _.find(neuronGroup, {
        id: group,
      })?.name || ''
    );
  };

  // 뉴런 분류의 이름을 불러옴
  const getNeuronCategoryName = (category: string): string => {
    return (
      _.find(neuronCategory, {
        category: category,
      })?.name || ''
    );
  };

  // 뉴런 하위 분류의 이름을 불러옴
  const getNeuronSubCategoryName = (
    category: string,
    subCategory: string,
  ): string => {
    let tmpCategory = _.find(neuronCategory, {
      category: category,
    });

    if (tmpCategory === undefined) {
      return '';
    }

    let tmpSubCategory =
      _.find(tmpCategory.subCategory, {
        value: subCategory,
      })?.name || '';

    return tmpSubCategory;
  };

  /**
   * 입력폼 유효성 체크
   */

  // 뉴런 그룹 > 입력폼 유효성을 정의함
  const neuronGroupFormSchema = yup.object().shape({
    name: yup.string().trim().min(1, '그룹 이름을 입력하세요.'),
  });

  // 입력폼 유효성을 정의함
  const formSchema = yup.object().shape({
    content: yup.string().trim().min(1, '내용을 입력하세요.'),
    title: yup.string().trim().min(1, '제목을 입력하세요.'),
    date: yup.string().trim().min(1, '날짜를 입력하세요.'),
    subCategory: yup.string().trim().min(1, '하위 분류를 선택하세요.'),
    category: yup.string().trim().min(1, '분류를 선택하세요.'),
  });

  /**
   * 버튼
   */

  // 뉴런 그룹 > 그룹 추가 버튼을 클릭함
  const handleNeuronGroupAddGroupButton_onClick = () => {
    // 뉴런 그룹 폼의 데이터를 초기화함
    setNeuronGroupForm({
      id: '',
      name: '',
    });
  };

  // 뉴런 그룹 > 그룹 수정 버튼을 클릭함
  const handleNeuronGroupModifyGroupButton_onClick = (data: INeuronGroup) => {
    // 뉴런 그룹 폼의 데이터를 초기화함
    setNeuronGroupForm({
      id: data.id,
      name: data.name,
    });
  };

  // 뉴런 그룹 > 그룹 삭제 버튼을 클릭함
  const handleNeuronGroupRemoveGroupButton_onClick = (data: INeuronGroup) => {
    openConfirmModal({
      title: `${data.name} 그룹을 삭제하시겠습니까?`,
      // children: '',
      labels: { confirm: '확인', cancel: '취소' },
      onCancel: () => {},
      onConfirm: () => {
        let tmpNeuronGroup: INeuronGroup[] = _.cloneDeep(neuronGroup);

        // 지정한 그룹을 제외함
        tmpNeuronGroup = tmpNeuronGroup.filter(
          (filterData: INeuronGroup) => filterData.id !== data.id,
        );

        // 뉴런 그룹에 적용함
        setNeuronGroup(tmpNeuronGroup);

        // 뉴런 그룹 폼의 데이터를 초기화함
        setNeuronGroupForm(null);

        // 선택한 뉴런 그룹을 초기화함
        if (
          selectedNeuronGroup !== null &&
          selectedNeuronGroup.id === data.id
        ) {
          setSelectedNeuronGroup(null);
        }
      },
    });
  };

  // 뉴런 그룹 > 저장하기 버튼을 클릭함
  const handleNeuronGroupSaveButton_onClick = async () => {
    if (neuronGroupForm === null) {
      return;
    }

    // 유효성을 검사함
    if (
      (await neuronGroupFormSchema
        .validate({
          name: neuronGroupForm?.name,
        })
        .catch((error: any) => {
          // 메시지 모달을 출력함
          setOpenMessageModal({
            visible: true,
            title: error.message,
            content: '',
          });
        })) === undefined
    ) {
      return false;
    }

    let tmpNeuronGroup: INeuronGroup[] = _.cloneDeep(neuronGroup);

    if (neuronGroupForm.id === '') {
      tmpNeuronGroup.push({
        id: nanoid(10),
        name: neuronGroupForm.name,
      });
    } else {
      tmpNeuronGroup.map((data: INeuronGroup) => {
        if (data.id === neuronGroupForm.id) {
          data.name = neuronGroupForm.name;
        }
      });
    }

    // 뉴런 그룹에 적용함
    setNeuronGroup(tmpNeuronGroup);

    // 선택한 뉴런 그룹을 수정함
    if (
      selectedNeuronGroup !== null &&
      selectedNeuronGroup.id === neuronGroupForm.id
    ) {
      setSelectedNeuronGroup({
        ...selectedNeuronGroup,
        name: neuronGroupForm.name,
      });
    }

    // 뉴런 그룹 폼의 데이터를 초기화함
    setNeuronGroupForm(null);
  };

  // 뉴런 추가 버튼을 클릭함
  const handleAddNeuron_onClick = () => {
    // 선택한 뉴런 데이터를 초기화함
    setSelectedNeuron({
      id: 0,
      group: selectedNeuronGroup?.id || '',
      category: '',
      subCategory: '',
      title: '',
      content: '',
      date: '',
      image: [],
      pdf: [],
      uploadingImage: [],
      uploadingPdf: [],
      linkUrl: '',
      sortNoInGroup: 0,
    });

    // 파일 입력폼에서 선택한 이미지 파일을 초기화함
    setFileInputImage([]);

    // 파일 입력폼에서 선택한 PDF 파일을 초기화함
    setFileInputPdf([]);
  };

  // 뉴런 편집 > 저장하기 버튼을 클릭함
  const handleSaveNeuron_onClick = () => {
    // 저장 순서를 변경함
    setSaveStep('form');
  };

  // 뉴런 편집 > 삭제하기 버튼을 클릭함
  const handleDeleteNeuron_onClick = () => {
    openConfirmModal({
      title: '삭제하시겠습니까?',
      // children: '',
      labels: { confirm: '확인', cancel: '취소' },
      onCancel: () => {},
      onConfirm: () => {
        // 뉴런을 삭제함
        axios({
          method: 'DELETE',
          url: `${config.api.commonUrl.host}:${config.api.commonUrl.port}/neuron/neuron`,
          headers: {
            // Authorization: userMutate?.authorization || '',
          },
          data: selectedNeuron,
        })
          .then((response: AxiosResponse<any>) => {
            if (response.headers.authorization !== undefined) {
              console.log('> deleted');
              // // 경고창을 출력함
              // Dialog.alert({
              //   content: '삭제하였습니다.',
              //   confirmText: '확인',
              //   onConfirm: () => {},
              // });

              // 뉴런 데이터를 불러옴
              getNeuronData();

              // 선택한 뉴런 데이터를 초기화함
              setSelectedNeuron(null);
            } else {
              console.log('> delete error');
              // // 경고창을 출력함
              // Dialog.alert({
              //   content: '삭제할 수 없습니다.',
              //   confirmText: '확인',
              //   onConfirm: () => {},
              // });
            }
          })
          .catch((error) => {
            console.log('> axios error:', error.response);
          });
      },
    });
  };

  // 뉴런 편집 > 이미지 파일 업로드 입력폼에서 업로드할 이미지 삭제하기 버튼을 클릭함
  const handleFileInputImageDeleteButton_onClick = (data: File) => {
    let tmpFileInputImage: File[] = _.cloneDeep(fileInputImage);

    // 선택한 이미지를 삭제함
    _.remove(tmpFileInputImage, (file) => {
      if (file.name === data.name && file.size === data.size) {
        return true;
      }
    });

    // 파일 입력폼에서 선택한 이미지를 기억함
    setFileInputImage(_.cloneDeep(tmpFileInputImage));
  };

  // 뉴런 편집 > 이미지 파일 업로드 입력폼에서 업로드한 이미지 삭제하기 버튼을 클릭함
  const handleImageDeleteButton_onClick = (data: INeuronFile) => {
    // let tmpFileInputImage: File[] = _.cloneDeep(fileInputImage);

    // // 선택한 이미지를 삭제함
    // _.remove(tmpFileInputImage, (file) => {
    //   if (file.name === data.name && file.size === data.size) {
    //     return true;
    //   }
    // });
    //
    // // 파일 입력폼에서 선택한 이미지를 기억함
    // setFileInputImage(_.cloneDeep(tmpFileInputImage));

    let images: INeuronFile[] = _.cloneDeep(selectedNeuron?.image)!;

    images.map((image: INeuronFile) => {
      if (image.filename === data.filename) {
        image.isDelete = image.isDelete === undefined ? true : !image.isDelete;
      }
    });

    // let file = _.find(selectedNeuron?.image, { filename: data.filename });
    //
    // file = {
    //   ...file!,
    //   isDelete: file?.isDelete === undefined ? true : !file?.isDelete,
    // };
    //
    // console.log(file?.isDelete);

    setSelectedNeuron({
      ...selectedNeuron!,
      image: _.cloneDeep(images),
    });
  };

  // 뉴런 편집 > PDF 파일 업로드 입력폼에서 업로드할 PDF 삭제하기 버튼을 클릭함
  const handleFileInputPdfDeleteButton_onClick = (data: File) => {
    let tmpFileInputPdf: File[] = _.cloneDeep(fileInputPdf);

    // 선택한 PDF를 삭제함
    _.remove(tmpFileInputPdf, (file) => {
      if (file.name === data.name && file.size === data.size) {
        return true;
      }
    });

    // 파일 입력폼에서 선택한 이미지를 기억함
    setFileInputPdf(_.cloneDeep(tmpFileInputPdf));
  };

  // 뉴런 편집 > PDF 파일 업로드 입력폼에서 업로드한 PDF 삭제하기 버튼을 클릭함
  const handlePdfDeleteButton_onClick = (data: INeuronFile) => {
    let pdfs: INeuronFile[] = _.cloneDeep(selectedNeuron?.pdf)!;

    pdfs.map((pdf: INeuronFile) => {
      if (pdf.filename === data.filename) {
        pdf.isDelete = pdf.isDelete === undefined ? true : !pdf.isDelete;
      }
    });

    setSelectedNeuron({
      ...selectedNeuron!,
      pdf: _.cloneDeep(pdfs),
    });
  };

  /**
   * 테이블
   */

  // 테이블의 행을 클릭함
  const handleNeuronTableRow_onClick = (data: INeuron) => {
    // 선택한 뉴런 데이터를 기억함
    setSelectedNeuron({ ...data, uploadingImage: [], uploadingPdf: [] });

    // 파일 입력폼에서 선택한 이미지 파일을 초기화함
    setFileInputImage([]);

    // 파일 입력폼에서 선택한 PDF 파일을 초기화함
    setFileInputPdf([]);
  };

  useEffect(() => {}, []);

  // 환경 설정이 변경될 때 실행함
  useEffect(() => {
    if (config.api.commonUrl.host === '') {
      return;
    }

    // 뉴런 그룹을 불러옴
    getNeuronGroup();

    // 뉴런 분류를 불러옴
    getNeuronCategory();

    // 뉴런 데이터를 불러옴
    getNeuronData();
  }, [config.api.commonUrl.host]);

  useEffect(() => {
    // console.log('>>>>>>>>', selectedNeuron);
  }, [selectedNeuron]);

  // 뉴런 데이터가 변경될 때, 정렬용 뉴런 데이터도 갱신함
  useEffect(() => {
    let tmpNeurons: ISortNeuron[] = [];

    neurons.map((neuron: INeuron) => {
      tmpNeurons.push({
        id: neuron.id.toString(),
        name: neuron.title,
      });
    });

    // 정렬용 뉴런 데이터를 기억함
    setSortNeurons(_.cloneDeep(tmpNeurons));
  }, [neurons]);

  // 저장하기 버튼 클릭 시, 저장 순서가 변경될 때 실행함
  useEffect(() => {
    if (saveStep === '') {
      return;
    }

    switch (saveStep) {
      // 입력폼 확인
      case 'form':
        // 저장하기 버튼 클릭 시, 저장 중인 상태로 변경함
        setIsSaving(true);

        openConfirmModal({
          title: '저장하시겠습니까?',
          // children: '',
          labels: { confirm: '확인', cancel: '취소' },
          closeOnClickOutside: false,
          onCancel: () => {
            // 저장하기 버튼 클릭 시, 저장 대기 중 상태로 변경함
            setIsSaving(false);

            // 저장 순서를 초기화함
            setSaveStep('');
          },
          onConfirm: async () => {
            // 유효성을 검사함
            if (
              (await formSchema
                .validate({
                  content: selectedNeuron?.content,
                  title: selectedNeuron?.title,
                  date: selectedNeuron?.date,
                  subCategory: selectedNeuron?.subCategory,
                  category: selectedNeuron?.category,
                })
                .catch((error: any) => {
                  // 메시지 모달을 출력함
                  setOpenMessageModal({
                    visible: true,
                    title: error.message,
                    content: '',
                  });

                  // // 경고창을 출력함
                  // Dialog.alert({
                  //   content: error.message,
                  //   confirmText: '확인',
                  //   onConfirm: () => {
                  //     // 포커스를 적용함
                  //     document
                  //       .querySelector<HTMLInputElement>(`#${error.path}`)
                  //       ?.focus();
                  //   },
                  // });
                })) === undefined
            ) {
              return false;
            }

            // 저장 순서를 변경함
            setSaveStep('image');
          },
        });
        break;

      // 이미지 파일 업로드
      case 'image':
        // 업로드할 이미지 파일이 있을 때만 실행함
        if (fileInputImage.length > 0) {
          // 이미지 파일 업로드 주소를 생성함
          let imageUrl: string = urlJoin(
            `${config.upload.imageUrl.host}:${config.upload.imageUrl.port}`,
            config.upload.imageUrl.path,
          );

          // 업로드할 파일의 폼 데이터를 정의함
          const formData: FormData = new FormData();

          // 업로드할 파일의 폼 데이터에 파일을 추가함
          fileInputImage.map((file: File) => {
            formData.append('image', file);
          });

          // 파일을 업로드함
          axios
            .post(imageUrl, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              // cancelToken: uploadFileCancelTokenRef.current.token,
              onUploadProgress: (event: any) => {
                // // 현재 업로드 중인 파일의 진행율을 계산함
                // let tmpCurrentProgress = Math.round(
                //   (event.loaded * 100) / event.total,
                // );
              },
            })
            .then((response: AxiosResponse) => {
              // console.log('> upload result:', response.data.saveFile);

              let tmpUploadingFile: INeuronFile[] = [];

              // 업로드한 파일의 정보를 보정함
              response.data.saveFile.map((data: any) => {
                tmpUploadingFile.push({
                  fieldname: data.fieldname,
                  filename: data.filename,
                  mimetype: data.mimetype,
                  originalname: data.originalname,
                  size: data.size,
                });
              });

              // 선택한 뉴런 데이터에 업로드한 이미지 파일 결과를 적용함
              setSelectedNeuron({
                ...selectedNeuron!,
                uploadingImage: _.cloneDeep(tmpUploadingFile),
              });

              // 저장 순서를 변경함
              setSaveStep('pdf');
            })
            .catch((error: any) => {
              switch (error.message) {
                case 'upload-cancel':
                  console.log('> 업로드 취소');
                  break;

                default:
                  console.log('> 업로드 오류:', error.response);
                  break;
              }

              // 저장하기 버튼 클릭 시, 저장 대기 중 상태로 변경함
              setIsSaving(false);
            });
        } else {
          // 저장 순서를 변경함
          setSaveStep('pdf');
        }
        break;

      // PDF 파일 업로드
      case 'pdf':
        // 업로드할 PDF 파일이 있을 때만 실행함
        if (fileInputPdf.length > 0) {
          // PDF 파일 업로드 주소를 생성함
          let pdfUrl: string = urlJoin(
            `${config.upload.pdfUrl.host}:${config.upload.pdfUrl.port}`,
            config.upload.pdfUrl.path,
          );

          // 업로드할 파일의 폼 데이터를 정의함
          const formData: FormData = new FormData();

          // 업로드할 파일의 폼 데이터에 파일을 추가함
          fileInputPdf.map((file: File) => {
            formData.append('pdf', file);
          });

          // 파일을 업로드함
          axios
            .post(pdfUrl, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              // cancelToken: uploadFileCancelTokenRef.current.token,
              onUploadProgress: (event: any) => {
                // // 현재 업로드 중인 파일의 진행율을 계산함
                // let tmpCurrentProgress = Math.round(
                //   (event.loaded * 100) / event.total,
                // );
              },
            })
            .then((response: AxiosResponse) => {
              // console.log('> upload result:', response.data.saveFile);

              let tmpUploadingFile: INeuronFile[] = [];

              // 업로드한 파일의 정보를 보정함
              response.data.saveFile.map((data: any) => {
                tmpUploadingFile.push({
                  fieldname: data.fieldname,
                  filename: data.filename,
                  mimetype: data.mimetype,
                  originalname: data.originalname,
                  size: data.size,
                });
              });

              // 선택한 뉴런 데이터에 업로드한 이미지 파일 결과를 적용함
              setSelectedNeuron({
                ...selectedNeuron!,
                uploadingPdf: _.cloneDeep(tmpUploadingFile),
              });

              // 저장 순서를 변경함
              setSaveStep('save');
            })
            .catch((error: any) => {
              switch (error.message) {
                case 'upload-cancel':
                  console.log('> 업로드 취소');
                  break;

                default:
                  console.log('> 업로드 오류:', error.response);
                  break;
              }

              // 저장하기 버튼 클릭 시, 저장 대기 중 상태로 변경함
              setIsSaving(false);
            });
        } else {
          // 저장 순서를 변경함
          setSaveStep('save');
        }
        break;

      // 완성된 데이터 저장
      case 'save':
        console.log('> save ok');

        console.log(selectedNeuron);

        // openConfirmModal({
        //   title: '저장하시겠습니까?',
        //   // children: '',
        //   labels: { confirm: '확인', cancel: '취소' },
        //   closeOnClickOutside: false,
        //   onCancel: () => {
        //     // 저장하기 버튼 클릭 시, 저장 대기 중 상태로 변경함
        //     setIsSaving(false);
        //   },
        //   onConfirm: () => {
        if (selectedNeuron?.id === 0) {
          // 뉴런을 추가함
          axios({
            method: 'POST',
            url: `${config.api.commonUrl.host}:${config.api.commonUrl.port}/neuron/neuron`,
            headers: {
              // Authorization: userMutate?.authorization || '',
            },
            data: selectedNeuron,
          })
            .then((response: AxiosResponse<any>) => {
              if (response.headers.authorization !== undefined) {
                // console.log('> add saved');
                // // 경고창을 출력함
                // Dialog.alert({
                //   content: '저장하였습니다.',
                //   confirmText: '확인',
                //   onConfirm: () => {},
                // });

                // 뉴런 데이터를 불러옴
                getNeuronData();

                // 선택한 뉴런 데이터를 초기화함
                setSelectedNeuron(null);
              } else {
                console.log('> add error');
                // // 경고창을 출력함
                // Dialog.alert({
                //   content: '사용자 정보를 수정할 수 없습니다.',
                //   confirmText: '확인',
                //   onConfirm: () => {},
                // });
              }
            })
            .catch((error) => {
              console.log('> axios error:', error.response);
            });
        } else {
          // 뉴런을 수정함
          axios({
            method: 'PATCH',
            url: `${config.api.commonUrl.host}:${config.api.commonUrl.port}/neuron/neuron`,
            headers: {
              // Authorization: userMutate?.authorization || '',
            },
            data: selectedNeuron,
          })
            .then((response: AxiosResponse<any>) => {
              if (response.headers.authorization !== undefined) {
                // console.log('> modify saved');
                // // 경고창을 출력함
                // Dialog.alert({
                //   content: '저장하였습니다.',
                //   confirmText: '확인',
                //   onConfirm: () => {},
                // });

                // 뉴런 데이터를 불러옴
                getNeuronData();

                // 선택한 뉴런 데이터를 초기화함
                setSelectedNeuron(null);
              } else {
                console.log('> modify error');
                // // 경고창을 출력함
                // Dialog.alert({
                //   content: '사용자 정보를 수정할 수 없습니다.',
                //   confirmText: '확인',
                //   onConfirm: () => {},
                // });
              }
            })
            .catch((error) => {
              console.log('> axios error:', error.response);
            });
        }

        // 저장하기 버튼 클릭 시, 저장 대기 중 상태로 변경함
        setIsSaving(false);
        //   },
        // });

        // 저장 순서를 초기화함
        setSaveStep('');
        break;

      default:
        break;
    }
  }, [saveStep]);

  return (
    <>
      {/* 페이지 */}
      <div className="space-y-5">
        <div className="flex justify-center items-start space-x-6">
          {/* 뉴런 그룹 */}
          <div className="flex-none w-64 select-none">
            {/* 제목 */}
            <div className="py-1 flex justify-center items-center bg-gray-100 space-x-2 rounded">
              <span className="text-xs font-bold text-gray-800">뉴런 그룹</span>
            </div>

            {/* 버튼 */}
            <div className="px-2 py-2 flex justify-between items-center border-b border-gray-200 space-x-2">
              {/* 편집 모드 스위치 */}
              <Switch
                onChange={() => {
                  // 편집 모드를 종료할 때 뉴런 그룹을 저장함
                  if (isNeuronGroupEditMode) {
                    // 뉴런 그룹을 저장함
                    saveNeuronGroup();
                  }

                  setIsNeuronGroupEditMode(!isNeuronGroupEditMode);
                }}
                label={
                  <span className="text-sm font-semibold text-gray-800">
                    편집 모드
                  </span>
                }
              />

              {/* 그룹 추가 버튼 */}
              <Popover
                width={350}
                trapFocus
                position="right"
                withArrow
                closeOnClickOutside={false}
                shadow="md"
                onOpen={handleNeuronGroupAddGroupButton_onClick}
                onClose={() => setNeuronGroupForm(null)}
                opened={neuronGroupForm !== null && neuronGroupForm.id === ''}
              >
                <Popover.Target>
                  <Button
                    leftIcon={
                      <FontAwesomeIcon
                        icon={['fas', 'plus']}
                        className="w-3.5 h-3.5"
                      />
                    }
                    size="xs"
                    disabled={!isNeuronGroupEditMode}
                    onClick={handleNeuronGroupAddGroupButton_onClick}
                  >
                    그룹 추가
                  </Button>
                </Popover.Target>

                <Popover.Dropdown>
                  <div className="relative w-full mb-1 px-1 space-y-4">
                    {/* 그룹 이름 */}
                    <div>
                      <TextInput
                        placeholder="그룹 이름을 입력하세요."
                        label="그룹 이름"
                        size="xs"
                        withAsterisk={true}
                        onChange={(event) => {
                          setNeuronGroupForm({
                            ...neuronGroupForm!,
                            name: event.currentTarget.value,
                          });
                        }}
                        defaultValue={neuronGroupForm?.name}
                      />
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-between items-center">
                      <div className="flex justify-center items-center space-x-2">
                        {/* 닫기 버튼 */}
                        <Button
                          onClick={() => setNeuronGroupForm(null)}
                          size="xs"
                          color="dark"
                        >
                          닫기
                        </Button>
                      </div>

                      <div className="flex justify-center items-center space-x-2">
                        {/* 저장하기 버튼 */}
                        <Button
                          onClick={handleNeuronGroupSaveButton_onClick}
                          leftIcon={
                            <FontAwesomeIcon
                              icon={['fas', 'check']}
                              className="w-3.5 h-3.5"
                            />
                          }
                          size="xs"
                        >
                          저장하기
                        </Button>
                      </div>
                    </div>
                  </div>
                </Popover.Dropdown>
              </Popover>
            </div>

            {/* 뉴런 그룹 목록 */}
            <ReactSortable
              group="neuronGroup"
              list={neuronGroup}
              setList={setNeuronGroup}
              handle=".drag-handle"
              animation={300}
              delayOnTouchOnly={true}
              delay={100}
              disabled={!isNeuronGroupEditMode}
              // className="space-y-1"
            >
              {neuronGroup.map((group: INeuronGroup) => (
                <div
                  key={group.id}
                  className="px-2 py-2 flex justify-between items-center bg-white border-b border-gray-200 hover:bg-indigo-100/20"
                >
                  {/* 드래그 핸들 */}
                  <motion.div
                    animate={isNeuronGroupEditMode ? 'open' : 'close'}
                    variants={{
                      open: { opacity: 1, x: 0, display: 'block' },
                      close: {
                        opacity: 0,
                        x: -50,
                        transitionEnd: { display: 'none' },
                      },
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 700,
                      damping: 30,
                    }}
                  >
                    <div className="drag-handle flex-none pr-3 flex justify-center items-center cursor-move">
                      <FontAwesomeIcon
                        icon={['fas', 'grip-lines']}
                        className="w-4 h-4 text-gray-400"
                      />
                    </div>
                  </motion.div>

                  {/* 그룹 이름 */}
                  <div
                    onClick={() =>
                      !isNeuronGroupEditMode && setSelectedNeuronGroup(group)
                    }
                    className={`grow truncate overflow-hidden ${
                      !isNeuronGroupEditMode && 'cursor-pointer'
                    }`}
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      {group.name}
                    </span>
                  </div>

                  {/* 그룹에 속한 뉴런 개수 */}
                  <div className="flex-none pl-1 flex justify-center items-center">
                    <Badge
                      size="sm"
                      variant="gradient"
                      gradient={{ from: '#f3649f', to: '#c081f4', deg: 35 }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {getNeuronCountInGroup(group.id)}
                      </span>
                    </Badge>
                  </div>

                  {/* 버튼 */}
                  <motion.div
                    animate={isNeuronGroupEditMode ? 'open' : 'close'}
                    variants={{
                      open: { opacity: 1, x: 0, display: 'block' },
                      close: {
                        opacity: 0,
                        x: 50,
                        transitionEnd: { display: 'none' },
                      },
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 700,
                      damping: 30,
                    }}
                  >
                    <div className="flex-none pl-2 flex justify-center items-center space-x-2">
                      {/* 그룹 편집 버튼 */}
                      {/*<div className="button-event flex justify-center items-center cursor-pointer">*/}
                      {/*  <FontAwesomeIcon*/}
                      {/*    icon={['fas', 'ellipsis']}*/}
                      {/*    className="w-3.5 h-3.5 text-gray-400"*/}
                      {/*  />*/}
                      {/*</div>*/}

                      <Popover
                        width={350}
                        trapFocus
                        position="right"
                        withArrow
                        closeOnClickOutside={false}
                        shadow="md"
                        onOpen={handleNeuronGroupAddGroupButton_onClick}
                        onClose={() => setNeuronGroupForm(null)}
                        opened={
                          neuronGroupForm !== null &&
                          neuronGroupForm.id === group.id
                        }
                      >
                        <Popover.Target>
                          <div
                            onClick={() =>
                              handleNeuronGroupModifyGroupButton_onClick(group)
                            }
                            className="button-event flex justify-center items-center cursor-pointer"
                          >
                            <FontAwesomeIcon
                              icon={['fas', 'ellipsis']}
                              className="w-3.5 h-3.5 text-gray-400"
                            />
                          </div>
                        </Popover.Target>

                        <Popover.Dropdown>
                          <div className="relative w-full mb-1 px-1 space-y-4">
                            {/* 그룹 이름 */}
                            <div>
                              <TextInput
                                placeholder="그룹 이름을 입력하세요."
                                label="그룹 이름"
                                size="xs"
                                withAsterisk={true}
                                onChange={(event) => {
                                  setNeuronGroupForm({
                                    ...neuronGroupForm!,
                                    name: event.currentTarget.value,
                                  });
                                }}
                                defaultValue={neuronGroupForm?.name}
                              />
                            </div>

                            {/* 버튼 */}
                            <div className="flex justify-between items-center">
                              <div className="flex justify-center items-center space-x-2">
                                {/* 닫기 버튼 */}
                                <Button
                                  onClick={() => setNeuronGroupForm(null)}
                                  size="xs"
                                  color="dark"
                                >
                                  닫기
                                </Button>
                              </div>

                              <div className="flex justify-center items-center space-x-2">
                                {/* 삭제하기 버튼 */}
                                <Button
                                  onClick={() =>
                                    handleNeuronGroupRemoveGroupButton_onClick(
                                      group,
                                    )
                                  }
                                  leftIcon={
                                    <FontAwesomeIcon
                                      icon={['fas', 'xmark']}
                                      className="w-3.5 h-3.5"
                                    />
                                  }
                                  size="xs"
                                  variant="outline"
                                  color="red"
                                >
                                  삭제하기
                                </Button>

                                {/* 저장하기 버튼 */}
                                <Button
                                  onClick={handleNeuronGroupSaveButton_onClick}
                                  leftIcon={
                                    <FontAwesomeIcon
                                      icon={['fas', 'check']}
                                      className="w-3.5 h-3.5"
                                    />
                                  }
                                  size="xs"
                                >
                                  저장하기
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Popover.Dropdown>
                      </Popover>
                    </div>
                  </motion.div>
                </div>
              ))}
            </ReactSortable>

            {/* 참고 메시지 */}
            <div className="px-2 py-2 flex justify-start items-center space-x-2">
              <div>
                <FontAwesomeIcon
                  icon={['fas', 'volume-low']}
                  className="w-4 h-4 text-amber-600"
                />
              </div>

              <span className="text-xs font-bold text-gray-600">
                편집하신 후, 편집 모드를 해제해야만 시스템에 반영됩니다.
              </span>
            </div>
          </div>

          {/* 뉴런 */}
          <div className="grow select-none">
            {/* 제목 */}
            <div className="py-1 flex justify-center items-center bg-gray-100 space-x-2 rounded">
              {selectedNeuronGroup === null && (
                <span className="text-xs font-bold text-gray-800 animate-pulse">
                  왼쪽 뉴런 그룹 목록에서 그룹을 선택하세요.
                </span>
              )}
              {selectedNeuronGroup !== null && (
                <span className="text-xs font-bold text-gray-800">
                  {selectedNeuronGroup.name}의 뉴런
                </span>
              )}
            </div>

            {/* 버튼 */}
            <div className="px-2 py-2 flex justify-between items-center border-b border-gray-200 space-x-2 rounded">
              {/* 편집 모드 스위치 */}
              <Switch
                onChange={() => {
                  // 편집 모드를 종료할 때 뉴런 목록의 순서를 저장함
                  if (isNeuronEditMode) {
                    // 뉴런 목록의 순서를 저장함
                    saveNeuronSort();
                  }

                  setIsNeuronEditMode(!isNeuronEditMode);
                }}
                label={
                  <span className="text-sm font-semibold text-gray-800">
                    편집 모드
                  </span>
                }
              />

              {/* 뉴런 추가 버튼 */}
              <Button
                onClick={handleAddNeuron_onClick}
                leftIcon={
                  <FontAwesomeIcon
                    icon={['fas', 'plus']}
                    className="w-3.5 h-3.5"
                  />
                }
                size="xs"
                disabled={selectedNeuronGroup === null || !isNeuronEditMode}
              >
                뉴런 추가
              </Button>
            </div>

            {/* 뉴런 목록 헤더 */}
            <div className="px-2 py-2 flex justify-between items-center bg-white border-b border-gray-200 space-x-1">
              <motion.div
                animate={isNeuronEditMode ? 'open' : 'close'}
                variants={{
                  open: { opacity: 1, x: 0, display: 'block' },
                  close: {
                    opacity: 0,
                    x: -50,
                    transitionEnd: { display: 'none' },
                  },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 700,
                  damping: 30,
                }}
              >
                <div className="flex-none w-8"></div>
              </motion.div>
              <div className="flex-none w-20">
                <span className="text-xs font-bold text-black">그룹</span>
              </div>
              <div className="flex-none w-20">
                <span className="text-xs font-bold text-black">분류</span>
              </div>
              <div className="flex-none w-20">
                <span className="text-xs font-bold text-black">하위분류</span>
              </div>
              <div className="grow">
                <span className="text-xs font-bold text-black">제목</span>
              </div>
              <div className="flex-none w-14">
                <span className="text-xs font-bold text-black">이미지</span>
              </div>
              <div className="flex-none w-10">
                <span className="text-xs font-bold text-black">PDF</span>
              </div>
              <div className="flex-none w-20">
                <span className="text-xs font-bold text-black">일자</span>
              </div>
            </div>

            {/* 뉴런 목록 */}
            <ReactSortable
              group="neuron"
              list={neurons}
              setList={(newState) => {
                setNeurons(newState);
                console.log(newState);
              }}
              handle=".drag-handle"
              animation={300}
              delayOnTouchOnly={true}
              delay={100}
              disabled={!isNeuronEditMode}
              // onChange={() => console.log(neurons)}
            >
              {neurons
                .filter(
                  (filterData: INeuron) =>
                    filterData.group === selectedNeuronGroup?.id,
                )
                .map((data: INeuron) => (
                  <div
                    key={data.id}
                    onClick={() =>
                      !isNeuronEditMode && handleNeuronTableRow_onClick(data)
                    }
                    className={`px-2 py-2 flex justify-between items-center bg-white border-b border-gray-200 hover:bg-indigo-100/20 space-x-1 ${
                      !isNeuronEditMode && 'cursor-pointer'
                    }`}
                  >
                    {/* 드래그 핸들 */}
                    <motion.div
                      animate={isNeuronEditMode ? 'open' : 'close'}
                      variants={{
                        open: { opacity: 1, x: 0, display: 'block' },
                        close: {
                          opacity: 0,
                          x: -50,
                          transitionEnd: { display: 'none' },
                        },
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 700,
                        damping: 30,
                      }}
                    >
                      <div className="drag-handle flex-none w-8 flex justify-start items-center cursor-move">
                        <FontAwesomeIcon
                          icon={['fas', 'grip-lines']}
                          className="w-4 h-4 text-gray-400"
                        />
                      </div>
                    </motion.div>

                    {/* 그룹 */}
                    <div className="flex-none w-20 whitespace-normal">
                      <span className="text-xs font-normal text-gray-800">
                        {getNeuronGroupName(data.group)}
                      </span>
                    </div>

                    {/* 분류 */}
                    <div className="flex-none w-20 whitespace-normal">
                      <span className="text-xs font-normal text-gray-800">
                        {getNeuronCategoryName(data.category)}
                      </span>
                    </div>

                    {/* 하위분류 */}
                    <div className="flex-none w-20 whitespace-normal">
                      <span className="text-xs font-normal text-gray-800">
                        {getNeuronSubCategoryName(
                          data.category,
                          data.subCategory,
                        )}
                      </span>
                    </div>

                    {/* 제목 */}
                    <div className="grow truncate overflow-hidden whitespace-normal">
                      <span className="text-xs font-normal text-gray-800">
                        {data.title}
                      </span>
                    </div>

                    {/* 이미지 */}
                    <div className="flex-none w-14">
                      {data.image && data.image.length > 0 && (
                        <FontAwesomeIcon
                          icon={['fas', 'check']}
                          className="w-3 h-3 text-lime-600"
                        />
                      )}
                    </div>

                    {/* PDF */}
                    <div className="flex-none w-10">
                      {data.pdf && data.pdf.length > 0 && (
                        <FontAwesomeIcon
                          icon={['fas', 'check']}
                          className="w-3 h-3 text-lime-600"
                        />
                      )}
                    </div>

                    {/* 일자 */}
                    <div className="flex-none w-20">
                      <span className="text-xs font-normal text-gray-800">
                        {data.date}
                      </span>
                    </div>
                  </div>
                ))}
            </ReactSortable>

            {/* 참고 메시지 */}
            <div className="px-2 py-2 flex justify-start items-center space-x-2">
              <div>
                <FontAwesomeIcon
                  icon={['fas', 'volume-low']}
                  className="w-4 h-4 text-amber-600"
                />
              </div>

              <span className="text-xs font-bold text-gray-600">
                목록의 순서를 변경하신 후, 편집 모드를 해제해야만 시스템에
                반영됩니다.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 모달 */}
      <Modal
        opened={openMessageModal.visible}
        onClose={() =>
          setOpenMessageModal({ ...openMessageModal, visible: false })
        }
        withCloseButton={false}
        title={
          <span className="text-sm font-bold text-gray-800">
            {openMessageModal.title}
          </span>
        }
        zIndex={30}
      >
        <div className="space-y-2">
          {openMessageModal.content && (
            <div>
              <span className="text-sm font-medium text-gray-600">
                {openMessageModal.content}
              </span>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end items-center">
            <Button
              onClick={() =>
                setOpenMessageModal({ ...openMessageModal, visible: false })
              }
              size="sm"
            >
              확인
            </Button>
          </div>
        </div>
      </Modal>

      {/* 뉴런 편집 레이어 */}
      <Drawer
        opened={selectedNeuron !== null}
        onClose={() => setSelectedNeuron(null)}
        title={
          <span className="text-2xl font-bold text-sky-800">
            {selectedNeuron?.id === 0 ? '뉴런 추가' : '뉴런 수정'}
          </span>
        }
        padding="md"
        size="xl"
        position="right"
        trapFocus={false}
        className="overflow-y-auto"
        zIndex={20}
      >
        <div className="w-full mb-7 px-1 space-y-4">
          {/* 그룹 */}
          <div>
            <Select
              label="그룹"
              placeholder="그룹을 선택하세요."
              size="xs"
              withAsterisk={true}
              data={neuronGroup.map((data: INeuronGroup) => ({
                value: data.id.toString(),
                label: data.name,
              }))}
              onChange={(event) => {
                setSelectedNeuron({
                  ...selectedNeuron!,
                  group: event || '',
                });
              }}
              value={selectedNeuron?.group}
            />
          </div>

          {/* 분류 */}
          <div>
            <Select
              label="분류"
              placeholder="분류를 선택하세요."
              size="xs"
              withAsterisk={true}
              data={neuronCategory.map((data: INeuronCategory) => ({
                value: data.category,
                label: data.name,
              }))}
              onChange={(event) => {
                setSelectedNeuron({
                  ...selectedNeuron!,
                  category: event || '',
                  subCategory: '',
                });
              }}
              value={selectedNeuron?.category}
            />
          </div>

          {/* 하위 분류 */}
          <div>
            <Select
              label="하위 분류"
              placeholder="하위 분류를 선택하세요."
              size="xs"
              withAsterisk={true}
              data={(
                _.find(neuronCategory, {
                  category: selectedNeuron?.category,
                }) || { subCategory: [] }
              ).subCategory.map((data: any) => ({
                value: data.value,
                label: data.name,
              }))}
              onChange={(event) => {
                setSelectedNeuron({
                  ...selectedNeuron!,
                  subCategory: event || '',
                });
              }}
              value={selectedNeuron?.subCategory}
            />
          </div>

          {/* 날짜 */}
          <div>
            <DatePicker
              placeholder="날짜를 선택하세요."
              label="날짜"
              locale="ko"
              firstDayOfWeek="sunday"
              inputFormat="YYYY년 MM월 DD일"
              labelFormat="YYYY년 MM월 DD일"
              size="xs"
              withAsterisk={true}
              onChange={(event) => {
                if (event !== null) {
                  setSelectedNeuron({
                    ...selectedNeuron!,
                    date: dateFormat(event, 'yyyy.mm.dd'),
                  });
                }
              }}
              value={
                selectedNeuron?.date === ''
                  ? null
                  : new Date((selectedNeuron?.date || '').replace(/\./gi, '-'))
              }
            />
          </div>

          {/* 제목 */}
          <div>
            <TextInput
              placeholder="제목을 입력하세요."
              label="제목"
              size="xs"
              withAsterisk={true}
              onChange={(event) => {
                setSelectedNeuron({
                  ...selectedNeuron!,
                  title: event.currentTarget.value,
                });
              }}
              defaultValue={selectedNeuron?.title}
            />
          </div>

          {/* 내용 */}
          <div>
            <Textarea
              placeholder="내용을 입력하세요."
              label="내용"
              size="xs"
              minRows={3}
              maxRows={10}
              autosize={true}
              withAsterisk={true}
              onChange={(event) => {
                setSelectedNeuron({
                  ...selectedNeuron!,
                  content: event.currentTarget.value,
                });
              }}
              defaultValue={selectedNeuron?.content}
            />
          </div>

          {/* 이미지 파일 */}
          <div className="space-y-1">
            <FileInput
              placeholder="이미지 파일을 선택하세요."
              label="이미지 파일 업로드"
              size="xs"
              accept="image/png,image/jpeg,image/gif"
              multiple={true}
              onChange={(event) => {
                setFileInputImage(event);
              }}
              value={fileInputImage}
            />

            {/* 업로드할 이미지 파일 */}
            <motion.div
              animate={fileInputImage.length !== 0 ? 'open' : 'close'}
              variants={{
                open: { opacity: 1, y: 0, display: 'block' },
                close: {
                  opacity: 0,
                  y: -50,
                  transitionEnd: { display: 'none' },
                },
              }}
              transition={{
                type: 'spring',
                stiffness: 700,
                damping: 30,
              }}
            >
              <div className="p-3 bg-gray-100 rounded">
                {/* 썸네일 이미지 */}
                <div className="flex justify-start items-center space-x-2 select-none">
                  {fileInputImage.map((file: File, index: number) => {
                    const imageUrl = URL.createObjectURL(file);

                    return (
                      <div
                        key={index}
                        className="relative w-16 h-16 p-px flex justify-center items-center bg-white border border-gray-300 hover:border-black outline outline-1 outline-white overflow-hidden"
                      >
                        <img
                          src={imageUrl}
                          alt={imageUrl}
                          className="w-full h-full object-contain"
                        />

                        {/* 이미지 삭제 버튼 */}
                        <div
                          key={index}
                          onClick={() =>
                            handleFileInputImageDeleteButton_onClick(file)
                          }
                          className="button-event absolute right-0.5 top-0.5 p-0.5 flex justify-center items-center bg-black rounded-full"
                        >
                          <FontAwesomeIcon
                            icon={['fas', 'xmark']}
                            className="w-3 h-3 text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* 업로드한 이미지 파일 */}
          {selectedNeuron?.image?.length !== 0 && (
            <div>
              {/* 항목의 제목 */}
              <div className="flex justify-start items-center">
                <span className="text-xs text-black">업로드한 이미지 파일</span>
              </div>

              {/* 썸네일 이미지 */}
              <div className="flex justify-start items-center space-x-2 select-none">
                {selectedNeuron?.image?.map(
                  (file: INeuronFile, index: number) => {
                    // const imageUrl = URL.createObjectURL(file);

                    return (
                      <div
                        key={index}
                        className="relative w-16 h-16 p-px flex justify-center items-center border border-gray-300 hover:border-black overflow-hidden"
                      >
                        <img
                          src={urlJoin(
                            `${config.resource.imageUrl.host}:${config.resource.imageUrl.port}`,
                            'resource',
                            'image',
                            file.filename,
                          )}
                          alt={file.originalname}
                          className="w-full h-full object-contain"
                        />

                        {/* 이미지 삭제 버튼 */}
                        {!(file.isDelete || false) && (
                          <div
                            key={index}
                            onClick={() =>
                              handleImageDeleteButton_onClick(file)
                            }
                            className="button-event absolute right-0.5 top-0.5 p-0.5 flex justify-center items-center bg-black rounded-full"
                          >
                            <FontAwesomeIcon
                              icon={['fas', 'xmark']}
                              className="w-3 h-3 text-white"
                            />
                          </div>
                        )}
                        {/* 이미지 삭제 취소 버튼 */}
                        {(file.isDelete || false) && (
                          <>
                            <div
                              key={index}
                              onClick={() =>
                                handleImageDeleteButton_onClick(file)
                              }
                              className="button-event absolute right-0.5 top-0.5 p-0.5 flex justify-center items-center bg-rose-700 rounded-full"
                            >
                              <FontAwesomeIcon
                                icon={['fas', 'arrow-left']}
                                className="w-3 h-3 text-white"
                              />
                            </div>

                            <div className="button-event absolute left-0 bottom-0 py-px w-full flex justify-center items-center bg-rose-700 border border-white">
                              <span className="text-xs font-bold text-white">
                                삭제 대기
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* PDF 파일 */}
          <div className="space-y-1">
            <FileInput
              placeholder="PDF 파일을 선택하세요."
              label="PDF 파일 업로드"
              size="xs"
              accept="application/pdf"
              multiple={true}
              onChange={(event) => {
                setFileInputPdf(event);
              }}
              value={fileInputPdf}
            />

            {/* 업로드할 PDF 파일 */}
            <motion.div
              animate={fileInputPdf.length !== 0 ? 'open' : 'close'}
              variants={{
                open: { opacity: 1, y: 0, display: 'block' },
                close: {
                  opacity: 0,
                  y: -50,
                  transitionEnd: { display: 'none' },
                },
              }}
              transition={{
                type: 'spring',
                stiffness: 700,
                damping: 30,
              }}
            >
              <div className="p-3 bg-gray-100 rounded">
                {/* 썸네일 PDF */}
                <div className="space-y-1 select-none">
                  {fileInputPdf.map((file: File, index: number) => {
                    // const pdfUrl = URL.createObjectURL(file);

                    return (
                      <div
                        key={index}
                        className="relative w-full p-px flex justify-center items-center bg-white border border-gray-300 hover:border-black outline outline-1 outline-white overflow-hidden"
                      >
                        <div className="px-3 py-1 w-full h-full truncate overflow-hidden">
                          <span className="text-xs font-bold">{file.name}</span>
                        </div>

                        {/* PDF 삭제 버튼 */}
                        <div
                          key={index}
                          onClick={() =>
                            handleFileInputPdfDeleteButton_onClick(file)
                          }
                          className="button-event absolute right-0.5 top-0.5 p-0.5 flex justify-center items-center bg-black rounded-full"
                        >
                          <FontAwesomeIcon
                            icon={['fas', 'xmark']}
                            className="w-3 h-3 text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* 업로드한 PDF 파일 */}
          {selectedNeuron?.pdf?.length !== 0 && (
            <div>
              {/* 항목의 제목 */}
              <div className="flex justify-start items-center">
                <span className="text-xs text-black">업로드한 PDF 파일</span>
              </div>

              {/* 썸네일 PDF */}
              <div className="space-y-1 select-none">
                {selectedNeuron?.pdf?.map(
                  (file: INeuronFile, index: number) => {
                    return (
                      <div
                        key={index}
                        className="relative w-full p-px flex justify-center items-center bg-gray-100 border border-gray-300 hover:border-black overflow-hidden"
                      >
                        <div className="px-3 py-1 w-full h-full outline outline-1 outline-white truncate overflow-hidden">
                          <span className="text-xs font-bold">
                            {file.originalname}
                          </span>
                        </div>

                        {/* PDF 삭제 버튼 */}
                        {!(file.isDelete || false) && (
                          <div
                            key={index}
                            onClick={() => handlePdfDeleteButton_onClick(file)}
                            className="button-event absolute right-0.5 top-0.5 p-0.5 flex justify-center items-center bg-black rounded-full"
                          >
                            <FontAwesomeIcon
                              icon={['fas', 'xmark']}
                              className="w-3 h-3 text-white"
                            />
                          </div>
                        )}
                        {/* PDF 삭제 취소 버튼 */}
                        {(file.isDelete || false) && (
                          <>
                            <div
                              key={index}
                              onClick={() =>
                                handlePdfDeleteButton_onClick(file)
                              }
                              className="button-event absolute right-0.5 top-0.5 p-0.5 flex justify-center items-center bg-rose-700 rounded-full"
                            >
                              <FontAwesomeIcon
                                icon={['fas', 'arrow-left']}
                                className="w-3 h-3 text-white"
                              />
                            </div>

                            <div className="button-event absolute left-0 h-full">
                              <div className="w-full h-full px-2 flex justify-center items-center bg-rose-700 border border-white">
                                <span className="text-xs font-bold text-white">
                                  삭제 대기
                                </span>
                              </div>
                            </div>

                            {/*<div className="button-event absolute left-0 py-px w-full flex justify-center items-center bg-rose-700 border border-white">*/}
                            {/*  <span className="text-xs font-bold text-white">*/}
                            {/*    삭제 대기*/}
                            {/*  </span>*/}
                            {/*</div>*/}
                          </>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* 외부 링크 주소 */}
          <div>
            <TextInput
              placeholder="외부 링크 주소를 입력하세요."
              label="외부 링크 주소"
              size="xs"
              onChange={(event) => {
                setSelectedNeuron({
                  ...selectedNeuron!,
                  linkUrl: event.currentTarget.value,
                });
              }}
              defaultValue={selectedNeuron?.linkUrl}
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end items-center space-x-2">
            {/* 삭제하기 버튼 */}
            {selectedNeuron?.id !== 0 && (
              <Button
                onClick={handleDeleteNeuron_onClick}
                leftIcon={
                  <FontAwesomeIcon
                    icon={['fas', 'xmark']}
                    className="w-3.5 h-3.5"
                  />
                }
                size="sm"
                variant="outline"
                color="red"
              >
                삭제하기
              </Button>
            )}

            {/* 저장하기 버튼 */}
            <Button
              onClick={handleSaveNeuron_onClick}
              leftIcon={
                <FontAwesomeIcon
                  icon={['fas', 'check']}
                  className="w-3.5 h-3.5"
                />
              }
              size="sm"
              loading={isSaving}
            >
              저장하기
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default ManageNeuron_20220913;
