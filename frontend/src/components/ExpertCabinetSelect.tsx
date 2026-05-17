import React, { forwardRef } from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import './ExpertCabinetSelect.css';

/** Контейнер для портала: кабинет мастера или body (токены на самой выпадашке). */
export function cabinetSelectPopupContainer(trigger: HTMLElement): HTMLElement {
  return (trigger.closest('.expert-cab-v2') as HTMLElement | null) || document.body;
}

/** Единый стиль Select для кабинета / форм услуг и продуктов (Ant Design + кастомное меню). */
export const ExpertCabinetSelect = forwardRef<any, SelectProps>((props, ref) => {
  const {
    className,
    popupClassName,
    suffixIcon,
    getPopupContainer,
    popupMatchSelectWidth,
    ...rest
  } = props;

  return (
    <Select
      ref={ref}
      {...rest}
      popupMatchSelectWidth={popupMatchSelectWidth ?? false}
      getPopupContainer={getPopupContainer ?? cabinetSelectPopupContainer}
      suffixIcon={suffixIcon ?? <DownOutlined className="ec-cabinet-select-arrow" aria-hidden />}
      className={['ec-cabinet-select', className].filter(Boolean).join(' ')}
      popupClassName={['ec-cabinet-select-dropdown', popupClassName].filter(Boolean).join(' ')}
    />
  );
});

ExpertCabinetSelect.displayName = 'ExpertCabinetSelect';
