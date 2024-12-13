import React from 'react';
import { Layout, Menu } from 'antd';
import { Link } from 'react-router-dom';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div className="logo" />
        <Menu theme="dark" mode="inline">
          <Menu.Item key="1">
            <Link to="/appointments">Appointments</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to="/payment">Payment</Link>
          </Menu.Item>
          {/* Add more menu items as needed */}
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: 0 }} />
        <Content style={{ margin: '16px' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;