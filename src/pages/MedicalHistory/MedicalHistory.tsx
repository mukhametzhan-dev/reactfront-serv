import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, List, Button, Modal, Form, Input, message } from 'antd';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { CheckCircleFilled, ClockCircleOutlined, ExclamationCircleOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
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

interface CompletionData {
  diagnosis: string;
  feedback: string;
}

const MedicalHistory: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showStatistics, setShowStatistics] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMedicalHistory();
  }, []);

  const fetchMedicalHistory = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const response = await axios.get(`https://happymedkz.serveo.net/get_medhistory`, {
          params: { email: parsedUser.email },
        });
        if (response.status === 200) {
          console.log(response.data);
          setAppointments(response.data);
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

  const fetchAppointments = async (userId: number) => {
    try {
      console.log(userId);
      const response = await axios.get(`https://happymedkz.serveo.net/get_appointments_for_patient_with_id?patient_id=${userId}`);
      if (response.status === 200) {
        setAppointments(response.data.appointments);
      } else {
        console.error('Failed to fetch appointments.');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      message.error('An unexpected error occurred while fetching appointments.');
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

  const handleCompleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalVisible(true);
  };

  const handleCompleteAppointment = async (values: CompletionData) => {
    if (!selectedAppointment) return;

    try {
      const response = await axios.post(`https://happymedkz.serveo.net/complete_appointment`, {
        appointment_id: selectedAppointment.appointment_id,
        diagnosis: values.diagnosis,
        feedback: values.feedback,
      });
      if (response.status === 200) {
        message.success('Appointment completed successfully.');
        setIsModalVisible(false);
        form.resetFields();
        fetchMedicalHistory();
      } else {
        message.error('Failed to complete appointment.');
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      message.error('An unexpected error occurred while completing the appointment.');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedAppointment(null);
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
    { name: 'Completed', value: appointmentCounts.completed, color: '#52c41a' },
    { name: 'Canceled', value: appointmentCounts.canceled, color: '#f5222d' },
    { name: 'Booked', value: appointmentCounts.booked, color: '#fa8c16' },
  ];

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

  const columns = [
    {
      title: 'Patient Name',
      dataIndex: 'patient_name',
      key: 'patient_name',
      sorter: (a: Appointment, b: Appointment) => a.patient_name.localeCompare(b.patient_name),
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: Appointment, b: Appointment) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (text: string) => dayjs(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      render: (_: any, record: Appointment) => `${record.start_time} - ${record.end_time}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'Upcoming', value: 'upcoming' },
        { text: 'Past', value: 'past' },
      ],
      onFilter: (value: string | number | boolean, record: Appointment) => {
        const now = dayjs();
        const appointmentDate = dayjs(record.date);
        if (value === 'completed') return record.status.toLowerCase() === 'completed';
        if (value === 'upcoming') return appointmentDate.isAfter(now, 'day');
        if (value === 'past') return appointmentDate.isBefore(now, 'day') && record.status.toLowerCase() !== 'completed';
        return false;
      },
      render: (text: string, record: Appointment) => {
        const now = dayjs();
        const isUpcoming = dayjs(record.date).isAfter(now, 'day');
        if (record.status.toLowerCase() === 'completed') {
          return <span className="status-completed">Completed</span>;
        } else if (isUpcoming) {
          return <span className="status-upcoming">Upcoming</span>;
        } else {
          return <span className="status-past">Past</span>;
        }
      },
    },
    {
      title: 'Diagnosis',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      render: (text: string) => text ? (
        <div className="diagnosis-feedback">
          <InfoCircleOutlined className="info-icon" />
          <Text>{text}</Text>
        </div>
      ) : 'N/A',
    },
    {
      title: 'Feedback',
      dataIndex: 'feedback',
      key: 'feedback',
      render: (text: string) => text ? (
        <div className="diagnosis-feedback">
          <InfoCircleOutlined className="info-icon" />
          <Text>{text}</Text>
        </div>
      ) : 'N/A',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Appointment) => {
        const now = dayjs();
        const appointmentDate = dayjs(record.date);
        const startTime = dayjs(`${record.date}T${record.start_time}`);
        const endTime = dayjs(`${record.date}T${record.end_time}`);
        const isCurrent = now.isSame(appointmentDate, 'day') && now.isBetween(startTime, endTime);

        return (
          <Button
            type="primary"
            disabled={record.status.toLowerCase() === 'completed'}
            onClick={() => handleCompleteClick(record)}
            className="complete-button"
          >
            Complete
          </Button>
        );
      },
    },
  ];

  return (
    <Row justify="center" className="medical-history-container">
      <Col xs={24} sm={22} md={20} lg={16}>
        <Title level={2} className="appointments-title">Medical History</Title>
        <Button 
          type="primary" 
          onClick={handleShowStatistics} 
          className="statistics-button"
        >
          {showStatistics ? 'Hide Statistics' : 'Show Statistics'}
        </Button>
        {showStatistics ? (
          <Card className="statistics-card">
            <Title level={4} className="statistics-title">Appointment Statistics</Title>
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
              <Title level={4} className="card-title">Appointments</Title>
              <List
                itemLayout="vertical"
                dataSource={appointments}
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
                        <Col span={24} className="action-col">
                          {appointment.status.toLowerCase() !== 'completed' && (
                            <Button 
                              type="primary" 
                              onClick={() => handleCompleteClick(appointment)}
                              className="complete-button"
                              icon={<EditOutlined />}
                            >
                              Complete
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          )
        )}
      </Col>

      {/* Completion Modal */}
      <Modal
        title="Complete Appointment"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        centered
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCompleteAppointment}
          className="completion-form"
        >
          <Form.Item
            label="Diagnosis"
            name="diagnosis"
            rules={[{ required: true, message: 'Please enter the diagnosis.' }]}
          >
            <Input.TextArea placeholder="Enter diagnosis" rows={3} />
          </Form.Item>

          <Form.Item
            label="Feedback"
            name="feedback"
            rules={[{ required: true, message: 'Please enter the feedback.' }]}
          >
            <Input.TextArea placeholder="Enter feedback" rows={3} />
          </Form.Item>

          <Form.Item>
            <div className="modal-buttons">
              <Button onClick={handleCancel} className="cancel-button">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" className="submit-button">
                Submit
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default MedicalHistory;
