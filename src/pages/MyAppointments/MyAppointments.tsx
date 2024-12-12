import React, { useState, useEffect } from 'react';
import { Table, Button, message, Typography, Modal, Form, Input } from 'antd';
import { CheckCircleFilled, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import './MyAppointments.css';

dayjs.extend(isBetween);

const { Title } = Typography;

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
  appointment_type: string; // Added
}

interface CompletionData {
  diagnosis: string;
  feedback: string;
}

export const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorEmail, setDoctorEmail] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setDoctorEmail(parsedUser.email);
        fetchAppointments(parsedUser.email);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        message.error('Failed to retrieve user information.');
      }
    } else {
      message.error('User not found. Please log in again.');
    }
  }, []);

  const fetchAppointments = async (email: string) => {
    try {
      const response = await axios.get(`https://apihappymed.serveo.net/get_appointments_for_doctor?email=${email}`);
      if (response.status === 200) {
        console.log(response.data.appointments);
        setAppointments(response.data.appointments);
      } else {
        message.error('Failed to fetch appointments.');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      message.error('An unexpected error occurred.');
    }
  };

  const showCompletionModal = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setIsModalVisible(true);
  };

  const handleCompleteAppointment = async (values: CompletionData) => {
    if (!selectedAppointmentId) return;

    try {
      const response = await axios.post(`https://apihappymed.serveo.net/complete_appointment`, {
        appointment_id: selectedAppointmentId,
        diagnosis: values.diagnosis,
        feedback: values.feedback,
      });
      if (response.status === 200) {
        message.success('Appointment completed successfully.');
        setIsModalVisible(false);
        form.resetFields();
        fetchAppointments(doctorEmail!);
      } else {
        message.error('Failed to complete appointment.');
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      message.error('An unexpected error occurred.');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedAppointmentId(null);
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
      title: 'Type of Appointment',
      dataIndex: 'appointment_type',
      key: 'appointment_type',
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <span>{text}</span>,
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
            onClick={() => showCompletionModal(record.appointment_id)}
            className="complete-button"
          >
            Complete
          </Button>
        );
      },
    },
  ];

  return (
    <div className="my-appointments">
      <Title level={2} className="appointments-title">My Appointments</Title>
      <Table 
        columns={columns} 
        dataSource={appointments} 
        rowKey="appointment_id" 
        pagination={{ pageSize: 5 }} 
        className="appointments-table"
      />

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
    </div>
  );
};

export default MyAppointments;
