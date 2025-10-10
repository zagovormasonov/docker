import React from 'react';
import { Switch, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

interface ThemeSwitchProps {
  isDark: boolean;
  onChange: (isDark: boolean) => void;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ isDark, onChange }) => {
  return (
    <Tooltip title={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}>
      <Switch
        checked={isDark}
        onChange={onChange}
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
        style={{
          backgroundColor: isDark ? '#1890ff' : '#d9d9d9'
        }}
      />
    </Tooltip>
  );
};

export default ThemeSwitch;

