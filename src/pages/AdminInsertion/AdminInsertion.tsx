import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, Col, Input, Row, Select, Form, DatePicker, message, Modal } from 'antd';
import axios from 'axios';
import './AdminInsertion.css';

const { Option } = Select;

const AdminInsertion = () => {
  // if(localStorage.getItem('role') !== 'administrator') {
  //   console.log(localStorage.getItem('role'));

  //   window.location.href = '/home';
  //   return null;
  // }
  
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const role = watch('role', 'patient');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newUserInfo, setNewUserInfo] = useState({ email: '', password: '' });

  const onSubmit = async (data: any) => {
    try {
      const response = await axios.post(`https://apihappymed.serveo.net/add_user`, data);
      if (response.status === 200 || response.status === 201) {
        message.success(`${role.charAt(0).toUpperCase() + role.slice(1)} added successfully.`);
        setNewUserInfo({ email: data.email, password: response.data.password });
        setIsModalVisible(true);
        reset();
      } else {
        message.error(`Failed to add ${role}.`);
      }
    } catch (error) {
      console.error(`Error adding ${role}:`, error);
      message.error('An unexpected error occurred.');
    }
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  return (
    <Row justify="center" className="admin-insertion-container">
      <Col xs={24} sm={20} md={16} lg={12}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label="Role">
            <Controller
              name="role"
              control={control}
              defaultValue="patient"
              render={({ field }) => (
                <Select {...field} onChange={(value) => field.onChange(value)}>
                  <Option value="patient">Patient</Option>
                  <Option value="doctor">Doctor</Option>
                </Select>
              )}
            />
          </Form.Item>

          <Form.Item label="First Name">
            <Controller
              name="firstName"
              control={control}
              rules={{ required: 'Please input the first name!' }}
              render={({ field }) => <Input {...field} />}
            />
            {errors.firstName && <span className="error">{errors.firstName.message}</span>}
          </Form.Item>

          <Form.Item label="Last Name">
            <Controller
              name="lastName"
              control={control}
              rules={{ required: 'Please input the last name!' }}
              render={({ field }) => <Input {...field} />}
            />
            {errors.lastName && <span className="error">{errors.lastName.message}</span>}
          </Form.Item>

          <Form.Item label="Email">
            <Controller
              name="email"
              control={control}
              rules={{ required: 'Please input a valid email!', pattern: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/ }}
              render={({ field }) => <Input {...field} />}
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </Form.Item>

          <Form.Item label="Date of Birth">
            <Controller
              name="dob"
              control={control}
              rules={{ required: 'Please select the date of birth!' }}
              render={({ field }) => <DatePicker {...field} style={{ width: '100%' }} />}
            />
            {errors.dob && <span className="error">{errors.dob.message}</span>}
          </Form.Item>

          <Form.Item label="Gender">
            <Controller
              name="gender"
              control={control}
              rules={{ required: 'Please select the gender!' }}
              render={({ field }) => (
                <Select {...field}>
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                </Select>
              )}
            />
            {errors.gender && <span className="error">{errors.gender.message}</span>}
          </Form.Item>

          <Form.Item label="Phone">
            <Controller
              name="phone"
              control={control}
              rules={{ required: 'Please input the phone number!' }}
              render={({ field }) => <Input {...field} />}
            />
            {errors.phone && <span className="error">{errors.phone.message}</span>}
          </Form.Item>

          {role === 'doctor' && (
            <Form.Item label="Specialization">
              <Controller
                name="spec_id"
                control={control}
                rules={{ required: 'Please select your specialty' }}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select specialty"
                    className="controller"
                    options={[
                      { value: '001', label: 'Cardiologist' },
                      { value: '002', label: 'Neurologist' },
                      { value: '003', label: 'Orthopedic Surgeon' },
                      { value: '004', label: 'Dermatologist' },
                      { value: '005', label: 'Pediatrician' },
                      { value: '006', label: 'Oncologist' },
                      { value: '007', label: 'Endocrinologist' },
                      { value: '008', label: 'Gastroenterologist' },
                      { value: '009', label: 'Psychiatrist' },
                      { value: '010', label: 'Ophthalmologist' },
                      { value: '011', label: 'Urologist' },
                      { value: '012', label: 'Pulmonologist' },
                      { value: '013', label: 'Otolaryngologist (ENT Specialist)' },
                      { value: '014', label: 'Nephrologist' },
                      { value: '015', label: 'General Surgeon' },
                      { value: '016', label: 'Obstetrician-Gynecologist (OB-GYN)' },
                      { value: '017', label: 'Rheumatologist' },
                      { value: '018', label: 'Radiologist' },
                      { value: '019', label: 'Anesthesiologist' },
                      { value: '020', label: 'Pathologist' },
                    ]}
                  />
                )}
              />
              {errors.spec_id && <span className="error">{errors.spec_id.message}</span>}
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add {role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>
          </Form.Item>
        </Form>

        <Modal title="New User Registered" visible={isModalVisible} onOk={handleOk} onCancel={handleOk}>
          <p>Email: {newUserInfo.email}</p>
          <p>Password: {newUserInfo.password}</p>
          <p>Please save it.</p>
        </Modal>
      </Col>
    </Row>
  );
};

export default AdminInsertion;
