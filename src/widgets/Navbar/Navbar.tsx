import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { Dropdown, Menu, Row } from 'antd';
import { ItemType } from 'antd/es/menu/interface';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const navigate = useNavigate(); // Initialize navigate function
  
  const items: ItemType[] = [
    {
      key: '2',
      label: 'MyProfile', // Label for profile
      onClick: () => navigate('/home'), // Navigate to /home on click
    },
    {
      key: '3',
      label: 'Logout', // Label for logout
      onClick: () => navigate('/logout'), // Navigate to /logout on click
    },
  ];

  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const ParsedUser = JSON.parse(user);
      setSelectedUser(ParsedUser);
    }
  }, []);

  if (selectedUser) {
    return (
      <Row align="middle" justify={'end'} className="navbar">
        <Dropdown overlay={<Menu items={items} />} placement="bottomRight">
          <span>{`${selectedUser.first_name} ${selectedUser.last_name} - ${selectedUser.role}`}</span>
        </Dropdown>
      </Row>
    );
  }
  return null;
};
