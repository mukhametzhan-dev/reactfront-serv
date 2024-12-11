import { Layout, Menu, Row } from 'antd';
import { IconContext } from 'react-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { SIDEBAR_WIDTH } from './../../shared/config/theme/themeConfig/themeConfig';
import { sidebarItems, doctorSidebarItems, adminSidebarItems, collapsedSidebarItems, patientSidebarItems } from './routes';
import { useState, useEffect } from 'react';
import React from 'react';
import './Sidebar.css';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserRole(parsedUser.role);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
  }, []);

  const getMenuItems = () => {
    if (collapsed) {
      return collapsedSidebarItems;
    }
    if (userRole === 'doctor') {
      return doctorSidebarItems;
    } else if (userRole === 'administrator') {
      return adminSidebarItems;
    } else if (userRole !== 'doctor' && userRole !== 'administrator') {
      return patientSidebarItems;
    }
    return sidebarItems;
  };

  return (
    <Layout.Sider
      width={SIDEBAR_WIDTH}
      collapsed={collapsed}
      onCollapse={(collapsed) => setCollapsed(collapsed)}
      className="custom-sidebar"
    >
      <div className="brand-container">
        <Row justify="center" align="middle" className="brand-row">
          <img 
            src="https://raw.githubusercontent.com/mukhametzhan-dev/reactfront-serv/refs/heads/main/public/icons/logo.png" sizes='20x30' 
            alt="Logo" 
            className={`brand-logo ${collapsed ? 'collapsed-logo' : ''}`}
          />
          {!collapsed && <span className="brand-title">HappyMed</span>}
        </Row>
      </div>

      <IconContext.Provider value={{ size: '16' }}>
        <Menu
          mode="inline"
          className="menu"
          items={getMenuItems()}
          onClick={({ key }) => {
            navigate(key);
          }}
          selectedKeys={[pathname]}
          defaultOpenKeys={[pathname]}
        />
      </IconContext.Provider>
    </Layout.Sider>
  );
};
