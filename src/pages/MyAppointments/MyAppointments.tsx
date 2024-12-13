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
  appointment_type: string;
  feedback?: string;
  diagnosis?: string;
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
  const [isCancelModalVisible, setIsCancelModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [cancelReason, setCancelReason] = useState<string>('');

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
      const response = await axios.get(`https://happymed.work.gd/get_appointments_for_doctor?email=${email}`);
      if (response.status === 200) {
        setAppointments(response.data.appointments);
      } else {
        message.error('Failed to fetch appointments.');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      message.error('An unexpected error occurred.');
    }
  };

  const handleCompleteAppointment = async (values: CompletionData) => {
    if (!selectedAppointmentId) return;

    try {
      const response = await axios.put(`https://happymed.work.gd/${selectedAppointmentId}`, {
        feedback: values.feedback,
        diagnosis: values.diagnosis,
      });
      if (response.status === 200) {
        message.success('Appointment updated successfully.');
        setIsModalVisible(false);
        form.resetFields();
        fetchAppointments(doctorEmail!);
      } else {
        message.error('Failed to update appointment.');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      message.error('An unexpected error occurred.');
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointmentId) return;

    try {
      const response = await axios.post('https://happymed.work.gd/cancel_appointment_by_doctor', {
        appointment_id: selectedAppointmentId,
        cause: cancelReason,
      });
      if (response.status === 200) {
        message.success('Appointment cancelled successfully.');
        setIsCancelModalVisible(false);
        fetchAppointments(doctorEmail!);
      } else {
        message.error('Failed to cancel appointment.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      message.error('An unexpected error occurred.');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsCancelModalVisible(false);
    form.resetFields();
    setSelectedAppointmentId(null);
    setCancelReason('');
  };

  const showCancelModal = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setIsCancelModalVisible(true);
  };

  const showCompletionModal = async (appointmentId: number) => {
    try {
      setSelectedAppointmentId(appointmentId);
  
      // Fetch diagnosis and feedback
      const response = await axios.get(`https://happymed.work.gd/feedback/${appointmentId}`);
      if (response.status === 200) {
        const { diagnosis, feedback } = response.data;
  
        // Set form fields with fetched data
        form.setFieldsValue({
          diagnosis: diagnosis || '',
          feedback: feedback || '',
        });
      } else {
        message.error('Failed to fetch appointment details.');
      }
  
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      message.error('An unexpected error occurred while fetching appointment details.');
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
        } else if (record.status.toLowerCase() === 'canceled' || record.status.toLowerCase() === 'canceled by doctor') {
          return <span className="status-canceled">Canceled</span>;
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
        const isUpcoming = record.status.toLowerCase() === 'booked'; // Assuming 'booked' is for upcoming appointments
        const isCompleted = record.status.toLowerCase() === 'completed';
        const isCanceled = record.status.toLowerCase() === 'canceled' || record.status.toLowerCase() === 'canceled by doctor';
    
        return (
          <>
            {isUpcoming && !isCanceled ? (
              <>
                <Button danger onClick={() => showCancelModal(record.appointment_id)}>
                  Cancel
                </Button>
                <Button type="primary" onClick={() => showCompletionModal(record.appointment_id)} style={{ marginLeft: 8 }}>
                  Complete
                </Button>
              </>
            ) : isCompleted && !isCanceled ? (
              <Button type="primary" onClick={() => showCompletionModal(record.appointment_id)}>
                Modify
              </Button>
            ) : null}
    
            {isCanceled && <span>Canceled</span>}
          </>
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
      />
      <Modal
        title="Modify Appointment"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleCompleteAppointment}>
          <Form.Item name="diagnosis" label="Diagnosis">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="feedback" label="Feedback">
            <Input.TextArea />
          </Form.Item>
          <Button type="primary" htmlType="submit">Save</Button>
        </Form>
      </Modal>
      <Modal
        title="Cancel Appointment"
        visible={isCancelModalVisible}
        onCancel={handleCancel}
        onOk={handleCancelAppointment}
        okText="Confirm"
      >
        <Input.TextArea
          placeholder="Please provide a reason for cancellation"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};
export default MyAppointments;
