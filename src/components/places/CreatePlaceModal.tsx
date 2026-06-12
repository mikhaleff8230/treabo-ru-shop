import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, MapPin, Store, Camera, Video, Upload as UploadIcon, X as XIcon, GripVertical } from 'lucide-react';
import client from '@/data/client';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import ProductAutocomplete from '@/components/place/product-autocomplete';
import { useTranslation } from 'next-i18next';
import Uploader from '@/components/ui/forms/uploader';
import type { Attachment } from '@/types';
import Image from 'next/image';
import { useMe, useMyShops } from '@/data/user';
import HashtagAutocomplete from './HashtagAutocomplete';

interface CreatePlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

interface PlaceFormData {
  title: string;
  description: string;
  video?: FileList;
  hashtags?: Array<{ id?: string; name: string } | string>;
  product_id?: string;
}

// Интерфейс для данных, которые мы отправляем на сервер
interface PlaceSubmitData {
  title: string;
  description: string;
  video?: FileList;
  hashtags?: string[];
  product_id?: string;
}

const CreatePlaceModal: React.FC<CreatePlaceModalProps> = ({ 
  isOpen, 
  onClose, 
  initialData, 
  mode = 'create' 
}) => {
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null, null, null]);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [imageError, setImageError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const startY = useRef<number | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  
  // Получаем данные пользователя и его магазинов
  const { me, isAuthorized } = useMe();
  const { shops = [], isLoading: shopsLoading } = useMyShops();
  
  // Обработчики для свайпа вниз (только от верхней части модалки)
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    // Свайп работает только от верхней части (серая полоска или заголовок)
    startY.current = e.touches[0].clientY;
    e.stopPropagation();
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (!startY.current) return;
    
    const diff = e.touches[0].clientY - startY.current;
    
    // Свайп должен быть только вниз и достаточно большой
    if (diff > 0 && diff > 100) {
      // Предотвращаем скролл страницы при свайпе
      e.preventDefault();
      onClose();
      startY.current = null;
    }
  };

  const handleHeaderTouchEnd = () => {
    startY.current = null;
  };
  
  
  // Определяем shopId для поиска товаров
  const shopId = shops && shops.length > 0 && shops[0]?.id ? shops[0].id : undefined;
  
  // Упрощенная проверка - если у пользователя есть магазины, значит он store_owner
  const isStoreOwner = shops && shops.length > 0;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<PlaceFormData>({
    defaultValues: {
      hashtags: [], // Значение по умолчанию для хештегов
    },
  });

  // Заполняем форму данными при открытии в режиме редактирования
  useEffect(() => {
    if (isOpen && mode === 'edit' && initialData && setValue) {
      try {
        if (!initialData || typeof initialData !== 'object') {
          console.error('initialData is not a valid object:', initialData);
          return;
        }
        
        console.log('CreatePlaceModal - загрузка данных для редактирования:', {
          placeId: initialData.id,
          title: initialData.title,
          hashtags: initialData.hashtags,
          hashtagsType: typeof initialData.hashtags,
          hashtagsIsArray: Array.isArray(initialData.hashtags),
          hashtagsLength: initialData.hashtags?.length || 0,
        });
        
        setValue('title', initialData.title || '');
        setValue('description', initialData.description || '');
        
        // Заполняем хештеги - сохраняем структуру объектов
        if (initialData.hashtags && Array.isArray(initialData.hashtags) && initialData.hashtags.length > 0) {
          // Преобразуем хештеги в правильный формат
          const hashtags = initialData.hashtags.map((tag: any) => {
            if (typeof tag === 'string') {
              return { name: tag };
            }
            if (typeof tag === 'object' && tag !== null) {
              return { id: tag.id, name: tag.name || tag };
            }
            return null;
          }).filter(Boolean);
          
          console.log('CreatePlaceModal - преобразованные хештеги:', hashtags);
          // ВАЖНО: Поле зарегистрировано через register(), поэтому setValue работает правильно
          setValue('hashtags', hashtags, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        } else {
          console.log('CreatePlaceModal - хештеги отсутствуют или пусты, устанавливаем пустой массив');
          setValue('hashtags', [], {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        }
        
        // В режиме редактирования показываем существующие изображения только для просмотра
        // images может быть массивом объектов {id, url} или массивом строк
        if (initialData.images && Array.isArray(initialData.images)) {
          const previews = [...Array(5).fill(null)];
          initialData.images.forEach((img: any, index: number) => {
            if (index < 5) {
              // Если img - объект, извлекаем url, иначе используем как строку
              const imageUrl = typeof img === 'string' ? img : (img?.url || img?.image_url || null);
              if (imageUrl) {
                previews[index] = imageUrl;
              }
            }
          });
          setImagePreviews(previews);
        }
        
        // В режиме редактирования показываем существующее видео только для просмотра
        // videos - это массив объектов, берем первое видео
        if (initialData.videos && Array.isArray(initialData.videos) && initialData.videos.length > 0) {
          const firstVideo = initialData.videos[0];
          const videoUrl = typeof firstVideo === 'string' ? firstVideo : (firstVideo?.url || firstVideo?.video_url || null);
          if (videoUrl) {
            setVideoPreview(videoUrl);
          }
        } else if (initialData.video) {
          // Обратная совместимость: если video передано как строка или объект
          const videoUrl = typeof initialData.video === 'string' ? initialData.video : (initialData.video?.url || null);
          if (videoUrl) {
            setVideoPreview(videoUrl);
          }
        }
        
        // Заполняем товар
        if (initialData.products && Array.isArray(initialData.products) && initialData.products.length > 0) {
          const firstProduct = initialData.products[0];
          if (firstProduct && firstProduct.id) {
            setSelectedProduct(firstProduct);
            setValue('product_id', firstProduct.id);
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных плейса для редактирования:', error);
        setFormError('Ошибка при загрузке данных плейса. Попробуйте еще раз.');
      }
    } else if (!isOpen) {
      // Сбрасываем состояние при закрытии модала
      try {
        if (reset && typeof reset === 'function') {
          reset();
        }
        setImageFiles([null, null, null, null, null]);
        setImagePreviews([null, null, null, null, null]);
        setVideoPreview('');
        setVideoError('');
        setFormError('');
        setSelectedProduct(null);
      } catch (error) {
        console.error('Ошибка при сбросе формы:', error);
      }
    }
  }, [isOpen, mode, initialData, setValue, reset]);

  const createPlaceMutation = useMutation({
    mutationFn: client.places.create,
    onSuccess: () => {
      // Простое обновление кэша
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PLACES] });
      
      reset();
      setImageFiles([null, null, null, null, null]);
      setImagePreviews([null, null, null, null, null]);
      setVideoPreview('');
      setFormError('');
      setIsLoading(false);
      onClose();
    },
    onError: (error: any) => {
      console.error('Error creating place:', error);
      
      // Обработка ошибок валидации Laravel
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        // Проверяем ошибку валидации видео
        if (errors.video && errors.video.length > 0) {
          setVideoError(errors.video[0]);
          setFormError('Ошибка загрузки на сервер: ' + errors.video[0]);
        } else {
          // Другие ошибки валидации
          const firstError = Object.values(errors)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          setFormError('Ошибка загрузки на сервер: ' + errorMessage);
        }
      } else {
        // Общая ошибка
        const errorMessage = error?.response?.data?.message || 'Произошла ошибка при создании плейса. Попробуйте еще раз.';
        setFormError('Ошибка загрузки на сервер: ' + errorMessage);
      }
      setIsLoading(false);
    },
  });

  const updatePlaceMutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (!initialData || !initialData.id) {
        throw new Error('ID плейса не найден');
      }
      return client.places.update(initialData.id, formData);
    },
    onSuccess: () => {
      // Простое обновление кэша
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PLACES] });
      if (initialData?.id) {
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PLACES, initialData.id] });
      }
      
      reset();
      setImageFiles([null, null, null, null, null]);
      setImagePreviews([null, null, null, null, null]);
      setVideoPreview('');
      setFormError('');
      setIsLoading(false);
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating place:', error);
      
      // Обработка ошибок валидации Laravel
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        // Проверяем ошибку валидации видео
        if (errors.video && errors.video.length > 0) {
          setVideoError(errors.video[0]);
          setFormError('Ошибка загрузки на сервер: ' + errors.video[0]);
        } else {
          // Другие ошибки валидации
          const firstError = Object.values(errors)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          setFormError('Ошибка загрузки на сервер: ' + errorMessage);
        }
      } else {
        // Общая ошибка
        const errorMessage = error?.response?.data?.message || 'Произошла ошибка при обновлении плейса. Попробуйте еще раз.';
        setFormError(errorMessage);
      }
      setIsLoading(false);
    },
  });

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // В режиме редактирования не позволяем изменять видео
    if (mode === 'edit') return;

    const file = e.target.files?.[0];
    setVideoError('');

    if (file) {
      if (file.size > 40 * 1024 * 1024) {
        setVideoError('Максимальный размер видео — 40 Мб.');
        return;
      }
      setVideoPreview(URL.createObjectURL(file));
    } else {
      setVideoPreview('');
    }
  };

  const handleImageChange = (index: number, file: File | null) => {
    // В режиме редактирования не позволяем изменять изображения
    if (mode === 'edit') return;
    
    if (file) {
      // Проверка размера файла (максимум 5MB)
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSizeInBytes) {
                 alert('Файл слишком большой. Добавляйте фото до 5 Мб');
        return;
      }
    }
    
    setImageFiles(prev => {
      const updated = [...prev];
      updated[index] = file;
      return updated;
    });
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => {
          const updated = [...prev];
          updated[index] = e.target?.result as string;
          return updated;
        });
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviews(prev => {
        const updated = [...prev];
        updated[index] = null;
        return updated;
      });
    }
  };

  // Функции для drag & drop - разрешаем в режиме редактирования для сортировки
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Сохраняем индекс в dataTransfer для передачи между слотами
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    // Разрешаем drop на любые слоты с изображениями
    const targetPreview = imagePreviews[index];
    if (targetPreview) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    const draggedIndex = e.dataTransfer.getData('text/plain');
    if (draggedIndex && !isNaN(Number(draggedIndex))) {
      const sourceIndex = Number(draggedIndex);
      
      // Меняем местами изображения
      setImagePreviews(prev => {
        const updated = [...prev];
        const temp = updated[sourceIndex];
        updated[sourceIndex] = updated[dropIndex];
        updated[dropIndex] = temp;
        return updated;
      });
      
      setImageFiles(prev => {
        const updated = [...prev];
        const temp = updated[sourceIndex];
        updated[sourceIndex] = updated[dropIndex];
        updated[dropIndex] = temp;
        return updated;
      });
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const onSubmit = async (data: PlaceFormData) => {
    try {
      // Валидация: обязательно только название - проверяем в начале
      const title = data.title?.trim() || '';
      if (!title || title.length === 0) {
        setFormError('Введите название плейса');
        return;
      }
      
      setIsLoading(true);
      setFormError('');
      
      // Создаем объект только с нужными полями
      // ВАЖНО: для хештегов используем watch('hashtags'), так как это реактивное значение,
      // которое обновляется при изменении через setValue в HashtagAutocomplete
      // Также проверяем getValues как fallback, если watch не сработал
      const watchHashtags = watch('hashtags');
      const getValuesHashtags = getValues('hashtags');
      const hashtagsFromForm = watchHashtags || getValuesHashtags || [];
      
      console.log('CreatePlaceModal - получение хештегов из формы:', {
        mode,
        watchHashtags,
        getValuesHashtags,
        hashtagsFromForm,
        watchType: typeof watchHashtags,
        watchIsArray: Array.isArray(watchHashtags),
        watchLength: Array.isArray(watchHashtags) ? watchHashtags.length : 0,
        getValuesType: typeof getValuesHashtags,
        getValuesIsArray: Array.isArray(getValuesHashtags),
        getValuesLength: Array.isArray(getValuesHashtags) ? getValuesHashtags.length : 0,
      });
      
      const submitData: PlaceSubmitData = {
        title: title,
        description: data.description?.trim() || '',
        video: data.video,
        product_id: data.product_id,
        hashtags: Array.isArray(hashtagsFromForm) && hashtagsFromForm.length > 0
          ? hashtagsFromForm.map((tag: any) => {
              // Извлекаем name из объекта или используем строку
              if (typeof tag === 'string') {
                return tag.trim();
              }
              if (typeof tag === 'object' && tag !== null) {
                // Извлекаем name из объекта {id, name} или просто name
                const tagName = tag.name || tag;
                if (typeof tagName === 'string') {
                  return tagName.trim();
                }
              }
              return null;
            }).filter((tag: any) => tag && tag.length > 0)
          : []
      };
      
      console.log('CreatePlaceModal - обработка хештегов после преобразования:', {
        mode,
        hashtagsFromForm,
        submitDataHashtags: submitData.hashtags,
        submitDataHashtagsLength: submitData.hashtags?.length || 0,
        watchHashtags: watch('hashtags'),
        getValuesHashtags: getValues('hashtags'),
      });
      
      const formData = new FormData();
      formData.append('title', submitData.title);
      formData.append('description', submitData.description || '');
      
      // Обработка хэштегов
      // ВАЖНО: При редактировании ВСЕГДА отправляем хештеги (даже если пустой массив)
      // При создании отправляем только если есть хештеги
      // ВАЖНО: Добавляем хештеги СРАЗУ после создания FormData, чтобы они точно были включены
      if (mode === 'edit') {
        // При редактировании всегда отправляем хештеги
        // Это важно, чтобы бэкенд мог обновить связи через sync()
        if (submitData.hashtags && submitData.hashtags.length > 0) {
          console.log('CreatePlaceModal - отправка хештегов при редактировании:', submitData.hashtags);
          submitData.hashtags.forEach((tag) => {
            console.log('CreatePlaceModal - добавляем хештег в FormData:', tag);
            formData.append('hashtags[]', String(tag)); // Явно преобразуем в строку
          });
        } else {
          // Если массив пустой, отправляем пустую строку
          // Бэкенд обработает это и вызовет sync([]), что удалит все хештеги
          console.log('CreatePlaceModal - отправка пустого массива хештегов при редактировании (удаление всех)');
          formData.append('hashtags[]', '');
        }
      } else {
        // При создании отправляем только если есть хештеги
        if (submitData.hashtags && submitData.hashtags.length > 0) {
          console.log('CreatePlaceModal - отправка хештегов при создании:', submitData.hashtags);
          submitData.hashtags.forEach((tag) => {
            formData.append('hashtags[]', String(tag)); // Явно преобразуем в строку
          });
        }
        // Если хештегов нет при создании, не отправляем ничего (плейс создастся без хештегов)
      }
      
      // Отладочный вывод FormData
      // ВАЖНО: Проверяем все хештеги в FormData перед отправкой
      const allHashtagsInFormData = formData.getAll('hashtags[]');
      console.log('CreatePlaceModal - FormData перед отправкой:', {
        mode,
        title: formData.get('title'),
        description: formData.get('description'),
        hashtags: allHashtagsInFormData,
        hashtagsCount: allHashtagsInFormData.length,
        submitDataHashtags: submitData.hashtags,
        submitDataHashtagsLength: submitData.hashtags?.length || 0,
        // Проверяем все ключи в FormData
        formDataKeys: Array.from(formData.keys()),
      });
      
      // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Если при редактировании хештеги не добавлены, добавляем их принудительно
      if (mode === 'edit') {
        const hashtagsInFormData = formData.getAll('hashtags[]');
        if (hashtagsInFormData.length === 0 && submitData.hashtags && submitData.hashtags.length > 0) {
          console.warn('CreatePlaceModal - ВНИМАНИЕ: Хештеги не были добавлены в FormData, добавляем принудительно!');
          submitData.hashtags.forEach((tag) => {
            formData.append('hashtags[]', tag);
          });
          console.log('CreatePlaceModal - Хештеги добавлены принудительно:', formData.getAll('hashtags[]'));
        } else if (hashtagsInFormData.length === 0 && (!submitData.hashtags || submitData.hashtags.length === 0)) {
          // Если хештегов нет, отправляем пустую строку для удаления всех
          console.log('CreatePlaceModal - Хештегов нет, отправляем пустую строку для удаления всех');
          formData.append('hashtags[]', '');
        }
      }
      
      // Обработка изображений
      if (mode === 'create') {
        // Режим создания - добавляем новые изображения
        const validNewImages = imageFiles.filter(file => file && file instanceof File);
        
        console.log('CreatePlaceModal - подготовка изображений:', {
          totalImageFiles: imageFiles.length,
          validNewImages: validNewImages.length,
          files: validNewImages.map((f, i) => ({
            index: i,
            name: f.name,
            size: f.size,
            type: f.type
          }))
        });
        
        if (validNewImages.length > 0) {
          // Отправляем файлы как массив images[] для правильной обработки Laravel
          validNewImages.forEach((file) => {
            formData.append('images[]', file);
            console.log(`CreatePlaceModal - добавлено изображение:`, file.name, file.size);
          });
        }
      } else {
        // Режим редактирования - отправляем новый порядок изображений
        const currentImageOrder = imagePreviews.filter(preview => preview && preview.trim() !== '');
        if (currentImageOrder.length > 0) {
          currentImageOrder.forEach((imageUrl) => {
            // Извлекаем только ключ S3 из URL, если это полный URL
            let imageKey = imageUrl;
            if (typeof imageUrl === 'string' && imageUrl.includes('/')) {
              // Если это полный URL, извлекаем ключ после последнего '/'
              const urlParts = imageUrl.split('/');
              // Ищем ключ в формате 'places/images/...'
              const placesIndex = urlParts.findIndex(part => part === 'places');
              if (placesIndex !== -1) {
                imageKey = urlParts.slice(placesIndex).join('/');
              } else {
                // Если не нашли 'places', берем последнюю часть
                imageKey = urlParts[urlParts.length - 1];
              }
            }
            formData.append('existing_images[]', imageKey);
          });
        }
        // Если изображений нет, не отправляем existing_images - бэкенд не будет удалять существующие
      }
      
      // Обработка существующего видео в режиме редактирования
      if (mode === 'edit' && videoPreview) {
        // Извлекаем только ключ S3 из URL, если это полный URL
        let videoKey = videoPreview;
        if (typeof videoPreview === 'string' && videoPreview.includes('/')) {
          // Если это полный URL, извлекаем ключ после последнего '/'
          const urlParts = videoPreview.split('/');
          // Ищем ключ в формате 'places/videos/...'
          const placesIndex = urlParts.findIndex(part => part === 'places');
          if (placesIndex !== -1) {
            videoKey = urlParts.slice(placesIndex).join('/');
          } else {
            // Если не нашли 'places', берем последнюю часть
            videoKey = urlParts[urlParts.length - 1];
          }
        }
        formData.append('existing_video', videoKey);
      }
      
      // Добавление видео
      const videoFiles = videoInputRef.current?.files;
      const hasVideoSelected = videoFiles && videoFiles.length > 0;
      
      // Если видео выбрано, добавляем его в FormData
      if (mode === 'create' && hasVideoSelected) {
        formData.append('video', videoFiles[0]);
      }

      // Обработка товара
      if (submitData.product_id) {
        formData.append('product_ids[]', submitData.product_id);
      }

      if (mode === 'edit') {
        if (!initialData || !initialData.id) {
          setFormError('Ошибка: данные плейса не найдены. Попробуйте обновить страницу.');
          setIsLoading(false);
          return;
        }
        // ВАЖНО: Laravel НЕ умеет обрабатывать PUT с multipart/form-data
        // Используем POST с _method=PUT (Laravel метод spoofing)
        formData.append('_method', 'PUT');
        console.log('CreatePlaceModal - добавлен _method=PUT для Laravel method spoofing');
        updatePlaceMutation.mutate(formData);
      } else {
        createPlaceMutation.mutate(formData);
      }
    } catch (error) {
      console.error('Ошибка при создании плейса:', error);
      setFormError('Произошла ошибка при создании плейса. Попробуйте еще раз.');
      setIsLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  // Блокируем скролл body при открытом модальном окне
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 sm:bg-black/50 sm:backdrop-blur-sm"
      onClick={onClose}
    >
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="
          w-full
          h-[95vh]
          sm:h-auto
          sm:max-h-[90vh]
          sm:max-w-2xl
          sm:mx-4
          bg-white dark:bg-dark-200
          rounded-t-3xl
          sm:rounded-lg
          shadow-xl
          flex flex-col
          overflow-hidden
          animate-[slide-up_0.25s_ease-out]
          sm:animate-none
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-white bg-opacity-70 dark:bg-dark-200 dark:bg-opacity-70 z-[9999] flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
              <span className="mt-4 text-black dark:text-white font-semibold text-lg">Загрузка...</span>
            </div>
          </div>
        )}
        
        {/* Серая полоска для мобильной версии - область для свайпа */}
        <div 
          className="mx-auto mt-2 mb-2 w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full sm:hidden modal-drag-handle"
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
        />
        
        {/* Header - область для свайпа */}
        <div 
          className="flex items-center justify-between px-4 py-3 sm:p-4 sm:p-6 border-b border-light-300 dark:border-dark-400 flex-shrink-0 modal-header-area"
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
        >
          <div className="w-10 sm:w-0" />
          <h2 className="text-base sm:text-lg sm:text-xl font-semibold text-dark dark:text-light">
            {mode === 'edit' ? 'Редактировать' : 'Новый плейс'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-light-200 dark:hover:bg-dark-300 rounded-full transition-colors touch-manipulation"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6 sm:w-5 sm:h-5 text-light-base dark:text-dark-base" />
          </button>
        </div>

        {/* Form */}
        <form id="create-place-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-4 pb-32 sm:pb-6 sm:p-4 sm:p-6 space-y-4 sm:space-y-6">
          {formError && <div className="text-xs sm:text-sm text-red-500 mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">{formError}</div>}
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-dark dark:text-light mb-2">
              {t('place-title')}
            </label>
            <input
              type="text"
              {...register('title', { required: t('place-title-required') })}
              className="w-full px-4 py-3 border border-light-300 dark:border-dark-400 rounded-lg bg-white dark:bg-dark-300 text-dark dark:text-light placeholder-light-600 dark:placeholder-dark-600 focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              placeholder={t('place-title-placeholder')}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-warning">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark dark:text-light mb-2">
              {t('place-description')}
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-3 border border-light-300 dark:border-dark-400 rounded-lg bg-white dark:bg-dark-300 text-dark dark:text-light placeholder-light-600 dark:placeholder-dark-600 focus:ring-2 focus:ring-brand focus:border-transparent transition-colors resize-none"
              placeholder={t('place-description-placeholder')}
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-dark dark:text-light mb-2">
              Хэштеги
            </label>
            {/* ВАЖНО: Регистрируем поле hashtags, чтобы react-hook-form отслеживало изменения */}
            {/* Это критически важно для работы watch() и setValue() в режиме редактирования */}
            <input 
              type="hidden" 
              {...register('hashtags')} 
            />
            <HashtagAutocomplete
              value={watch('hashtags') || []}
              onChange={(value) => {
                console.log('HashtagAutocomplete onChange:', {
                  value,
                  valueType: typeof value,
                  isArray: Array.isArray(value),
                  length: Array.isArray(value) ? value.length : 0,
                  mode,
                });
                // ВАЖНО: Теперь setValue работает правильно, так как поле зарегистрировано через register()
                // Без register() поле считается uncontrolled и изменения не отслеживаются
                setValue('hashtags', value, { 
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                });
                // Проверяем, что значение обновилось
                console.log('HashtagAutocomplete - после setValue, watch:', watch('hashtags'));
                console.log('HashtagAutocomplete - после setValue, getValues:', getValues('hashtags'));
              }}
              error={errors.hashtags?.message}
              maxTags={10}
            />
          </div>

          {/* Product autocomplete */}
          <div>
            <label className="block text-sm font-medium text-dark dark:text-light mb-2">
              Привязка товара
            </label>
            
            {!isAuthorized ? (
              <div className="p-3 border rounded bg-gray-50 text-gray-600">
                Авторизуйтесь для привязки товаров
              </div>
            ) : shopsLoading ? (
              <div className="p-3 border rounded bg-gray-50 text-gray-600">
                Загрузка магазинов...
              </div>
            ) : shops.length === 0 ? (
              <div className="p-3 border rounded bg-blue-50 text-blue-700">
                У вас нет магазинов.{' '}
                <a href="http://seller.sancan.ru/" target="_blank" rel="noopener noreferrer" className="underline">
                  Создать магазин
                </a>
              </div>
            ) : (
              <ProductAutocomplete 
                shopId={shopId}
                value={selectedProduct}
                onChange={product => {
                  setSelectedProduct(product);
                  setValue('product_id', product ? product.id : '');
                }}
              />
            )}
            
            <input type="hidden" {...register('product_id')} />
            {selectedProduct && (
              <div className="flex items-center mt-2 p-2 border rounded bg-light-100 dark:bg-dark-300">
                {/* <img src={selectedProduct.image} alt={selectedProduct.name} className="w-8 h-8 object-cover rounded mr-2" /> */}
                <span className="font-medium mr-2">{selectedProduct.name}</span>
                <button type="button" onClick={() => { setSelectedProduct(null); setValue('product_id', ''); }} className="ml-auto text-xs text-red-500 hover:underline">{t('delete')}</button>
              </div>
            )}
          </div>

          {/* Images - только для создания или показ существующих для редактирования */}
          {mode === 'create' ? (
            <div>
              <label className="block text-sm font-medium text-dark dark:text-light mb-2">
                {t('Фото (до 5 Мб)')}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {imagePreviews.map((preview, idx) => (
                  <div 
                    key={idx} 
                    draggable={!!preview}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ${
                      draggedIndex === idx 
                        ? 'border-brand opacity-50 scale-95' 
                        : dragOverIndex === idx && preview
                          ? 'border-brand bg-brand/10' 
                          : 'border-light-400 dark:border-dark-400'
                    } flex items-center justify-center ${
                      preview ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                  >
                    {preview ? (
                      <>
                        <Image src={preview} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                        {/* Drag handle */}
                        <div className="absolute top-1 left-1 rounded-full bg-black/50 p-1 text-white cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-3 w-3" />
                        </div>
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleImageChange(idx, null)}
                          className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                        {/* Drag overlay */}
                        {draggedIndex === idx && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Перемещается...</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0] || null;
                            handleImageChange(idx, file);
                          }}
                        />
                        <UploadIcon className="h-6 w-6 text-light-600 dark:text-light-400 mb-1" />
                        <span className="text-xs text-light-600 dark:text-light-400">Добавить</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // В режиме редактирования показываем существующие изображения с возможностью сортировки
            imagePreviews.some(preview => preview) && (
              <div>
                <label className="block text-sm font-medium text-dark dark:text-light mb-2">
                  Существующие фото (можно изменить порядок)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {imagePreviews.map((preview, idx) => (
                    preview && (
                      <div 
                        key={idx} 
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                          draggedIndex === idx 
                            ? 'border-brand opacity-50 scale-95' 
                            : dragOverIndex === idx
                              ? 'border-brand bg-brand/10' 
                              : 'border-light-400 dark:border-dark-400'
                        } cursor-grab active:cursor-grabbing`}
                      >
                        <Image src={preview} alt={`Image ${idx + 1}`} fill className="object-cover" />
                        {/* Drag handle */}
                        <div className="absolute top-1 left-1 rounded-full bg-black/50 p-1 text-white cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-3 w-3" />
                        </div>
                        {/* Drag overlay */}
                        {draggedIndex === idx && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Перемещается...</span>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )
          )}

          {/* Video */}
          {mode === 'create' ? (
            <div>
              <label className="block text-sm font-medium text-dark dark:text-light mb-2">
                Видео (до 40 Мб)
              </label>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    ref={videoInputRef}
                    onChange={handleVideoChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-light-300 dark:border-dark-400 rounded-lg cursor-pointer hover:border-brand transition-colors"
                  >
                    <div className="text-center">
                      <Video className="w-8 h-8 text-light-600 dark:text-dark-600 mx-auto mb-2" />
                      <p className="text-sm text-light-base dark:text-dark-base">
                        Нажмите, чтобы загрузить видео
                      </p>
                    </div>
                  </label>
                </div>
                {videoError && <div className="text-xs text-red-500 mt-1">{videoError}</div>}
                {/* Video preview */}
                {videoPreview && (
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <video
                      src={videoPreview}
                      controls
                      preload="metadata"
                      controlsList="nodownload"
                      playsInline
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Ошибка загрузки видео превью:', e);
                      }}
                    >
                      <source src={videoPreview} type="video/mp4" />
                      <source src={videoPreview} type="video/webm" />
                      <source src={videoPreview} type="video/ogg" />
                      Ваш браузер не поддерживает воспроизведение видео.
                    </video>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // В режиме редактирования показываем существующее видео только для просмотра
            videoPreview && (
              <div>
                <label className="block text-sm font-medium text-dark dark:text-light mb-2">
                  Существующее видео (нельзя изменить)
                </label>
                <div className="relative aspect-video rounded-xl overflow-hidden">
                  <video
                    src={videoPreview}
                    controls
                    preload="metadata"
                    controlsList="nodownload"
                    playsInline
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Ошибка загрузки видео превью:', e);
                    }}
                  >
                    <source src={videoPreview} type="video/mp4" />
                    <source src={videoPreview} type="video/webm" />
                    <source src={videoPreview} type="video/ogg" />
                    Ваш браузер не поддерживает воспроизведение видео.
                  </video>
                </div>
              </div>
            )
          )}

          {/* Submit Button для десктопа */}
          <div className="hidden sm:flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 pb-2 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 sm:px-6 text-light-base dark:text-dark-base hover:bg-light-200 dark:hover:bg-dark-300 rounded-lg transition-colors"
            >
              {t('text-cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || createPlaceMutation.isPending || updatePlaceMutation.isPending || !(watch('title') && watch('title').trim())}
              className="px-4 py-3 sm:px-6 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading || (createPlaceMutation.isPending || updatePlaceMutation.isPending) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{mode === 'edit' ? t('updating') : t('creating')}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>
                    {mode === 'edit' 
                      ? (updatePlaceMutation.isPending ? t('updating') : t('update-place'))
                      : (createPlaceMutation.isPending ? t('creating') : t('add_place'))
                    }
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Фиксированная нижняя кнопка для мобильной версии */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-200 border-t border-light-300 dark:border-dark-400 p-3 sm:hidden z-10 safe-area-inset-bottom">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const form = document.getElementById('create-place-form') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              } else {
                handleSubmit(onSubmit)();
              }
            }}
            disabled={isLoading || createPlaceMutation.isPending || updatePlaceMutation.isPending || !(watch('title') && watch('title').trim())}
            className="w-full h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation"
          >
            {isLoading || (createPlaceMutation.isPending || updatePlaceMutation.isPending) ? (
              <>
                <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                <span>{mode === 'edit' ? 'Сохранение...' : 'Публикация...'}</span>
              </>
            ) : (
              <span>{mode === 'edit' ? 'Сохранить' : 'Опубликовать'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreatePlaceModal; 