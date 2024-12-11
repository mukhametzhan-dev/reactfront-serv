import React, { useState, useEffect } from 'react';
import { List, Typography, message, Row, Col, Button, Modal } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import './Appointments.css';

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
}

export const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingCancellationId, setPendingCancellationId] = useState<number | null>(null);
  const [canceledCount, setCanceledCount] = useState<number>(0);
  const [visibleAppointments, setVisibleAppointments] = useState<number>(5);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setPatientId(parsedUser.patient_id);
        console.log(parsedUser.patient_id);
        // Ensure patient_id is stored in user
        if (parsedUser.patient_id) {
          fetchAppointments(parsedUser.patient_id);
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        message.error('Failed to retrieve user information.');
      }
    } else {
      message.error('User not found. Please log in again.');
    }
  }, []);

  const fetchAppointments = async (patient_id: number) => {
    try {
      const response = await axios.get(
        `https://happymedkz.serveo.net/get_appointments_for_patient_with_id?patient_id=${patient_id}`
      );

      if (response.status === 200) {
        const sortedArr = response.data.appointments.sort((a: Appointment, b: Appointment) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);

          // Compare by date
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime();
          }

          const timeA = a.start_time.split(':').map(Number);
          const timeB = b.start_time.split(':').map(Number);

          const [hourA, minuteA] = timeA;
          const [hourB, minuteB] = timeB;

          if (hourA !== hourB) {
            return hourB - hourA;
          }
          return minuteB - minuteA;
        });

        setAppointments(sortedArr);
      } else {
        message.error('Failed to fetch appointments.');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      message.error('An unexpected error occurred.');
    }
  };

  const getStatusIcon = (status: string, date: string) => {
    const currentDate = new Date();
    const appointmentDate = new Date(date);
    const isPast = appointmentDate < currentDate;

    switch (status) {
      case 'booked':
        return isPast ? (
          <CloseCircleOutlined style={{ color: 'red' }} />
        ) : (
          <ClockCircleOutlined style={{ color: 'orange' }} />
        );
      case 'completed':
        return <CheckCircleOutlined style={{ color: 'green' }} />;
      case 'canceled':
        return <ExclamationCircleOutlined style={{ color: 'red' }} />;
      default:
        return null;
    }
  };

  const canCancelAppointment = (appointmentDate: string, appointmentTime: string) => {
    const currentDate = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const timeDifference = (appointmentDateTime.getTime() - currentDate.getTime()) / (1000 * 60 * 60); // Difference in hours
    return timeDifference >= 2;
  };

  const handleCancelClick = async (appointmentId: number) => {
    console.log(patientId);
    // Before cancelling, check the canceled appointments count for the patient.
    if (!patientId) {
      message.error('Patient ID not found.');
      return;
    }

    try {
      const countResponse = await axios.get(`https://happymedkz.serveo.net/count_canceled_appointments?patient_id=${patientId}`);
      console.log(countResponse.data);
      const canceledAppointmentsCount = countResponse.data.canceled_appointments_count;
      if (canceledAppointmentsCount >= 3) {
        // Show modal warning about penalty
        setCanceledCount(canceledAppointmentsCount);
        setPendingCancellationId(appointmentId);
        setIsModalVisible(true);
      } else {
        // Cancel directly
        handleCancel(appointmentId);
      }
    } catch (error) {
      console.error('Error fetching canceled appointments count:', error);
      message.error('Unable to check canceled appointments count.');
    }
  };

  const handleCancel = async (appointmentId: number) => {
    try {
      const response = await axios.post(`https://happymedkz.serveo.net/cancel`, { appointment_id: appointmentId });
      if (response.status === 200) {
        message.success('Appointment cancelled successfully.');
        if (patientId) {
          fetchAppointments(patientId);
        }
      } else {
        message.error('Failed to cancel appointment.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      message.error('An unexpected error occurred.');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setPendingCancellationId(null);
  };

  const handleModalConfirm = () => {
    // User accepted the penalty, proceed with cancellation
    if (pendingCancellationId) {
      handleCancel(pendingCancellationId);
    }
    setIsModalVisible(false);
    setPendingCancellationId(null);
  };

  const handleShowMore = () => {
    setVisibleAppointments(visibleAppointments + 5);
  };

  return (
    <Row justify="center" style={{ padding: '50px' }}>
      <Col xs={24} sm={20} md={16} lg={12}>
        <Title level={2}>My Appointments</Title>
        <List
          itemLayout="horizontal"
          dataSource={appointments.slice(0, visibleAppointments)}
          renderItem={(appointment) => (
            <List.Item
              actions={[
                canCancelAppointment(appointment.date, appointment.start_time) && appointment.status === 'booked' ? (
                  <Button type="link" danger onClick={() => handleCancelClick(appointment.appointment_id)}>
                    CANCEL
                  </Button>
                ) : null,
              ]}
            >
              <List.Item.Meta
                avatar={getStatusIcon(appointment.status, appointment.date)}
                title={`${appointment.day_of_week}, ${appointment.date}`}
                description={
                  <>
                    <Text strong>Time:</Text> {appointment.start_time} - {appointment.end_time}
                    <br />
                    <Text strong>Description:</Text> {appointment.description}
                    <br />
                    <Text strong>Status:</Text> {appointment.status}
                  </>
                }
              />
            </List.Item>
          )}
        />
        {visibleAppointments < appointments.length && (
          <Button type="primary" onClick={handleShowMore} style={{ marginTop: '20px' }}>
            Show More
          </Button>
        )}

        <Modal
          title="Cancellation Warning"
          visible={isModalVisible}
          onCancel={handleModalCancel}
          footer={[
            <Button key="back" onClick={handleModalCancel}>
              Back
            </Button>,
            <Button key="confirm" type="primary" danger onClick={handleModalConfirm}>
              Cancel Appointment
            </Button>,
          ]}
        >
          <p>Our system has noticed that you have {canceledCount} appointments canceled previously. If you cancel this one, it will be counted with a penalty of -30% of the booking payment.</p>
          <p>Do you still want to proceed?</p>
        </Modal>
      </Col>
    </Row>
  );
};

export default Appointments;
