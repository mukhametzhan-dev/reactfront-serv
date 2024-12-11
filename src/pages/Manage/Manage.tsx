import React, { useState } from 'react';
import { Button, Col, Input, Row, List, Typography, Select, message, Modal, Card } from 'antd';
import axios from 'axios';
import './Manage.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  id: number;
}

interface Appointment {
  appointment_id: number;
  date: string;
  day_of_week: string;
  description: string;
  end_time: string;
  start_time: string;
  status: string;
  patient_name?: string;
  doctor_id?: number;
}

const Manage = () => {
  const [selectedRole, setSelectedRole] = useState<string>('patients');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const fetchUsers = async (role: string, query: string = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`https://happymed.duckdns.org/get_${role}?query=${query}`);
      console.log(response);
      if (response.status === 200) {
        setUsers(response.data);
      } else {
        message.error('Failed to fetch users.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    setUsers([]);
    setSelectedUser(null);
  };

  const handleSearch = () => {
    fetchUsers(selectedRole, searchQuery);
  };

  const handleShowAll = () => {
    fetchUsers(selectedRole);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditedUser({ ...user });
  };

  const handleSave = async () => {
    if (editedUser) {
      try {
        const response = await axios.put(`https://happymed.duckdns.org/update_user`, editedUser);
        if (response.status === 200) {
          message.success('User updated successfully.');
          setEditingUser(null);
          fetchUsers(selectedRole);
        } else {
          message.error('Failed to update user.');
        }
      } catch (error) {
        console.error('Error updating user:', error);
        message.error('An unexpected error occurred.');
      }
    }
  };

  const handleDelete = (user: User) => {
    confirm({
      title: 'Are you sure you want to delete this user?',
      onOk: async () => {
        try {
          const response = await axios.delete(`https://happymed.duckdns.org/delete_user`, { data: { email: user.email } });
          if (response.status === 200) {
            message.success('User deleted successfully.');
            fetchUsers(selectedRole);
          } else {
            message.error('Failed to delete user.');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          message.error('An unexpected error occurred.');
        }
      },
    });
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setEditingUser(null);
    setEditedUser(null);
  };

  const handleShowAppointments = async () => {
    if (selectedUser) {
      try {

        const response = await axios.get(
          selectedUser.role === 'doctor'
            ? `https://happymed.duckdns.org/get_appointments_for_doctor?email=${selectedUser.email}`
            : `https://happymed.duckdns.org/get_appointments_for_patient_with_id?patient_id=${selectedUser.id}`
        );
        if (response.status === 200) {
          setAppointments(response.data.appointments);
          setIsModalVisible(true);
        } else {
          message.error('Failed to fetch appointments.');
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        message.error('An unexpected error occurred.');
      }
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setAppointments([]);
  };

  return (
    <Row justify="center" className="manage-container">
      <Col xs={24} sm={20} md={16} lg={12}>
        <Title level={2}>Manage {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</Title>
        <Select
          value={selectedRole}
          onChange={handleRoleChange}
          className="role-select"
        >
          <Option value="patients">Patients</Option>
          <Option value="doctors">Doctors</Option>
        </Select>
        <Input
          placeholder="Search by FirstName, LastName, or Email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <Button type="primary" onClick={handleSearch} loading={loading} className="search-button">
          Search
        </Button>
        <Button onClick={handleShowAll} loading={loading} className="show-all-button">
          Show All
        </Button>
        <List
          bordered
          dataSource={users}
          renderItem={(item) => (
            <List.Item onClick={() => handleSelectUser(item)} style={{ cursor: 'pointer', backgroundColor: selectedUser?.email === item.email ? '#e6f7ff' : 'white' }}>
              <Text strong>{item.firstName} {item.lastName}</Text> - {item.email} ({item.role})
            </List.Item>
          )}
          className="user-list"
        />
        {selectedUser && (
          <div className="actions">
            <Button onClick={() => handleEdit(selectedUser)} style={{ marginRight: '8px' }}>Edit</Button>
            <Button onClick={() => handleDelete(selectedUser)} style={{ marginRight: '8px' }}>Delete</Button>
            <Button onClick={handleShowAppointments}>Appointments</Button>
          </div>
        )}
        {editingUser && (
          <div className="edit-form">
            <Input
              value={editedUser?.firstName}
              onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value } as User)}
              style={{ marginBottom: '8px' }}
            />
            <Input
              value={editedUser?.lastName}
              onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value } as User)}
              style={{ marginBottom: '8px' }}
            />
            <Button onClick={handleSave} style={{ marginRight: '8px' }}>Save</Button>
            <Button onClick={() => setEditingUser(null)}>Cancel</Button>
          </div>
        )}
        <Modal
          title="Appointments"
          visible={isModalVisible}
          onCancel={handleModalClose}
          footer={null}
        >
          <List
            itemLayout="vertical"
            //printing through the list as an card objects
            dataSource={appointments}
            renderItem={(appointment) => (
              <List.Item key={appointment.appointment_id}>
                <Card>
                  <Text><strong>Date:</strong> {appointment.date}</Text>
                  <br />
                  <Text><strong>Status:</strong> {appointment.status}</Text>
                  <br />
                  <Text><strong>Time:</strong> {appointment.start_time} - {appointment.end_time}</Text>
                  <br />
                  <Text><strong>Day of Week:</strong> {appointment.day_of_week}</Text>
                  <br />
                  <Text><strong>Description:</strong> {appointment.description}</Text>
                  {appointment.patient_name && (
                    <>
                      <br />
                      <Text><strong>Patient Name:</strong> {appointment.patient_name}</Text>
                    </>
                  )}
                </Card>
              </List.Item>
            )}
          />
        </Modal>
      </Col>
    </Row>
  );
};

export default Manage;
