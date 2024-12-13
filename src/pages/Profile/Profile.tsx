import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Avatar,
  Button,
  Divider,
  Input,
  Upload,
  Typography,
  Form,
  Select,
  message,
} from 'antd';
import { useForm } from 'antd/es/form/Form';
import axios from 'axios';
import { CiUser, CiEdit } from 'react-icons/ci';
import { FaFileUpload } from 'react-icons/fa';
import './Profile.css';

const { Title, Text } = Typography;

export const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [form] = useForm();
  const [avatarUrl, setAvatarUrl] = useState<string>(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPnE_fy9lLMRP5DLYLnGN0LRLzZOiEpMrU4g&s' // Default avatar
  );

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAvatar = localStorage.getItem('avatar');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Load avatar from LocalStorage if exists
        if (storedAvatar) {
          setAvatarUrl(storedAvatar);
        } else if (parsedUser.profilePic) {
          setAvatarUrl(parsedUser.profilePic);
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        role: user.role,
        specialization: user.specialization,
      });
    }
  }, [form, user]);

  const handleAvatarUploadChange = (info: any) => {
    if (info.file.status === 'done' || info.file.status === 'uploading' || info.file.status === 'removed') {
      const file = info.file.originFileObj;
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const base64 = e.target.result as string;
            setAvatarUrl(base64);
            localStorage.setItem('avatar', base64); 
            console.log(avatarUrl);// Store in LocalStorage
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSave = () => {
    form.validateFields().then(async (values) => {
      try {
        const updatedData = {
          email: user.email,
          firstName: values.firstName,
          lastName: values.lastName,
          mobileNumber: values.phone,
          bio: values.bio || '',
          specialization: user.role === 'doctor' ? values.specialization : undefined,
        };

        const endpoint = user.role === 'doctor' ? 'edit_doctor_profile' : 'edit_patient_profile';

        const response = await axios.put(
          `https://happymed.work.gd/${endpoint}`,
          updatedData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.status === 200) {
          const updatedUser = {
            ...user,
            first_name: values.firstName,
            last_name: values.lastName,
            phone: values.phone,
            bio: values.bio,
            role: user.role,
            specialization: values.specialization,
          };

          setUser(updatedUser);
          form.setFieldsValue(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setEditing(false);
          message.success('Profile updated successfully.');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        message.error('Failed to update profile. Please try again.');
      }
    });
  };

  const handleEdit = () => {
    setEditing(true);
  };

  return (
    <Row justify="center" className="profile-container">
      <Col xs={24} sm={22} md={20} lg={16}>
        <div className="profile-card">
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} className="profile-title">Profile</Title>
            </Col>
            <Col>
              {!editing && (
                <Button
                  type="primary"
                  icon={<CiEdit />}
                  onClick={handleEdit}
                  className="edit-button"
                >
                  Edit Profile
                </Button>
              )}
            </Col>
          </Row>
          <Divider />
          <Row gutter={[16, 16]} className="profile-content">
            <Col xs={24} sm={8} md={6}>
              <div className="avatar-section">
                <Avatar
                  size={150}
                  icon={<CiUser />}
                  src={avatarUrl}
                  className="profile-avatar"
                />
                {editing && (
                  <Upload
                    name="avatar"
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={() => false} // Prevent auto upload
                    onChange={handleAvatarUploadChange}
                    className="avatar-upload"
                  >
                    <div>
                      <FaFileUpload />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                )}
              </div>
            </Col>
            <Col xs={24} sm={16} md={18}>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  firstName: user?.first_name,
                  lastName: user?.last_name,
                  email: user?.email,
                  phone: user?.phone,
                  bio: user?.bio,
                  role: user?.role,
                  specialization: user?.specialization,
                }}
              >
                {editing ? (
                  <>
                    <Form.Item
                      name="firstName"
                      label="First Name"
                      rules={[
                        { required: true, message: 'Please enter your first name' },
                      ]}
                    >
                      <Input placeholder="Enter your first name" />
                    </Form.Item>
                    <Form.Item
                      name="lastName"
                      label="Last Name"
                      rules={[
                        { required: true, message: 'Please enter your last name' },
                      ]}
                    >
                      <Input placeholder="Enter your last name" />
                    </Form.Item>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' },
                      ]}
                    >
                      <Input placeholder="Enter your email" disabled />
                      {/* Email is unique identifier; usually not editable */}
                    </Form.Item>
                    <Form.Item
                      name="phone"
                      label="Phone Number"
                      rules={[
                        {
                          required: true,
                          message: 'Please enter your phone number',
                        },
                        {
                          pattern: /^\d{10,15}$/,
                          message: 'Please enter a valid phone number',
                        },
                      ]}
                    >
                      <Input placeholder="Enter your phone number" />
                    </Form.Item>
                    <Form.Item name="bio" label="Bio">
                      <Input.TextArea placeholder="Write a short bio" rows={4} />
                    </Form.Item>
                    {user?.role === 'doctor' && (
                      <Form.Item name="specialization" label="Specialization">
                        <Select
                          placeholder="Select specialization"
                          options={[
                            { value: 'Cardiologist', label: 'Cardiologist' },
                            { value: 'Neurologist', label: 'Neurologist' },
                            { value: 'Orthopedic Surgeon', label: 'Orthopedic Surgeon' },
                            { value: 'Dermatologist', label: 'Dermatologist' },
                            { value: 'Pediatrician', label: 'Pediatrician' },
                            // ... add more as needed
                          ]}
                        />
                      </Form.Item>
                    )}
                    <Form.Item>
                      <div className="form-buttons">
                        <Button
                          type="primary"
                          onClick={handleSave}
                          className="save-button"
                        >
                          Save Changes
                        </Button>
                        <Button
                          onClick={() => {
                            setEditing(false);
                            form.resetFields();
                            const storedAvatar = localStorage.getItem('avatar');
                            if (storedAvatar) {
                              setAvatarUrl(storedAvatar);
                            } else if (user.profilePic) {
                              setAvatarUrl(user.profilePic);
                            } else {
                              setAvatarUrl('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPnE_fy9lLMRP5DLYLnGN0LRLzZOiEpMrU4g&s');
                            }
                          }}
                          className="cancel-button"
                        >
                          Cancel
                        </Button>
                      </div>
                    </Form.Item>
                  </>
                ) : (
                  <div className="profile-details">
                    <div className="profile-item">
                      <strong>First Name: </strong> {user?.first_name}
                    </div>
                    <div className="profile-item">
                      <strong>Last Name: </strong> {user?.last_name}
                    </div>
                    <div className="profile-item">
                      <strong>Email: </strong> {user?.email}
                    </div>
                    <div className="profile-item">
                      <strong>Phone: </strong> {user?.phone}
                    </div>
                    <div className="profile-item">
                      <strong>Bio: </strong> {user?.bio || 'No bio available'}
                    </div>
                    <div className="profile-item">
                      <strong>Role: </strong> {user?.role || 'No Role available'}
                    </div>
                    {user?.role === 'doctor' && (
                      <div className="profile-item">
                        <strong>Specialization: </strong> {user?.specialization}
                      </div>
                    )}
                  </div>
                )}
              </Form>
            </Col>
          </Row>
        </div>
      </Col>
    </Row>
  );
};

export default Profile;
