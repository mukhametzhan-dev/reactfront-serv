import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { Dropdown, Menu, Row, Avatar } from 'antd';
import { ItemType } from 'antd/es/menu/interface';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, HomeOutlined, LogoutOutlined } from '@ant-design/icons';

export const Navbar = () => {
  const navigate = useNavigate();

  // Menu items
  const items: ItemType[] = [
    {
      key: '2',
      label: (
        <>
          <HomeOutlined style={{ marginRight: '8px' }} />
          My Profile
        </>
      ),
      onClick: () => navigate('/home'),
    },
    {
      key: '3',
      label: (
        <>
          <LogoutOutlined style={{ marginRight: '8px' }} />
          Logout
        </>
      ),
      onClick: () => navigate('/logout'),
    },
  ];

  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setSelectedUser(parsedUser);
    }
  }, []);

  const defaultAvatar = '/path/to/default-avatar.png'; // Replace with the path to your default avatar

  return (
    <Row align="middle" justify="end" className="navbar">
      {selectedUser ? (
        <Dropdown overlay={<Menu items={items} />} placement="bottomRight">
          <div className="user-info">
            <Avatar
              src={selectedUser.avatar || defaultAvatar}
              icon={!selectedUser.avatar && <UserOutlined />}
              size="large"
            />
            <span className="user-name">
              {`${selectedUser.first_name} ${selectedUser.last_name} - ${selectedUser.role}`}
            </span>
          </div>
        </Dropdown>
      ) : (
        <Avatar icon={<UserOutlined />} size="large" />
      )}
    </Row>
  );
};