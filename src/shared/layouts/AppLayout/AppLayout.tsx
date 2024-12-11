import { Layout } from 'antd';
import PropTypes from 'prop-types';
import { Sidebar } from './../../../widgets/Sidebar/Sidebar';
import './AppLayout.css';
import React from 'react';
import { Navbar } from '../../../widgets/Navbar/Navbar';

export const AppLayout = ({ children }) => {
  return (
    <Layout className="appLayout">
      <Layout>
        <Sidebar />
        <Layout>
          <div>
            <Navbar />
          </div>
          <Layout className="contentWrapper">{children}</Layout>
        </Layout>
      </Layout>
    </Layout>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node,
};
