import React, { useState, useEffect } from 'react';
import { Button, Col, Input, message, Row, Select, Typography, Divider } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sender from '../Sender/Sender';
import './Appointment.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface Doctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  email: string;
  specialization: {
    spec_id: number;
    spec_name: string;
  };
  schedule: {
    day: string;
    time: [string, string];
  }[];
}

interface FormData {
  doctor: number;
  description: string;
  timeSlot: {
    day: string;
    time: string;
    date: string;
  };
  appointmentType: string;
  patient_id: number;
}

export const Appointment = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: string; time: string; date: string } | null>(null);
  
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setPatientId(parsedUser.patient_id); // Ensure patient_id is set
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        message.error('Failed to retrieve user information.');
      }
    } else {
      message.error('User not found. Please log in again.');
    }
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('https://happymedkz.serveo.net/doctors');
        if (response.status === 200) {
          setDoctors(response.data);
        } else {
          message.error('Failed to fetch doctors.');
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        message.error('An unexpected error occurred.');
      }
    };
    fetchDoctors();
  }, []);

  const handleDoctorChange = (doctorId: number) => {
    const doctor = doctors.find(doc => doc.doctor_id === doctorId) || null;
    setSelectedDoctor(doctor);
    setValue('doctor', doctorId);
  };

  const handleSend = (timeSlot: { day: string; time: string; date: string }) => {
    setSelectedTimeSlot(timeSlot);
    setValue('timeSlot', timeSlot);
  };

  const onSubmit = async (data: FormData) => {
    if (!patientId) {
      message.error('Patient ID not found. Please log in again.');
      return;
    }

    if (!selectedTimeSlot) {
      message.error('Please select a time slot.');
      return;
    }

    const appointmentData = { ...data, patient_id: patientId, timeSlot: selectedTimeSlot };
    navigate('/payment', { state: { appointmentData } });
  };

  return (
    <div className="appointment-container">
      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12}>
          {selectedDoctor && (
            <Button
              ghost
              type="primary"
              onClick={() => {
                setSelectedDoctor(null);
                setValue('doctor', undefined);
              }}
              style={{ marginBottom: '20px' }}
            >
              &larr; Choose Another Doctor
            </Button>
          )}
          <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>Make an Appointment</Title>
          
          <form onSubmit={handleSubmit(onSubmit)} className="appointment-form">
            <Row gutter={[16, 24]}>
              <Col span={24}>
                <Text strong className="form-label">Select a Doctor</Text>
                <Controller
                  name="doctor"
                  control={control}
                  rules={{ required: 'Please choose a doctor' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      showSearch
                      placeholder="Search by specialization or name"
                      optionFilterProp="children"
                      onSelect={handleDoctorChange}
                      filterOption={(input, option) => {
                        const children = Array.isArray(option?.children) 
                          ? option?.children.join('') 
                          : option?.children;
                        return String(children).toLowerCase().includes(input.toLowerCase());
                      }}
                      style={{ width: '100%' }}
                    >
                      {doctors.map((doctor) => (
                        <Option key={doctor.doctor_id} value={doctor.doctor_id}>
                          {doctor.first_name} {doctor.last_name} - {doctor.specialization.spec_name}
                        </Option>
                      ))}
                    </Select>
                  )}
                />
                {errors.doctor && <span className="error-message">{errors.doctor.message}</span>}
              </Col>

              {selectedDoctor && (
                <>
                  <Col span={24}>
                    <Divider />
                    <Title level={4} style={{ marginTop: '0' }}>Doctor's Weekly Schedule</Title>
                    <Text>Select a date and time for your appointment:</Text>
                    <Sender emailOfDoctor={selectedDoctor.email} onSend={handleSend} />
                  </Col>

                  <Col span={24}>
                    <Text strong className="form-label">Type of Appointment</Text>
                    <Controller
                      name="appointmentType"
                      control={control}
                      rules={{ required: 'Please select the type of appointment' }}
                      render={({ field }) => (
                        <Select {...field} placeholder="Select Appointment Type" style={{ width: '100%' }}>
                          <Option value="Consultation">Consultation - 10,000 KZT </Option>
                          <Option value="Cluster Scheduling">Cluster Scheduling 7,000 KZT</Option>
                          <Option value="Follow-Up Visit">Follow-Up Visit 16,000 KZT</Option>
                          <Option value="Routine Check-Up">Routine Check-Up 9,000 KZT</Option>
                          <Option value="Personal Health Assessment">Personal Health Assessment 20,000 KZT</Option>
                        </Select>
                      )}
                    />
                    {errors.appointmentType && <span className="error-message">{errors.appointmentType.message}</span>}
                  </Col>

                  <Col span={24}>
                    <Text strong className="form-label">Description</Text>
                    <Controller
                      name="description"
                      control={control}
                      rules={{ required: 'Please enter a brief description' }}
                      render={({ field }) => (
                        <Input.TextArea
                          {...field}
                          placeholder="Provide additional details about your concerns or what you'd like to discuss..."
                          rows={4}
                        />
                      )}
                    />
                    {errors.description && <span className="error-message">{errors.description.message}</span>}
                  </Col>

                  <Col span={24}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      style={{ width: '100%', marginTop: '20px' }}
                    >
                      Confirm and Proceed to Payment
                    </Button>
                  </Col>
                </>
              )}
            </Row>
          </form>
        </Col>
      </Row>
    </div>
  );
};

export default Appointment;
