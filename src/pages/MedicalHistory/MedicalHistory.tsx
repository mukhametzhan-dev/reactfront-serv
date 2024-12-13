import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, List, message } from 'antd';
import { CheckCircleFilled, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import './MedicalHistory.css';

dayjs.extend(isBetween);

const { Title, Text } = Typography;

interface Appointment {
  appointment_id: number;
  date: string;
  day_of_week: string;
  description: string;
  doctor_id: number;
  end_time: string;
  start_time: string;
  status: string;
  patient_name: string;
  doctor_name: string;
  specialization: string;
  diagnosis: string;
  feedback: string;
}

const MedicalHistory: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchMedicalHistory();
  }, []);

  const fetchMedicalHistory = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const response = await axios.get(`http://127.0.0.1:5000/get_medhistory`, {
          params: { email: parsedUser.email },
        });
        if (response.status === 200) {
          console.log(response.data);
          setAppointments(response.data.appointments); // Ensure this line correctly sets the appointments
        } else {
          message.error('Failed to fetch medical history.');
        }
      } catch (error) {
        console.error('Error fetching medical history:', error);
        message.error('An unexpected error occurred while fetching medical history.');
      }
    } else {
      message.error('User not found. Please log in again.');
    }
  };

  const getStatusIcon = (status: string, appointmentDate: string) => {
    const now = dayjs();
    const isUpcoming = dayjs(appointmentDate).isAfter(now, 'day');

    if (status.toLowerCase() === 'completed') {
      return <CheckCircleFilled className="status-icon completed" />;
    } else if (isUpcoming) {
      return <ClockCircleOutlined className="status-icon upcoming" />;
    } else {
      return <ExclamationCircleOutlined className="status-icon past" />;
    }
  };

  return (
    <Row justify="center" className="medical-history-container">
      <Col xs={24} sm={22} md={20} lg={16}>
        <Title level={2} className="appointments-title">Medical History</Title>
        {appointments.length > 0 && (
          <Card className="medical-history-card">
            {/* <Title level={4} className="card-title">Appointments</Title> */}
            <List
              itemLayout="vertical"
              dataSource={appointments.filter(appointment => appointment.status.toLowerCase() === 'completed')}
              renderItem={(appointment) => (
                <List.Item key={appointment.appointment_id}>
                  <Card className="appointment-card">
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <div className="appointment-header">
                          {getStatusIcon(appointment.status, appointment.date)}
                          <Title level={5} className="appointment-date">
                            {dayjs(appointment.date).format('DD/MM/YYYY')} - {appointment.day_of_week}
                          </Title>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text><strong>Time:</strong> {appointment.start_time} - {appointment.end_time}</Text>
                        <br />
                        <Text><strong>Doctor:</strong> {appointment.doctor_name}</Text>
                        <br />
                        <Text><strong>Specialization:</strong> {appointment.specialization}</Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text><strong>Description:</strong> {appointment.description}</Text>
                        <br />
                        <Text><strong>Diagnosis:</strong> {appointment.diagnosis || 'N/A'}</Text>
                        <br />
                        <Text><strong>Feedback:</strong> {appointment.feedback || 'N/A'}</Text>
                      </Col>
                    </Row>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        )}
      </Col>
    </Row>
  );
};

export default MedicalHistory;