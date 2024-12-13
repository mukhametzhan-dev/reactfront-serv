import React, { useState, useEffect } from 'react';
import { Table, message, DatePicker, Typography } from 'antd';
import axios from 'axios';
import './WeeklySchedule.css';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import { ColumnType } from 'antd/es/table';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Text } = Typography;

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timeSlots: string[] = [];
for (let hour = 6; hour < 22; hour++) {
  timeSlots.push(`${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`);
}

interface ScheduleResponse {
  email: string;
  schedule: {
    day: string;
    time: [string, string];
  }[];
}

interface WeeklyScheduleProps {
  emailOfDoctor?: string;
  onTimeSlotSelect?: (timeSlot: { day: string; time: string; date: string }) => void;
  selectedTimeSlotbyPatient?: { day: string; time: string; date: string } | null;
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  emailOfDoctor,
  onTimeSlotSelect,
  selectedTimeSlotbyPatient,
}) => {
  const [availability, setAvailability] = useState<{ [key: string]: boolean }>({});
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: string; time: string; date: string } | null>(
    selectedTimeSlotbyPatient || null
  );

  useEffect(() => {
    if (emailOfDoctor) {
      fetchExistingSchedule(emailOfDoctor);
    }
  }, [emailOfDoctor]);

  const fetchExistingSchedule = async (email: string) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/get_schedule`, {
        params: { email },
      });
      if (response.status === 200 && response.data.schedule) {
        const existingSchedule: ScheduleResponse = response.data;
        const existingAvailability: { [key: string]: boolean } = {};
        existingSchedule.schedule.forEach((item) => {
          const day = capitalizeFirstLetter(item.day);
          const startTime = dayjs(item.time[0], 'HH:mm');
          const endTime = dayjs(item.time[1], 'HH:mm');
          timeSlots.forEach((slot) => {
            const [slotStart, slotEnd] = slot.split('-').map((time) => dayjs(time, 'HH:mm'));
            if (
              (slotStart.isSameOrAfter(startTime) && slotStart.isBefore(endTime)) ||
              (slotEnd.isAfter(startTime) && slotEnd.isSameOrBefore(endTime)) ||
              (slotStart.isSameOrBefore(startTime) && slotEnd.isSameOrAfter(endTime)) ||
              (slotStart.isAfter(startTime) && slotEnd.isBefore(endTime))
            ) {
              const key = `${day}-${slotStart.format('HH:mm')}`;
              existingAvailability[key] = true;
            }
          });
        });
        setAvailability(existingAvailability);
      }
    } catch (error) {
      console.error('Error fetching existing schedule:', error);
      message.error('Failed to fetch existing schedule.');
    }
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeSlotClick = (day: string, time: string) => {
    const selectedDayNumber = daysOfWeek.indexOf(day);
    const selectedDay = dayjs(selectedDate).day(selectedDayNumber + 1);
    const selectedTimeSlot = {
      day,
      time,
      date: selectedDay.format('YYYY-MM-DD'),
    };
    setSelectedTimeSlot(selectedTimeSlot);
    if (onTimeSlotSelect) {
      onTimeSlotSelect(selectedTimeSlot);
    }
  };

  const columns: Array<ColumnType<{ time: string }>> = [
    {
      title: 'Time',
      dataIndex: 'time',
      fixed: 'left',
      width: 80,
      align: 'center',
    },
    ...daysOfWeek.map((day) => ({
      title: <div style={{ whiteSpace: 'nowrap' }}>{day}</div>,
      dataIndex: day,
      width: 80,
      align: 'center',
      render: (_: any, record: any) => {
        const key = `${day}-${record.time.split('-')[0]}`;
        const isAvailable = availability[key];
        const isSelected =
          selectedTimeSlot?.day === day && record.time === selectedTimeSlot.time;
        return (
          <div
            className={`cell ${isAvailable ? 'available' : 'unavailable'} ${
              isSelected ? 'selected' : ''
            }`}
            onClick={() => isAvailable && handleTimeSlotClick(day, record.time)}
          />
        );
      },
    })),
  ];

  const data = timeSlots.map((time) => {
    const row: any = { time };
    daysOfWeek.forEach((day) => {
      row[day] = null;
    });
    return row;
  });

  const capitalizeFirstLetter = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  return (
    <div className="weekly-schedule">
      <DatePicker
        value={selectedDate}
        onChange={handleDateChange}
        disabledDate={(current) =>
          current && (current < dayjs().startOf('day') || current > dayjs().add(4, 'week'))
        }
        style={{ marginBottom: '16px' }}
      />
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        scroll={{ x: 'max-content', y: 400 }}
        className="schedule-table"
        rowKey={(record) => record.time}
      />
      {selectedTimeSlot && (
        <div className="selected-time-slot">
          <Typography.Title level={4}>Selected Time Slot</Typography.Title>
          <Text strong>Day:</Text> {selectedTimeSlot.day}
          <br />
          <Text strong>Time:</Text> {selectedTimeSlot.time}
          <br />
          <Text strong>Date:</Text> {selectedTimeSlot.date}
        </div>
      )}
    </div>
  );
};

export default WeeklySchedule;