import React, { useState, useEffect } from 'react';
import {
  List,
  Typography,
  message,
  Row,
  Col,
  Button,
  Modal,
  Select,
  DatePicker,
  Space,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './Appointments.css';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Appointment {
  appointment_id: number;
  date: string;
  day_of_week: string;
  description: string;
  doctor_id: number;
  end_time: string;
  start_time: string;
  status: string;
  doctor_name: string;
  appointment_type: string;
}

export const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingCancellationId, setPendingCancellationId] = useState<number | null>(null);
  const [canceledCount, setCanceledCount] = useState<number>(0);
  const [visibleAppointments, setVisibleAppointments] = useState<number>(5);

  // Filter states
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setPatientId(parsedUser.patient_id);
        console.log(parsedUser.patient_id);
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

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, selectedDate, selectedDoctor, selectedStatus]);

  const fetchAppointments = async (patient_id: number) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/get_appointments_for_patient_with_id?patient_id=${patient_id}`
      );

      if (response.status === 200) {
        const sortedArr = response.data.appointments.sort((a: Appointment, b: Appointment) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);

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
        setFilteredAppointments(sortedArr);
      } else {
        message.error('Failed to fetch appointments.');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      message.error('An unexpected error occurred.');
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    if (selectedDate) {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      filtered = filtered.filter((appt) => appt.date === dateStr);
    }

    if (selectedDoctor) {
      filtered = filtered.filter((appt) => appt.doctor_name === selectedDoctor);
    }

    if (selectedStatus) {
      filtered = filtered.filter((appt) => appt.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    setFilteredAppointments(filtered);
    setVisibleAppointments(5); // Reset visible appointments on filter change
  };

  const getStatusIcon = (status: string, date: string) => {
    const currentDate = new Date();
    const appointmentDate = new Date(date);
    const isPast = appointmentDate < currentDate;

    switch (status.toLowerCase()) {
      case 'booked':
        return isPast ? (
          <CloseCircleOutlined className="status-icon red" />
        ) : (
          <ClockCircleOutlined className="status-icon orange" />
        );
      case 'completed':
        return <CheckCircleOutlined className="status-icon green" />;
      case 'canceled':
        return <ExclamationCircleOutlined className="status-icon red" />;
      default:
        return null;
    }
  };

  const canCancelAppointment = (appointmentDate: string, appointmentTime: string) => {
    const currentDate = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const timeDifference = (appointmentDateTime.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
    return timeDifference >= 2;
  };

  const handleCancelClick = async (appointmentId: number) => {
    console.log(patientId);
    if (!patientId) {
      message.error('Patient ID not found.');
      return;
    }

    try {
      const countResponse = await axios.get(
        `http://localhost:5000/count_canceled_appointments?patient_id=${patientId}`
      );
      console.log(countResponse.data);
      const canceledAppointmentsCount = countResponse.data.canceled_appointments_count;
      if (canceledAppointmentsCount >= 3) {
        setCanceledCount(canceledAppointmentsCount);
        setPendingCancellationId(appointmentId);
        setIsModalVisible(true);
      } else {
        handleCancel(appointmentId);
      }
    } catch (error) {
      console.error('Error fetching canceled appointments count:', error);
      message.error('Unable to check canceled appointments count.');
    }
  };

  const handleCancel = async (appointmentId: number) => {
    try {
      const response = await axios.post(`http://localhost:5000/cancel`, { appointment_id: appointmentId });
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
    if (pendingCancellationId) {
      handleCancel(pendingCancellationId);
    }
    setIsModalVisible(false);
    setPendingCancellationId(null);
  };

  const handleShowMore = () => {
    setVisibleAppointments(visibleAppointments + 5);
  };

  const handleFeedback = (appointmentId: number) => {
    // Implement feedback functionality here
    message.info(`Feedback for appointment ID: ${appointmentId}`);
  };

  // Extract unique doctors for the filter
  const uniqueDoctors = Array.from(new Set(appointments.map((appt) => appt.doctor_name)));

  return (
    <Row justify="center" className="appointments-container">
      <Col xs={24} sm={22} md={20} lg={16}>
        <div className="appointments-header">
          <Title level={2} className="appointments-title">
            My Appointments
          </Title>
          <div className="filters">
            <Space wrap>
              <DatePicker
                onChange={(date) => setSelectedDate(date)}
                placeholder="Select Date"
                allowClear
              />
              <Select
                allowClear
                style={{ width: 200 }}
                placeholder="Select Doctor"
                onChange={(value) => setSelectedDoctor(value)}
              >
                {uniqueDoctors.map((doctor) => (
                  <Option key={doctor} value={doctor}>
                    {doctor}
                  </Option>
                ))}
              </Select>
              <Select
                allowClear
                style={{ width: 150 }}
                placeholder="Select Status"
                onChange={(value) => setSelectedStatus(value)}
              >
                <Option value="booked">Booked</Option>
                <Option value="completed">Completed</Option>
                <Option value="canceled">Canceled</Option>
              </Select>
              <Button
                type="primary"
                onClick={applyFilters}
                disabled={!selectedDate && !selectedDoctor && !selectedStatus}
              >
                Apply Filters
              </Button>
              <Button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedDoctor('');
                  setSelectedStatus('');
                  setFilteredAppointments(appointments);
                }}
              >
                Reset
              </Button>
            </Space>
          </div>
        </div>
        <List
          className="appointments-list"
          itemLayout="vertical"
          dataSource={filteredAppointments.slice(0, visibleAppointments)}
          renderItem={(appointment) => (
            <List.Item
              key={appointment.appointment_id}
              className="appointment-item"
              actions={[
                appointment.status.toLowerCase() === 'booked' &&
                canCancelAppointment(appointment.date, appointment.start_time) ? (
                  <Button
                    type="primary"
                    danger
                    onClick={() => handleCancelClick(appointment.appointment_id)}
                    className="cancel-button"
                  >
                    CANCEL
                  </Button>
                ) : null,
                appointment.status.toLowerCase() === 'completed' ? (
                  <Button
                    type="default"
                    onClick={() => handleFeedback(appointment.appointment_id)}
                    className="feedback-button"
                  >
                    Feedback
                  </Button>
                ) : null,
              ]}
            >
              <List.Item.Meta
                avatar={getStatusIcon(appointment.status, appointment.date)}
                title={
                  <div className="appointment-title">
                    <span>{`${appointment.day_of_week}, ${appointment.date}`}</span>
                  </div>
                }
                description={
                  <div className="appointment-details">
                    <Text>
                      <strong>Time:</strong> {appointment.start_time} - {appointment.end_time}
                    </Text>
                    <br />
                    <Text>
                      <strong>Doctor:</strong> {appointment.doctor_name}
                    </Text>
                    <br />
                    <Text>
                      <strong>Type:</strong> {appointment.appointment_type}
                    </Text>
                    <br />
                    <Text>
                      <strong>Description:</strong> {appointment.description}
                    </Text>
                    <br />
                    <Text>
                      <strong>Status:</strong> {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
        {visibleAppointments < filteredAppointments.length && (
          <div className="show-more-container">
            <Button type="primary" onClick={handleShowMore}>
              Show More
            </Button>
          </div>
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
          <p>
            Our system has noticed that you have {canceledCount} appointments canceled previously.
            If you cancel this one, it will be counted with a penalty of -30% of the booking payment.
          </p>
          <p>Do you still want to proceed?</p>
        </Modal>
      </Col>
    </Row>
  );
};

export default Appointments;
