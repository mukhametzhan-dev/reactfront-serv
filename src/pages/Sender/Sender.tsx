import React, { useState } from 'react';
import { Button, Typography } from 'antd';
import WeeklySchedule from '../WeeklySchedule/WeeklySchedule';

const { Title, Text } = Typography;

interface SenderComponentProps {
  emailOfDoctor?: string;
  onSend: (timeSlot: { day: string; time: string; date: string }) => void;
}

const Sender: React.FC<SenderComponentProps> = ({ emailOfDoctor, onSend }) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: string; time: string; date: string } | null>(null);

  const handleTimeSlotSelect = (timeSlot: { day: string; time: string; date: string }) => {
    setSelectedTimeSlot(timeSlot);
    if (selectedTimeSlot) {
      onSend(selectedTimeSlot);
    }
  };
  const handleRemove = () => {
    setSelectedTimeSlot(null);
  };
  return (
    <div>
      <Title level={5}>Please select a convenient time</Title>
      <WeeklySchedule
        emailOfDoctor={emailOfDoctor}
        onTimeSlotSelect={handleTimeSlotSelect}
        selectedTimeSlotbyPatient={selectedTimeSlot}
      />
      {selectedTimeSlot && (
        <div>
          <Title level={4}>Selected Time Slot</Title>
          <Text strong>Day:</Text> {selectedTimeSlot.day}
          <br />
          <Text strong>Time:</Text> {selectedTimeSlot.time}
          <br />
          <Text strong>Date:</Text> {selectedTimeSlot.date}
          <br />
        </div>
      )}
    </div>
  );
};

export default Sender;