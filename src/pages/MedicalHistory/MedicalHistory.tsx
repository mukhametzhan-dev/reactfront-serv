import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Row, Col, Card, Typography, List, Button } from 'antd';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import './MedicalHistory.css';

const { Title, Text } = Typography;

interface Appointment {
  date: string;
  status: string;
  end_time: string;
  start_time: string;
  day_of_week: string;
  description: string;
  appointment_id: number;
  doctor_name: string;
  specialization: string;
}

const MedicalHistory = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showStatistics, setShowStatistics] = useState(false);

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
          setAppointments(response.data);
        } else {
          console.error('Failed to fetch medical history.');
        }
      } catch (error) {
        console.error('Error fetching medical history:', error);
      }
    }
  };

  const fetchAppointments = async (userId: number) => {
    try {
      console.log(userId);
      const response = await axios.get(`http://localhost:5000/get_appointments_for_patient_with_id?patient_id=${userId}`);
      if (response.status === 200) {
        setAppointments(response.data.appointments);
      } else {
        console.error('Failed to fetch appointments.');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleShowStatistics = () => {
    const storedUser = localStorage.getItem('user');
    console.log(storedUser);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!showStatistics) {
          fetchAppointments(parsedUser.patient_id);
        } else {
          fetchMedicalHistory();
        }
        setShowStatistics(!showStatistics);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
  };

  const appointmentCounts = appointments.reduce(
    (acc, appointment) => {
      if (appointment.status === 'completed') {
        acc.completed += 1;
      } else if (appointment.status === 'canceled') {
        acc.canceled += 1;
      } else if (appointment.status === 'booked') {
        acc.booked += 1;
      }
      return acc;
    },
    { completed: 0, canceled: 0, booked: 0 }
  );

  const data = [
    { name: 'Completed', value: appointmentCounts.completed, color: 'green' },
    { name: 'Canceled', value: appointmentCounts.canceled, color: 'red' },
    { name: 'Booked',  value: appointmentCounts.booked, color: 'orange' },
  ];

  return (
    <Row justify="center" className="medical-history-container">
      <Col xs={24} sm={20} md={16} lg={12}>
        <Title level={2}>Medical History</Title>
        <Button type="primary" onClick={handleShowStatistics}>
          {showStatistics ? 'Hide Statistics' : 'Show Statistics'}
        </Button>
        {showStatistics ? (
          <Card className="statistics-card">
            <Title level={4}>Appointment Statistics</Title>
            <PieChart width={400} height={400}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#8884d8"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </Card>
        ) : (
          appointments.length > 0 && (
            <Card className="medical-history-card">
              <Title level={4}>Appointments</Title>
              <List
                itemLayout="vertical"
                dataSource={appointments}
                renderItem={(appointment) => (
                  <List.Item key={appointment.appointment_id}>
                    <Card className="appointment-card">
                      <Text className="appointment-text"><strong>Date:</strong> {appointment.date}</Text>
                      <Text className="appointment-text"><strong>Status:</strong> {appointment.status}</Text>
                      <Text className="appointment-text"><strong>Time:</strong> {appointment.start_time} - {appointment.end_time}</Text>
                      <Text className="appointment-text"><strong>Day of Week:</strong> {appointment.day_of_week}</Text>
                      <Text className="appointment-text"><strong>Description:</strong> {appointment.description}</Text>
                      <Text className='appointment-text'><strong>Doctor :</strong> {appointment.doctor_name}</Text>
                      <Text className='appointment-text'><strong>Specialization :</strong> {appointment.specialization}</Text>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          )
        )}
      </Col>
    </Row>
  );
};

export default MedicalHistory;