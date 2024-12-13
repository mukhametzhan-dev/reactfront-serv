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
  canceled_by_doctor_cause?: string;
  diagnosis?: string;
  feedback?: string;
}

export const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingCancellationId, setPendingCancellationId] = useState<number | null>(null);
  const [canceledCount, setCanceledCount] = useState<number>(0);
  const [visibleAppointments, setVisibleAppointments] = useState<number>(5);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<{ diagnosis?: string; feedback?: string; canceled_by_doctor_cause?: string }>({});

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
  }, [appointments, selectedDate, selectedDoctor, selectedStatus]);

  const fetchAppointments = async (patient_id: number) => {
    try {
      const response = await axios.get(
        `https://happymed.work.gd/get_appointments_for_patient_with_id?patient_id=${patient_id}`
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

  const handleCancelClick = async (appointmentId: number) => {
    if (!patientId) {
      message.error('Patient ID not found.');
      return;
    }

    try {
      const countResponse = await axios.get(
        `https://happymed.work.gd/count_canceled_appointments?patient_id=${patientId}`
      );
      const canceledAppointmentsCount = countResponse.data.canceled_appointments_count;
      if (canceledAppointmentsCount >= 3) {
        setCanceledCount(canceledAppointmentsCount);
        setPendingCancellationId(appointmentId);
        setIsModalVisible(true);
        localStorage.setItem('cancellationRestriction', 'true'); // Store in localStorage
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
      const response = await axios.post(`https://happymed.work.gd/cancel`, { appointment_id: appointmentId });
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

  const fetchFeedbackAndDiagnosis = async (appointmentId: number) => {
    try {
      const response = await axios.get(`https://happymed.work.gd/feedback/${appointmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback and diagnosis:', error);
      return { feedback: 'No information available.', diagnosis: 'No information available.' };
    }
  };

  const fetchCancellationCause = async (appointmentId: number) => {
    try {
      const response = await axios.get(`https://happymed.work.gd/cause/${appointmentId}`);
      return response.data.cause;
    } catch (error) {
      console.error('Error fetching cancellation cause:', error);
      return 'No information available.';
    }
  };

  const handleAppointmentClick = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    if (appointment.status === 'completed') {
      const details = await fetchFeedbackAndDiagnosis(appointment.appointment_id);
      setAppointmentDetails(details);
    } else if (appointment.status === 'canceled') {
      const cause = await fetchCancellationCause(appointment.appointment_id);
      setAppointmentDetails({ canceled_by_doctor_cause: cause });
    }
  };

  // Extract unique doctors for the filter
  const uniqueDoctors = Array.from(new Set(appointments.map((appt) => appt.doctor_name)));

  const canCancelAppointment = (appointmentDate: string, appointmentTime: string) => {
    const currentDate = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const timeDifference = (appointmentDateTime.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
    return timeDifference >= 2;
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <>
            <CheckCircleOutlined style={{ color: 'green' }} /> Completed
          </>
        );
      case 'booked':
        return (
          <>
            <ClockCircleOutlined style={{ color: 'blue' }} /> Booked
          </>
        );
      case 'canceled':
        return (
          <>
            <CloseCircleOutlined style={{ color: 'red' }} /> Canceled
          </>
        );
      default:
        return status;
    }
  };

  return (
    <Row justify="center" className="appointments-container">
      <Col xs={24} sm={22} md={20} lg={16}>
        <div className="appointments-header">
          <Title level={2} className="appointments-title">
            My Appointments
          </Title>
          {canceledCount >= 3 && (
            <Text type="warning" className="cancel-warning">
              You have canceled {canceledCount} appointments. You cannot cancel any further appointments at this time.
            </Text>
          )}
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
                style={{ width: 200 }}
                placeholder="Select Status"
                onChange={(value) => setSelectedStatus(value)}
              >
                <Option value="booked">Booked</Option>
                <Option value="completed">Completed</Option>
                <Option value="canceled">Canceled</Option>
              </Select>
              <Button onClick={() => setFilteredAppointments(appointments)} style={{ marginTop: '-1px'}}>Clear Filters</Button>
            </Space>
          </div>
        </div>

        <List
          itemLayout="horizontal"
          dataSource={filteredAppointments.slice(0, visibleAppointments)}
          renderItem={(appointment) => (
            <List.Item
              actions={[
                appointment.status === 'booked' &&
                canCancelAppointment(appointment.date, appointment.start_time) ? (
                  <Button
                    type="primary"
                    danger
                    onClick={() => handleCancelClick(appointment.appointment_id)}
                    disabled={canceledCount >= 3}
                  >
                    Cancel Appointment
                  </Button>
                ) : null,
              ]}
              onClick={() => handleAppointmentClick(appointment)}
            >
              <List.Item.Meta
                title={`${appointment.doctor_name} - ${appointment.date} ${appointment.start_time} - ${appointment.day_of_week}`}
                description={
                  <>
                    {appointment.description} - {getStatusText(appointment.status)}
                  </>
                }
              />
            </List.Item>
          )}
        />

        {filteredAppointments.length > visibleAppointments && (
          <Button type="link" onClick={handleShowMore}>
            Show More
          </Button>
        )}

        {selectedAppointment && (
          <Modal
            title="Appointment Details"
            visible={true}
            onCancel={() => setSelectedAppointment(null)}
            footer={null}
          >
            <div>
              <p>
                <strong>Doctor's Name:</strong> {selectedAppointment.doctor_name}
              </p>
              <p>
                <strong>Appointment Type:</strong> {selectedAppointment.appointment_type}
              </p>
              <p>
                <strong>Status:</strong> {getStatusText(selectedAppointment.status)}
              </p>
              {selectedAppointment.status === 'completed' && (
                <div>
                  <h3>Diagnosis/Feedback:</h3>
                  <p>{appointmentDetails.diagnosis}</p>
                  <p>{appointmentDetails.feedback}</p>
                </div>
              )}
              {selectedAppointment.status === 'canceled' && (
                <div>
                  <h3>Cancellation Cause:</h3>
                  <p>{appointmentDetails.canceled_by_doctor_cause}</p>
                </div>
              )}
            </div>
          </Modal>
        )}

        <Modal
          title="Cancel Appointment"
          visible={isModalVisible}
          onOk={handleModalConfirm}
          onCancel={handleModalCancel}
          okText="Confirm"
          cancelText="Cancel"
        >
          <ExclamationCircleOutlined /> You have canceled 3 or more appointments. Do you want to cancel this one?
        </Modal>
      </Col>
    </Row>
  );
};
