// Sender.tsx

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
    if (timeSlot) {
      onSend(timeSlot);
    }
  };

  const handleRemove = () => {
    setSelectedTimeSlot(null);
  };

  return (
    <div className="sender-container" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' , }}>
      <div className="left-container">
        {/* <Title level={5}>Please select a convenient time</Title> */}
        <WeeklySchedule
          emailOfDoctor={emailOfDoctor}
          onTimeSlotSelect={handleTimeSlotSelect}
          selectedTimeSlotbyPatient={selectedTimeSlot}
        />
      </div>
      <div className="right-container" style={{ flex: 1, paddingLeft: '20px' }}>
{/*         {selectedTimeSlot && (
          <div>
            <Title level={4}>Selected Time Slot</Title>
            <Text strong>Day:</Text> {selectedTimeSlot.day}
            <br />
            <Text strong>Time:</Text> {selectedTimeSlot.time}
            <br />
            <Text strong>Date:</Text> {selectedTimeSlot.date}
            <br />
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Sender;
