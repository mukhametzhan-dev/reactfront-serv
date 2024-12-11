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
} from 'antd';
import { useForm } from 'antd/es/form/Form';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { CiUser, CiEdit } from 'react-icons/ci';
import { FaFileUpload } from 'react-icons/fa';

const { Title, Text } = Typography;

export const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [form] = useForm();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPnE_fy9lLMRP5DLYLnGN0LRLzZOiEpMrU4g&s'
  );

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Parsed user:', parsedUser);
        setUser(parsedUser);
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
      if (user.profilePic) {
        setAvatarUrl(user.profilePic);
      }
    }
  }, [form, user]);

  const handleAvatarUploadChange = (info: any) => {
    if (info.file.status === 'done' || info.file.status === 'uploading' || info.file.status === 'removed') {
      // Actually, we won't rely on "status" from `Upload` since we are not using `action`.
      // We'll just take the file directly from `originFileObj`.
      const file = info.file.originFileObj;
      if (file) {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setAvatarUrl(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSave = () => {
    form.validateFields().then(async (values) => {
      try {
        const updatedData = new FormData();
        // Make sure field names match exactly what the backend expects
        updatedData.append('email', user.email);
        updatedData.append('firstName', values.firstName);
        updatedData.append('lastName', values.lastName);
        updatedData.append('mobileNumber', values.phone);
        updatedData.append('bio', values.bio || '');
        // If you also allow editing dateOfBirth, gender, or password, append them similarly

        if (user.role === 'doctor' && values.specialization) {
          updatedData.append('specialization', values.specialization);
        }

        // Append avatar if user selected a new file
        if (avatarFile) {
          updatedData.append('avatar', avatarFile);
        }

        const endpoint = user.role === 'doctor' ? 'edit_doctor_profile' : 'edit_patient_profile';
        const response = await axios.put(
          `http://127.0.0.1:5000/${endpoint}`,
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
            profilePic: avatarUrl,
            specialization: values.specialization,
          };
          console.log(avatarUrl);

          setUser(updatedUser);
          form.setFieldsValue(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setEditing(false);
          console.log('Profile updated successfully');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    });
  };

  const handleEdit = () => {
    setEditing(true);
  };

  return (
    <Row justify="center" style={{ padding: '30px' }}>
      <Col span={24}>
        <div className="profile-container">
          <Row className="profile-header">
            <Col span={24}>
              <Row justify="end">
                {!editing && (
                  <Button
                    type="link"
                    icon={<CiEdit />}
                    onClick={handleEdit}
                    style={{ marginLeft: 'auto' }}
                  >
                    Edit Profile
                  </Button>
                )}
              </Row>
            </Col>
            <Col span={24}>
              <Row>
                <Col span={8}>
                  <Row
                    align="middle"
                    justify="center"
                    style={{ height: '100%' }}
                  >
                    <Avatar
                      size={200}
                      icon={<CiUser />}
                      src={avatarUrl}
                      style={{ marginRight: '20px' }}
                    />
                  </Row>
                </Col>

                <Col span={16}>
                  <div className="profile-details">
                    <Title level={3}>
                      {user?.first_name} {user?.last_name}
                    </Title>
                    <Text>Email: {user?.email}</Text>
                    <br />
                    <Text>Phone: {user?.phone}</Text>
                    <br />
                    <Text>Bio: {user?.bio || 'No bio available'}</Text>
                    <Divider />
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
                      <>
                        <div className="profile-item">
                          <strong>Specialization: </strong> {user?.specialization}
                        </div>
                      </>
                    )}
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
          <Divider />
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
            {editing && (
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
                  ]}
                >
                  <Input placeholder="Enter your email" disabled />
                  {/* Usually email shouldn't be changed if it's a unique identifier. */}
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your phone number',
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
                        { value: '001', label: 'Cardiologist' },
                        { value: '002', label: 'Neurologist' },
                        { value: '003', label: 'Orthopedic Surgeon' },
                        // ... add more as needed
                      ]}
                    />
                  </Form.Item>
                )}
                <Form.Item label="Avatar">
                  <Upload
                    name="avatar"
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={() => false} // Prevent auto upload
                    onChange={handleAvatarUploadChange}
                  >
                    <div>
                      <FaFileUpload />
                      <div>Click to select avatar</div>
                    </div>
                  </Upload>
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    onClick={handleSave}
                    style={{ marginRight: '10px' }}
                  >
                    Save Changes
                  </Button>
                  <Button onClick={() => setEditing(false)}>Cancel</Button>
                </Form.Item>
              </>
            )}
          </Form>
        </div>
      </Col>
    </Row>
  );
};
