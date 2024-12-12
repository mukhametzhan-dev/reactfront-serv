import React, { useState } from 'react';
import {
  Button,
  Col,
  Input,
  Row,
  List,
  Typography,
  Select,
  message,
  Modal,
  Card,
  Space,
} from 'antd';
import {
  SearchOutlined,
  UnorderedListOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
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
      const response = await axios.get(
        `http://127.0.0.1:5000/get_${role}?query=${query}`
      );
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
    setSearchQuery('');
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
        const response = await axios.put(
          `http://127.0.0.1:5000/update_user`,
          editedUser
        );
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
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const response = await axios.delete(
            `http://127.0.0.1:5000/delete_user`,
            { data: { email: user.email } }
          );
          if (response.status === 200) {
            message.success('User deleted successfully.');
            fetchUsers(selectedRole);
            if (selectedUser?.email === user.email) {
              setSelectedUser(null);
            }
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
            ? `http://localhost:5000/get_appointments_for_doctor?email=${selectedUser.email}`
            : `http://localhost:5000/get_appointments_for_patient_with_id?patient_id=${selectedUser.id}`
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
      <Col xs={24} sm={22} md={20} lg={16}>
        <Title level={2} className="manage-title">
          Manage{' '}
          {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
        </Title>
        <Row gutter={[16, 16]} className="controls-row">
          <Col xs={24} sm={12} md={8}>
            <Select
              value={selectedRole}
              onChange={handleRoleChange}
              className="role-select"
            >
              <Option value="patients">Patients</Option>
              <Option value="doctors">Doctors</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by FirstName, LastName, or Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col
            xs={24}
            sm={24}
            md={8}
            className="button-group"
          >
            <Space>
              <Button
                type="primary"
                onClick={handleSearch}
                loading={loading}
                icon={<SearchOutlined />}
                className="search-button"
              >
                Search
              </Button>
              <Button
                type="default"
                onClick={handleShowAll}
                loading={loading}
                icon={<UnorderedListOutlined />}
                className="show-all-button"
              >
                Show All
              </Button>
            </Space>
          </Col>
        </Row>
        <List
          bordered
          dataSource={users}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleSelectUser(item)}
              style={{
                cursor: 'pointer',
                backgroundColor:
                  selectedUser?.email === item.email ? '#e6f7ff' : 'white',
              }}
            >
              <Text strong>
                {item.firstName} {item.lastName}
              </Text>{' '}
              - {item.email} ({item.role})
            </List.Item>
          )}
          className="user-list"
          locale={{ emptyText: 'No users found.' }}
        />
        {selectedUser && (
          <Card className="actions-card">
            <Space>
              <Button
                type="primary"
                onClick={() => handleEdit(selectedUser)}
                icon={<EditOutlined />}
                className="action-button edit-button"
              >
                Edit
              </Button>
              <Button
                type="primary"
                danger
                onClick={() => handleDelete(selectedUser)}
                icon={<DeleteOutlined />}
                className="action-button delete-button"
              >
                Delete
              </Button>
              <Button
                type="default"
                onClick={handleShowAppointments}
                icon={<CalendarOutlined />}
                className="action-button appointments-button"
              >
                Appointments
              </Button>
            </Space>
          </Card>
        )}
        {editingUser && (
          <Card className="edit-form-card">
            <Title level={4}>Edit User</Title>
            <Input
              placeholder="First Name"
              value={editedUser?.firstName}
              onChange={(e) =>
                setEditedUser({
                  ...editedUser,
                  firstName: e.target.value,
                } as User)
              }
              style={{ marginBottom: '10px' }}
            />
            <Input
              placeholder="Last Name"
              value={editedUser?.lastName}
              onChange={(e) =>
                setEditedUser({
                  ...editedUser,
                  lastName: e.target.value,
                } as User)
              }
              style={{ marginBottom: '10px' }}
            />
            <Input
              placeholder="Email"
              value={editedUser?.email}
              onChange={(e) =>
                setEditedUser({
                  ...editedUser,
                  email: e.target.value,
                } as User)
              }
              style={{ marginBottom: '10px' }}
              disabled
            />
            <Select
              value={editedUser?.role}
              onChange={(value) =>
                setEditedUser({
                  ...editedUser,
                  role: value,
                } as User)
              }
              style={{ width: '100%', marginBottom: '10px' }}
            >
              <Option value="patient">Patient</Option>
              <Option value="doctor">Doctor</Option>
            </Select>
            <Space>
              <Button
                type="primary"
                onClick={handleSave}
                icon={<EditOutlined />}
              >
                Save
              </Button>
              <Button onClick={() => setEditingUser(null)}>Cancel</Button>
            </Space>
          </Card>
        )}
        <Modal
          title="Appointments"
          visible={isModalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="close" onClick={handleModalClose}>
              Close
            </Button>,
          ]}
          width={800}
        >
          <List
            itemLayout="vertical"
            dataSource={appointments}
            renderItem={(appointment) => (
              <List.Item key={appointment.appointment_id}>
                <Card className="appointment-card">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text>
                        <strong>Date:</strong> {appointment.date}
                      </Text>
                      <br />
                      <Text>
                        <strong>Day of Week:</strong> {appointment.day_of_week}
                      </Text>
                      <br />
                      <Text>
                        <strong>Time:</strong> {appointment.start_time} -{' '}
                        {appointment.end_time}
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text>
                        <strong>Status:</strong>{' '}
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </Text>
                      <br />
                      <Text>
                        <strong>Description:</strong> {appointment.description}
                      </Text>
                      {appointment.patient_name && (
                        <>
                          <br />
                          <Text>
                            <strong>Patient Name:</strong>{' '}
                            {appointment.patient_name}
                          </Text>
                        </>
                      )}
                    </Col>
                  </Row>
                </Card>
              </List.Item>
            )}
            locale={{ emptyText: 'No appointments found.' }}
          />
        </Modal>
      </Col>
    </Row>
  );
};

export default Manage;
